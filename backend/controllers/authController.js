/**
 * Authentication Controller
 * Manages user registration, login, logout, current user session, and profile updates.
 */
const userService = require('../services/userService');
const { generateAuthToken } = require('../utils/authUtils');

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const user = await userService.registerUser({ name, email, password });
    const token = generateAuthToken({ userId: user.userId, email: user.email, name: user.name });

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        user,
        token
      }
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, error: err.message });
    }
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await userService.authenticateUser({ email, password });
    const token = generateAuthToken({ userId: user.userId, email: user.email, name: user.name });

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user,
        token
      }
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, error: err.message });
    }
    next(err);
  }
}

async function logout(req, res) {
  res.json({
    success: true,
    message: 'Logged out successfully.'
  });
}

async function getMe(req, res, next) {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Authentication required.' });
    }

    const user = await userService.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User account not found.' });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Authentication required.' });
    }

    const updated = await userService.updateUserProfile(req.user.userId, req.body);
    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile
};
