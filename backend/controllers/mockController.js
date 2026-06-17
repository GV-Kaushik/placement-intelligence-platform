import pool from '../config/db.js';
import { generateNextQuestion, evaluateInterview } from '../services/geminiService.js';

/**
 * Start a new mock interview session
 */
export async function startMockInterview(req, res) {
  const { company_name, role, difficulty } = req.body;
  // Get the logged-in user's ID from req.user (populated securely by protect middleware)
  const userId = req.user.id;

  // Validate: Make sure all required fields are filled
  if (!company_name || !role || !difficulty) {
    return res.status(400).json({
      success: false,
      message: 'Please provide company name, role, and difficulty level.'
    });
  }

  try {
    // 1. Create a new mock interview row in the database.
    // Explanation of syntax:
    // - ($1, $2, $3, $4) are parameter placeholders to prevent SQL Injection security risks.
    // - '[]'::jsonb casts a text string of an empty list into an optimized binary JSONB format.
    // - 'in_progress' is the starting status (active interview chat).
    // - RETURNING * tells PostgreSQL to return the entire newly created row (including generated UUIDs).
    const createQuery = `
      INSERT INTO mock_interviews (user_id, company_name, role, difficulty, chat_history, status)
      VALUES ($1, $2, $3, $4, '[]'::jsonb, 'in_progress')
      RETURNING *
    `;
    const result = await pool.query(createQuery, [userId, company_name, role, difficulty]);
    const session = result.rows[0];

    // 2. Call our AI service to generate the very first question (passing empty history)
    const firstQuestion = await generateNextQuestion([], company_name, role, difficulty);

    // 3. Put the first question into the history array
    const initialHistory = [{ role: 'model', text: firstQuestion }];

    // 4. Update the database row with this initial history array
    const updateQuery = `
      UPDATE mock_interviews
      SET chat_history = $1::jsonb
      WHERE id = $2 AND user_id = $3
      RETURNING *
    `;
    const updatedResult = await pool.query(updateQuery, [JSON.stringify(initialHistory), session.id, userId]);

    // 5. Send the active session back to the React frontend
    res.status(201).json({
      success: true,
      interview: updatedResult.rows[0]
    });
  } catch (error) {
    console.error('Error starting mock interview:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error: Failed to initiate mock interview session.'
    });
  }
}

/**
 * Handle user messages, generate the next question or trigger final evaluation
 */
export async function sendMessage(req, res) {
  const { id } = req.params;
  const { message } = req.body;
  const userId = req.user.id;

  // Validate message
  if (!message || message.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Message content cannot be empty.'
    });
  }

  try {
    // 1. Fetch the current session details
    const sessionQuery = `
      SELECT * FROM mock_interviews
      WHERE id = $1 AND user_id = $2
    `;
    const sessionRes = await pool.query(sessionQuery, [id, userId]);

    if (sessionRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mock interview session not found.'
      });
    }

    const session = sessionRes.rows[0];

    // If the interview is already over, prevent new messages
    if (session.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'This interview session has already been completed.'
      });
    }

    // 2. Append the user response to the chat history
    const history = session.chat_history;
    history.push({ role: 'user', text: message });

    // --- COUNT USER RESPONSES USING A LOOP ---
    // We count how many responses the candidate has submitted so far
    let userResponsesCount = 0;
    for (let i = 0; i < history.length; i++) {
      if (history[i].role === 'user') {
        userResponsesCount = userResponsesCount + 1;
      }
    }

    const maxQuestions = 5;

    if (userResponsesCount < maxQuestions) {
      // --- INTERVIEW IS STILL ACTIVE: GET NEXT QUESTION ---
      const nextQuestion = await generateNextQuestion(history, session.company_name, session.role, session.difficulty);
      history.push({ role: 'model', text: nextQuestion });

      // Save the updated history back to the mock_interviews table
      const updateQuery = `
        UPDATE mock_interviews
        SET chat_history = $1::jsonb
        WHERE id = $2 AND user_id = $3
        RETURNING *
      `;
      const updateRes = await pool.query(updateQuery, [JSON.stringify(history), id, userId]);

      return res.status(200).json({
        success: true,
        status: 'in_progress',
        interview: updateRes.rows[0]
      });
      
    } else {
      // --- INTERVIEW IS FINISHED: EVALUATE ---
      // First, save the updated history (with the user's 5th response) so the transcript is complete
      const saveHistoryQuery = `
        UPDATE mock_interviews
        SET chat_history = $1::jsonb
        WHERE id = $2 AND user_id = $3
      `;
      await pool.query(saveHistoryQuery, [JSON.stringify(history), id, userId]);

      // Call our evaluation service to get scores and feedback
      const scorecard = await evaluateInterview(history, session.company_name, session.role, session.difficulty);

      // Save the feedback details into the interview_feedbacks table
      const insertFeedbackQuery = `
        INSERT INTO interview_feedbacks (
          mock_interview_id, dsa_score, os_score, dbms_score, cn_score, overall_score, feedback_details, weak_areas
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
        RETURNING *
      `;
      const feedbackRes = await pool.query(insertFeedbackQuery, [
        id,
        scorecard.dsa_score,
        scorecard.os_score,
        scorecard.dbms_score,
        scorecard.cn_score,
        scorecard.overall_score,
        scorecard.feedback_details,
        JSON.stringify(scorecard.weak_areas)
      ]);

      // Mark the interview session as completed
      const completeSessionQuery = `
        UPDATE mock_interviews
        SET status = 'completed'
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `;
      const updatedSessionRes = await pool.query(completeSessionQuery, [id, userId]);

      // Update the user's readiness score in the users table to show their progress!
      const updateUserQuery = `
        UPDATE users
        SET readiness_score = $1
        WHERE id = $2
      `;
      await pool.query(updateUserQuery, [scorecard.overall_score, userId]);

      return res.status(200).json({
        success: true,
        status: 'completed',
        interview: updatedSessionRes.rows[0],
        feedback: feedbackRes.rows[0]
      });
    }
  } catch (error) {
    console.error('Error handling mock interview chat message:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error: Failed to process chat message.'
    });
  }
}

/**
 * Retrieve a mock interview session and its feedback scorecard if completed
 */
export async function getMockInterview(req, res) {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // 1. Fetch the mock interview from the database
    const interviewQuery = `
      SELECT * FROM mock_interviews
      WHERE id = $1 AND user_id = $2
    `;
    const interviewRes = await pool.query(interviewQuery, [id, userId]);

    // If it doesn't exist or doesn't belong to this user, return a 404 error
    if (interviewRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mock interview session not found.'
      });
    }

    // --- WHY ROWS[0] IS USED ---
    // The database library ('pg') always returns query results as a list (an array) inside 'result.rows'.
    // Since 'id' is a unique Primary Key, this array is guaranteed to have either 0 or 1 item.
    // To work with the actual object directly (instead of the array wrapper), we extract the first item at index 0.
    const interview = interviewRes.rows[0];
    let feedback = null;

    // 2. If the interview is finished, fetch its scorecard feedback
    if (interview.status === 'completed') {
      const feedbackQuery = `
        SELECT * FROM interview_feedbacks
        WHERE mock_interview_id = $1
      `;
      const feedbackRes = await pool.query(feedbackQuery, [id]);
      
      if (feedbackRes.rows.length > 0) {
        feedback = feedbackRes.rows[0];
      }
    }

    // 3. Send both back to the frontend
    res.status(200).json({
      success: true,
      interview,
      feedback
    });
  } catch (error) {
    console.error('Error retrieving mock interview details:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error: Failed to fetch mock interview session details.'
    });
  }
}
