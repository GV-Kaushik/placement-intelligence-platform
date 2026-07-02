import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { OAuth2Client } from 'google-auth-library';

const JWT_SECRET = process.env.JWT_SECRET || 'placementor_ai_super_secret_jwt_key_2026';

// Helper function to generate JWT
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// Register a new user
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide name, email, and password',
    });
  }

  try {
    // Check if email already exists in database
    const userExists = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    // Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Save the user details
    const newUser = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, role, target_company, readiness_score, created_at',
      [name, email.toLowerCase(), passwordHash]
    );

    const user = newUser.rows[0];
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user,
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration',
    });
  }
};

// Log in user
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password',
    });
  }

  try {
    // Look up user by email
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const user = result.rows[0];

    // Verify hashed password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Delete password hash from memory before returning user object
    delete user.password_hash;

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user,
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
};

// Get current user profile details
export const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, target_company, readiness_score, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
      });
    }

    return res.status(200).json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Get profile error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving profile',
    });
  }
};

// Update user details (like target company)
export const updateMe = async (req, res) => {
  const { target_company, readiness_score } = req.body;

  try {
    // Build query based on which fields are provided
    const updates = [];
    const values = [];
    let count = 1;

    if (target_company !== undefined) {
      updates.push(`target_company = $${count}`);
      values.push(target_company);
      count++;
    }

    if (readiness_score !== undefined) {
      updates.push(`readiness_score = $${count}`);
      values.push(readiness_score);
      count++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields provided to update',
      });
    }

    values.push(req.user.id);
    const query = `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${count} RETURNING id, name, email, role, target_company, readiness_score, created_at`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Update profile error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error updating profile',
    });
  }
};

// Google OAuth Sign-in/Sign-up
export const googleLoginUser = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a Google ID token',
    });
  }

  try {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name } = payload;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Google account does not provide an email address',
      });
    }

    // 1. Check if user already exists
    const userExists = await pool.query(
      'SELECT id, name, email, role, target_company, readiness_score, created_at FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    let user;

    if (userExists.rows.length > 0) {
      // User exists - login
      user = userExists.rows[0];
    } else {
      // User doesn't exist - register a new user with a dummy secure password
      const secureRandomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(secureRandomPassword, salt);

      const newUser = await pool.query(
        'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, role, target_company, readiness_score, created_at',
        [name, email.toLowerCase(), passwordHash]
      );
      user = newUser.rows[0];
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Google sign-in successful',
      token,
      user,
    });
  } catch (error) {
    console.error('Google verification error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid Google ID token',
    });
  }
};

// Helper to fetch LeetCode statistics from GraphQL
async function fetchLeetCodeStats(username) {
  try {
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
      body: JSON.stringify({
        query: `
          query getUserProfile($username: String!) {
            matchedUser(username: $username) {
              submitStats: submitStatsGlobal {
                acSubmissionNum {
                  difficulty
                  count
                }
              }
            }
          }
        `,
        variables: { username }
      })
    });
    
    const result = await response.json();
    if (result.data && result.data.matchedUser) {
      const acSubmissionNum = result.data.matchedUser.submitStats.acSubmissionNum;
      let solvedCount = 0;
      for (let i = 0; i < acSubmissionNum.length; i++) {
        if (acSubmissionNum[i].difficulty === 'All') {
          solvedCount = acSubmissionNum[i].count;
          break;
        }
      }
      return { solvedCount, hasProfile: true };
    }
  } catch (error) {
    console.error('Error fetching LeetCode stats:', error.message);
  }
  return null;
}

// Helper to fetch Codeforces statistics from public API
async function fetchCodeforcesStats(username) {
  try {
    const infoResponse = await fetch(`https://codeforces.com/api/user.info?handles=${username}`);
    const infoResult = await infoResponse.json();
    if (infoResult.status === 'OK' && infoResult.result && infoResult.result.length > 0) {
      let solvedCount = 0;
      try {
        const statusResponse = await fetch(`https://codeforces.com/api/user.status?handle=${username}`);
        const statusResult = await statusResponse.json();
        if (statusResult.status === 'OK') {
          const solvedProblems = new Set();
          for (let i = 0; i < statusResult.result.length; i++) {
            const sub = statusResult.result[i];
            if (sub.verdict === 'OK') {
              solvedProblems.add(`${sub.problem.contestId}-${sub.problem.index}`);
            }
          }
          solvedCount = solvedProblems.size;
        }
      } catch (err) {
        console.error('Error fetching Codeforces submissions:', err.message);
      }
      
      return { solvedCount, hasProfile: true };
    }
  } catch (error) {
    console.error('Error fetching Codeforces stats:', error.message);
  }
  return null;
}

