import pool from '../config/db.js';

// Get all experiences (with filters and search query)
export const getExperiences = async (req, res) => {
  const { company_id, role, result, q } = req.query;
  const userId = req.user?.id; // will be populated if request goes through protectOptional middleware

  try {
    let queryText = `
      SELECT 
        e.id, e.role, e.result, e.rounds, 
        e.questions, e.upvotes, e.created_at,
        c.id as company_id, c.name as company_name, c.logo_url as company_logo,
        u.name as user_name,
        EXISTS(SELECT 1 FROM experience_upvotes WHERE experience_id = e.id AND user_id = $1) as has_upvoted
      FROM experiences e
      JOIN companies c ON e.company_id = c.id
      JOIN users u ON e.user_id = u.id
      WHERE 1=1
    `;

    const values = [userId || null]; // $1 is always userId (or null)
    let paramIndex = 2;

    // Filter by Company ID
    if (company_id) {
      queryText += ` AND e.company_id = $${paramIndex}`;
      values.push(parseInt(company_id, 10));
      paramIndex++;
    }

    // Filter by Role Name
    if (role) {
      queryText += ` AND e.role ILIKE $${paramIndex}`;
      values.push(`%${role}%`);
      paramIndex++;
    }

    // Filter by Interview Result (Selected/Rejected)
    if (result) {
      queryText += ` AND e.result = $${paramIndex}`;
      values.push(result);
      paramIndex++;
    }

    // Keyword Search (searches company, role, rounds, and questions)
    if (q && q.trim() !== '') {
      const keywords = q.trim().split(/\s+/).filter(Boolean);
      const searchConditions = [];

      for (let i = 0; i < keywords.length; i++) {
        const keyword = keywords[i];
        values.push(`%${keyword}%`);
        searchConditions.push(
          `(c.name ILIKE $${paramIndex} OR 
            e.role ILIKE $${paramIndex} OR 
            e.rounds::text ILIKE $${paramIndex} OR 
            e.questions::text ILIKE $${paramIndex})`
        );
        paramIndex++;
      }

      if (searchConditions.length > 0) {
        queryText += ` AND (${searchConditions.join(' AND ')})`;
      }
    }

    // Sort by newest submissions first
    queryText += ` ORDER BY e.created_at DESC`;

    const dbResult = await pool.query(queryText, values);

    return res.status(200).json({
      success: true,
      count: dbResult.rows.length,
      experiences: dbResult.rows,
    });
  } catch (error) {
    console.error('Error fetching experiences:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving experiences',
    });
  }
};

// Get a single experience by ID
export const getExperienceById = async (req, res) => {
  const expId = req.params.id;
  const userId = req.user?.id;

  try {
    const queryText = `
      SELECT 
        e.id, e.role, e.result, e.rounds, 
        e.questions, e.upvotes, e.created_at,
        c.id as company_id, c.name as company_name, c.logo_url as company_logo,
        u.name as user_name,
        EXISTS(SELECT 1 FROM experience_upvotes WHERE experience_id = e.id AND user_id = $1) as has_upvoted
      FROM experiences e
      JOIN companies c ON e.company_id = c.id
      JOIN users u ON e.user_id = u.id
      WHERE e.id = $2
    `;

    const result = await pool.query(queryText, [userId || null, expId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found',
      });
    }

    return res.status(200).json({
      success: true,
      experience: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching experience details:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving experience details',
    });
  }
};

// Submit a new placement experience
export const createExperience = async (req, res) => {
  const {
    company_name,
    company_id,
    role,
    result,
    rounds,
    questions,
  } = req.body;

  if (!role || !result) {
    return res.status(400).json({
      success: false,
      message: 'Role and Result are required fields',
    });
  }

  try {
    let resolvedCompanyId = company_id;

    // If company_id was not selected from dropdown, look it up or create a new entry
    if (!resolvedCompanyId && company_name) {
      const companyQuery = await pool.query(
        'SELECT id FROM companies WHERE name ILIKE $1',
        [company_name.trim()]
      );

      if (companyQuery.rows.length > 0) {
        resolvedCompanyId = companyQuery.rows[0].id;
      } else {
        // Create new company dynamically
        const newCompany = await pool.query(
          'INSERT INTO companies (name, description) VALUES ($1, $2) RETURNING id',
          [company_name.trim(), `Interviews and hiring information for ${company_name}`]
        );
        resolvedCompanyId = newCompany.rows[0].id;
      }
    }

    if (!resolvedCompanyId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either a valid company_id or company_name',
      });
    }

    const parsedRounds = Array.isArray(rounds) ? JSON.stringify(rounds) : '[]';
    const parsedQuestions = Array.isArray(questions) ? JSON.stringify(questions) : '[]';

    const insertQuery = `
      INSERT INTO experiences 
        (user_id, company_id, role, result, rounds, questions)
      VALUES 
        ($1, $2, $3, $4, $5::jsonb, $6::jsonb)
      RETURNING *
    `;

    const resultExp = await pool.query(insertQuery, [
      req.user.id,
      resolvedCompanyId,
      role,
      result,
      parsedRounds,
      parsedQuestions,
    ]);

    return res.status(201).json({
      success: true,
      message: 'Experience submitted successfully',
      experience: resultExp.rows[0],
    });
  } catch (error) {
    console.error('Error creating experience:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error saving placement experience',
    });
  }
};

// Toggle upvote / like for an experience
export const toggleUpvoteExperience = async (req, res) => {
  const expId = req.params.id;
  const userId = req.user.id;

  try {
    // 1. Verify experience exists
    const expCheck = await pool.query('SELECT id, upvotes FROM experiences WHERE id = $1', [expId]);
    if (expCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found',
      });
    }

    // 2. Check if student already upvoted this row
    const upvoteCheck = await pool.query(
      'SELECT 1 FROM experience_upvotes WHERE user_id = $1 AND experience_id = $2',
      [userId, expId]
    );

    let hasUpvoted = false;
    let newUpvotesCount = expCheck.rows[0].upvotes;

    if (upvoteCheck.rows.length > 0) {
      // Already upvoted, so remove it
      await pool.query(
        'DELETE FROM experience_upvotes WHERE user_id = $1 AND experience_id = $2',
        [userId, expId]
      );
      newUpvotesCount = Math.max(0, newUpvotesCount - 1);
      hasUpvoted = false;
    } else {
      // Add a new upvote
      await pool.query(
        'INSERT INTO experience_upvotes (user_id, experience_id) VALUES ($1, $2)',
        [userId, expId]
      );
      newUpvotesCount += 1;
      hasUpvoted = true;
    }

    // Cache the upvotes count back on the experience row
    await pool.query('UPDATE experiences SET upvotes = $1 WHERE id = $2', [newUpvotesCount, expId]);

    return res.status(200).json({
      success: true,
      hasUpvoted,
      upvotes: newUpvotesCount,
      message: hasUpvoted ? 'Experience upvoted' : 'Upvote removed',
    });
  } catch (error) {
    console.error('Error toggling upvote:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error updating upvote status',
    });
  }
};
