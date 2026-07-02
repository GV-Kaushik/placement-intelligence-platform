import pool from '../config/db.js';

/**
 * Add a new job application
 */
export async function createApplication(req, res) {
  const { company_id, role, status } = req.body;
  const userId = req.user.id;

  if (!company_id || !role) {
    return res.status(400).json({
      success: false,
      message: 'Please provide both the company and the job role.'
    });
  }

  try {
    const insertQuery = `
      INSERT INTO applications (user_id, company_id, role, status)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [
      userId,
      company_id,
      role,
      status || 'Applied'
    ]);

    // Fetch the company name to return a complete object to the frontend
    const companyRes = await pool.query('SELECT name FROM companies WHERE id = $1', [company_id]);
    const application = result.rows[0];
    application.company_name = companyRes.rows[0]?.name || 'Unknown Company'; // since no field of company name in application

    res.status(201).json({
      success: true,
      application
    });
  } catch (error) {
    console.error('Error creating application:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error: Failed to add job application.'
    });
  }
}

/**
 * Retrieve all applications of the logged-in student
 */
export async function getApplications(req, res) {
  const userId = req.user.id;

  try {
    const selectQuery = `
      SELECT 
        a.id, 
        a.role, 
        a.status, 
        a.applied_at, 
        c.id AS company_id, 
        c.name AS company_name, 
        c.logo_url AS company_logo
      FROM applications a
      JOIN companies c ON a.company_id = c.id
      WHERE a.user_id = $1
      ORDER BY a.applied_at DESC
    `;
    const result = await pool.query(selectQuery, [userId]);

    res.status(200).json({
      success: true,
      applications: result.rows
    });
  } catch (error) {
    console.error('Error fetching applications:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error: Failed to fetch job applications.'
    });
  }
}

/**
 * Update the status of a specific job application
 */
export async function updateApplicationStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user.id;

  const validStatuses = ['Applied', 'OA', 'Interviewing', 'Selected', 'Rejected'];
  if (!validStatuses.includes(status)) {// Actuallt not needed
    return res.status(400).json({
      success: false,
      message: 'Invalid application status.'
    });
  }

  try {
    const updateQuery = `
      UPDATE applications
      SET status = $1
      WHERE id = $2 AND user_id = $3
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [status, id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or unauthorized.'
      });
    }

    res.status(200).json({
      success: true,
      application: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating application status:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error: Failed to update application status.'
    });
  }
}

/**
 * Delete a job application record
 */
export async function deleteApplication(req, res) {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const deleteQuery = `
      DELETE FROM applications
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await pool.query(deleteQuery, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or unauthorized.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Application deleted successfully.',
      application: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting application:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error: Failed to delete job application.'
    });
  }
}
