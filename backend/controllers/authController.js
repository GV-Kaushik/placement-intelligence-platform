import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'placementor_ai_super_secret_jwt_key_2026';

// Helper function to generate JWT
const generateToken = (user) => {
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
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  // Simple validation
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide name, email, and password',
    });
  }

  try {
    // Check if user already exists
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

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const newUser = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, role, target_company, readiness_score, created_at',
      [name, email.toLowerCase(), passwordHash]
    );

    const user = newUser.rows[0];

    // Generate JWT
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

// @desc    Log in user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  // Simple validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password',
    });
  }

  try {
    // Check if user exists
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

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Clean sensitive data
    delete user.password_hash;

    // Generate JWT
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

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
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

// @desc    Update user profile details (e.g. target company)
// @route   PUT /api/auth/me
// @access  Private
export const updateMe = async (req, res) => {
  const { target_company, readiness_score } = req.body;

  try {
    // Dynamically build the UPDATE query based on inputs
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

    // Append user id to values array
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
