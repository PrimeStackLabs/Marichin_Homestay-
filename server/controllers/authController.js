import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { sendTokenResponse, getCookieOptions } from '../utils/jwt.js';
import { logActivity } from '../middleware/activityLogger.js';

// @desc    Login user (Admin, Staff, Guest)
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password',
        data: null
      });
    }

    // Find user with password
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        data: null
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact administrator.',
        data: null
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        data: null
      });
    }

    await logActivity({
      user,
      action: 'LOGIN',
      entityType: 'User',
      entityId: user._id,
      details: { role: user.role, email: user.email },
      req
    });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Register a guest user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
        data: null
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
        data: null
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : '',
      passwordHash,
      role: 'guest',
      isActive: true
    });

    await logActivity({
      user,
      action: 'REGISTER_GUEST',
      entityType: 'User',
      entityId: user._id,
      details: { email: user.email },
      req
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      message: 'User profile retrieved',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change user password (required on initial seeded login)
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long',
        data: null
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found', data: null });
    }

    user.passwordHash = passwordHash;
    user.mustChangePassword = false;
    await user.save();

    await logActivity({
      user,
      action: 'CHANGE_PASSWORD',
      entityType: 'User',
      entityId: user._id,
      details: { email: user.email },
      req
    });

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: false
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logout = async (req, res, next) => {
  try {
    const baseOptions = getCookieOptions();
    res.cookie('token', 'none', {
      ...baseOptions,
      expires: new Date(Date.now() + 5 * 1000)
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

