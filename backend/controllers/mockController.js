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
    // Create new mock interview session in the database
    const createQuery = `
      INSERT INTO mock_interviews (user_id, company_name, role, difficulty, chat_history, status)
      VALUES ($1, $2, $3, $4, '[]'::jsonb, 'in_progress')
      RETURNING *
    `;
    const result = await pool.query(createQuery, [userId, company_name, role, difficulty]);
    const session = result.rows[0];

    // Generate first question using Gemini API
    const firstQuestion = await generateNextQuestion([], company_name, role, difficulty);

    // Save initial question into history
    const initialHistory = [{ role: 'model', text: firstQuestion }];

    const updateQuery = `
      UPDATE mock_interviews
      SET chat_history = $1::jsonb
      WHERE id = $2 AND user_id = $3
      RETURNING *
    `;
    const updatedResult = await pool.query(updateQuery, [JSON.stringify(initialHistory), session.id, userId]);

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

  if (!message || message.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Message content cannot be empty.'
    });
  }

  try {
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

    if (session.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'This interview session has already been completed.'
      });
    }

    // Append candidate response to history
    const history = session.chat_history;
    history.push({ role: 'user', text: message });

    // Count candidate responses
    let userResponsesCount = 0;
    for (let i = 0; i < history.length; i++) {
      if (history[i].role === 'user') {
        userResponsesCount = userResponsesCount + 1;
      }
    }

    const maxQuestions = 5;

    if (userResponsesCount < maxQuestions) {
      // Generate next question
      const nextQuestion = await generateNextQuestion(history, session.company_name, session.role, session.difficulty);
      history.push({ role: 'model', text: nextQuestion });

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
      // Complete interview and evaluate transcript
      const saveHistoryQuery = `
        UPDATE mock_interviews
        SET chat_history = $1::jsonb
        WHERE id = $2 AND user_id = $3
      `;
      await pool.query(saveHistoryQuery, [JSON.stringify(history), id, userId]);

      const scorecard = await evaluateInterview(history, session.company_name, session.role, session.difficulty);

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

      const completeSessionQuery = `
        UPDATE mock_interviews
        SET status = 'completed'
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `;
      const updatedSessionRes = await pool.query(completeSessionQuery, [id, userId]);

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
    const interviewQuery = `
      SELECT * FROM mock_interviews
      WHERE id = $1 AND user_id = $2
    `;
    const interviewRes = await pool.query(interviewQuery, [id, userId]);

    if (interviewRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mock interview session not found.'
      });
    }

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

/**
 * Retrieve all mock interview sessions for the logged-in user
 */
export async function getUserMockInterviews(req, res) {
  const userId = req.user.id;

  try {
    const queryText = `
      SELECT 
        mi.id, mi.company_name, mi.role, mi.difficulty, mi.status, mi.created_at,
        f.overall_score
      FROM mock_interviews mi
      LEFT JOIN interview_feedbacks f ON mi.id = f.mock_interview_id
      WHERE mi.user_id = $1
      ORDER BY mi.created_at DESC
    `;
    const result = await pool.query(queryText, [userId]);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      interviews: result.rows
    });
  } catch (error) {
    console.error('Error retrieving user mock interviews:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error: Failed to fetch mock interviews history.'
    });
  }
}
