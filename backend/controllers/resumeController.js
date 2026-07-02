import pool from '../config/db.js';
import { PDFParse } from 'pdf-parse';
import { analyzeResume } from '../services/geminiService.js';

/**
 * Handle PDF upload, extract text, evaluate via Gemini, and store in DB
 */
export async function uploadAndEvaluateResume(req, res) {
  const userId = req.user.id;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a PDF file.'
    });
  }

  try {
    // Extract text from the PDF buffer in memory using the new PDFParse ESM class
    const pdfData = new PDFParse({ data: new Uint8Array(req.file.buffer) });
    const textResult = await pdfData.getText();
    const parsedText = textResult.text;

    // Validate minimum extracted character length (at least 50 characters)
    if (!parsedText || parsedText.trim().length < 50) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract sufficient text from PDF. Please upload a valid, selectable text PDF (not a scanned image).'
      });
    }

    // Call Gemini Service to analyze the resume content
    const analysis = await analyzeResume(parsedText);

    // Save evaluation to database
    const insertQuery = `
      INSERT INTO resumes (user_id, file_name, parsed_text, strengths, weaknesses, suggestions)
      VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      userId,
      req.file.originalname,
      parsedText,
      JSON.stringify(analysis.strengths || []),
      JSON.stringify(analysis.weaknesses || []),
      JSON.stringify(analysis.suggestions || [])
    ]);

    res.status(201).json({
      success: true,
      resume: result.rows[0]
    });
  } catch (error) {
    console.error('Error uploading and evaluating resume:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error: Failed to process and analyze resume.'
    });
  }
}

/**
 * Retrieve all previous resume evaluations of the student
 */
export async function getResumes(req, res) {
  const userId = req.user.id;

  try {
    const selectQuery = `
      SELECT id, file_name, strengths, weaknesses, suggestions, created_at
      FROM resumes
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    const result = await pool.query(selectQuery, [userId]);

    res.status(200).json({
      success: true,
      resumes: result.rows
    });
  } catch (error) {
    console.error('Error fetching resumes:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error: Failed to fetch previous resume evaluations.'
    });
  }
}

/**
 * Delete a specific resume evaluation record
 */
export async function deleteResume(req, res) {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const deleteQuery = `
      DELETE FROM resumes
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await pool.query(deleteQuery, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Resume evaluation not found or unauthorized to delete.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Resume evaluation deleted successfully.',
      resume: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting resume evaluation:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error: Failed to delete resume evaluation.'
    });
  }
}
