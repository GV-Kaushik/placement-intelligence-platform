import pool from '../config/db.js';

// @desc    Get all companies
// @route   GET /api/companies
// @access  Public
export const getCompanies = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM companies ORDER BY name ASC');
    return res.status(200).json({
      success: true,
      companies: result.rows,
    });
  } catch (error) {
    console.error('Error fetching companies:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving companies',
    });
  }
};

// @desc    Get company details and analytics
// @route   GET /api/companies/:id
// @access  Public
export const getCompanyById = async (req, res) => {
  const companyId = parseInt(req.params.id, 10);

  if (isNaN(companyId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid company ID',
    });
  }

  try {
    // 1. Fetch company base info
    const companyResult = await pool.query('SELECT * FROM companies WHERE id = $1', [companyId]);

    if (companyResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      });
    }

    const company = companyResult.rows[0];

    // 2. Fetch all experiences for this company to calculate analytics
    const experiencesResult = await pool.query(
      `SELECT rounds, questions, result 
       FROM experiences 
       WHERE company_id = $1`,
      [companyId]
    );

    const experiences = experiencesResult.rows;
    const totalExperiences = experiences.length;

    // Initialize analytics counters
    let avgRounds = 0;
    let successCount = 0;
    const topicCounts = {};
    let totalQuestions = 0;

    if (totalExperiences > 0) {
      let totalRoundsSum = 0;

      experiences.forEach((exp) => {
        // Calculate selection count
        if (exp.result === 'Selected') {
          successCount++;
        }

        // Calculate rounds count for this experience
        let roundsList = [];
        try {
          roundsList = typeof exp.rounds === 'string' ? JSON.parse(exp.rounds) : (exp.rounds || []);
        } catch (e) {
          roundsList = [];
        }
        const roundsCount = Array.isArray(roundsList) ? roundsList.length : 0;
        totalRoundsSum += roundsCount;

        // Count topics in JSONB questions
        let qList = [];
        try {
          qList = typeof exp.questions === 'string' ? JSON.parse(exp.questions) : (exp.questions || []);
        } catch (e) {
          qList = [];
        }

        if (Array.isArray(qList)) {
          qList.forEach((q) => {
            if (q.topic && q.topic.trim() !== '') {
              const topicNormalized = q.topic.trim();
              topicCounts[topicNormalized] = (topicCounts[topicNormalized] || 0) + 1;
              totalQuestions++;
            }
          });
        }
      });

      avgRounds = parseFloat((totalRoundsSum / totalExperiences).toFixed(1));
    }

    // Success rate percentage
    const successRate = totalExperiences > 0 ? Math.round((successCount / totalExperiences) * 100) : 0;

    // Convert topic counts to sorted percentages
    const mostAskedTopics = [];
    const entries = Object.entries(topicCounts);
    for (let i = 0; i < entries.length; i++) {
      const topic = entries[i][0];
      const count = entries[i][1];
      const percentage = totalQuestions > 0 ? Math.round((count / totalQuestions) * 100) : 0;
      
      mostAskedTopics.push({
        topic: topic,
        count: count,
        percentage: percentage
      });
    }

    // Sort the list so the most frequent topics appear first
    mostAskedTopics.sort(function(a, b) {
      return b.count - a.count;
    });

    // 3. Compile analytics response object
    const analytics = {
      totalExperiences,
      averageRounds: avgRounds || 3, // Fallback default to 3 if no experiences
      successRate: totalExperiences > 0 ? successRate : 70, // Fallback default success rate
      mostAskedTopics: mostAskedTopics.length > 0 ? mostAskedTopics : [
        { topic: 'Arrays', count: 1, percentage: 35 },
        { topic: 'Strings', count: 1, percentage: 25 },
        { topic: 'DP', count: 1, percentage: 20 },
        { topic: 'Graphs', count: 1, percentage: 20 }
      ], // Seed/placeholder fallback if no topics are available
    };

    return res.status(200).json({
      success: true,
      company,
      analytics,
    });
  } catch (error) {
    console.error('Error fetching company details:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving company details',
    });
  }
};