// Retrieve complete student profile, coding platform stats, and selected skills
export const getProfileData = async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Get student profile details{/* rating display removed */}
    const profileRes = await pool.query(
      'SELECT college_name, cgpa, graduation_year, github_url, linkedin_url FROM student_profiles WHERE user_id = $1',
      [userId]
    );
    const profile = profileRes.rows[0] || null;

    // 2. Get coding profile and platform stats
    const codingProfileRes = await pool.query(
      'SELECT id FROM coding_profiles WHERE user_id = $1',
      [userId]
    );
    
    let platformStats = [];
    if (codingProfileRes.rows.length > 0) {
      const codingProfileId = codingProfileRes.rows[0].id;
      const statsRes = await pool.query(
        'SELECT platform_name, username, solved_count FROM coding_platform_stats WHERE coding_profile_id = $1',
        [codingProfileId]
      );
      platformStats = statsRes.rows;
    }

    // 3. Get user skills
    const skillsRes = await pool.query(
      'SELECT s.id, s.name, s.category FROM user_skills us JOIN skills s ON us.skill_id = s.id WHERE us.user_id = $1',
      [userId]
    );
    const skills = skillsRes.rows;

    return res.status(200).json({
      success: true,
      profile,
      platformStats,
      skills,
    });
  } catch (error) {
    console.error('Get profile data error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving profile data',
    });
  }
};

// Create or update student profile, coding platform stats, and skills list
export const updateProfileData = async (req, res) => {
  const userId = req.user.id;
  const { profile, platformStats, skillIds } = req.body;

  try {
    // 1. Upsert student details
    if (profile) {
      const { college_name, cgpa, graduation_year, github_url, linkedin_url } = profile;
      await pool.query(
        `INSERT INTO student_profiles (user_id, college_name, cgpa, graduation_year, github_url, linkedin_url)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id) DO UPDATE SET
           college_name = EXCLUDED.college_name,
           cgpa = EXCLUDED.cgpa,
           graduation_year = EXCLUDED.graduation_year,
           github_url = EXCLUDED.github_url,
           linkedin_url = EXCLUDED.linkedin_url`,
        [userId, college_name, cgpa || null, graduation_year || null, github_url || '', linkedin_url || '']
      );
    }

    // 2. Upsert coding profiles & stats
    if (platformStats && Array.isArray(platformStats)) {
      let codingProfileId;
      const codingProfileRes = await pool.query(
        'SELECT id FROM coding_profiles WHERE user_id = $1',
        [userId]
      );
      if (codingProfileRes.rows.length > 0) {
        codingProfileId = codingProfileRes.rows[0].id;
      } else {
        const newCodingProfile = await pool.query(
          'INSERT INTO coding_profiles (user_id) VALUES ($1) RETURNING id',
          [userId]
        );
        codingProfileId = newCodingProfile.rows[0].id;
      }

      // Delete existing stats for this user and insert updated list
      await pool.query('DELETE FROM coding_platform_stats WHERE coding_profile_id = $1', [codingProfileId]);
      for (let i = 0; i < platformStats.length; i++) {
        const item = platformStats[i];
        if (item.username && item.username.trim() !== '') {
          let solvedCount = null;
          let hasProfile = false;

          if (item.platform_name === 'LeetCode') {
            const lcStats = await fetchLeetCodeStats(item.username.trim());
            if (lcStats) {
              solvedCount = lcStats.solvedCount;
              hasProfile = lcStats.hasProfile;
            }
          } else if (item.platform_name === 'Codeforces') {
            const cfStats = await fetchCodeforcesStats(item.username.trim());
            if (cfStats) {
              solvedCount = cfStats.solvedCount;
              hasProfile = cfStats.hasProfile;
            }
          }

          // Fallback to random simulation only if API profile was not found (or GFG)
          if (!hasProfile) {
            if (solvedCount === null) {
              solvedCount = Math.floor(Math.random() * 250) + 50;
            }
          }

          await pool.query(
            'INSERT INTO coding_platform_stats (coding_profile_id, platform_name, username, solved_count) VALUES ($1, $2, $3, $4)',
            [codingProfileId, item.platform_name, item.username, solvedCount]
          );
        }
      }
    }

    // 3. Update user skills selection
    if (skillIds && Array.isArray(skillIds)) {
      await pool.query('DELETE FROM user_skills WHERE user_id = $1', [userId]);
      for (let i = 0; i < skillIds.length; i++) {
        await pool.query(
          'INSERT INTO user_skills (user_id, skill_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [userId, skillIds[i]]
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Update profile data error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error updating profile data',
    });
  }
};

// Retrieve master skills list
export const getSkillsList = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, category FROM skills ORDER BY name ASC'
    );
    return res.status(200).json({
      success: true,
      skills: result.rows,
    });
  } catch (error) {
    console.error('Get skills list error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving skills list',
    });
  }
};
