import jwt from 'jsonwebtoken';

export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

export const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  // Cross-site hosting (e.g. Hostinger frontend + Render backend) requires SameSite=none; Secure=true
  const sameSite = process.env.COOKIE_SAMESITE || (isProduction ? 'none' : 'lax');
  const secure = process.env.COOKIE_SECURE !== undefined
    ? process.env.COOKIE_SECURE === 'true'
    : (sameSite === 'none' ? true : isProduction);
  const domain = process.env.COOKIE_DOMAIN || undefined;

  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    sameSite,
    secure
  };

  if (domain) {
    options.domain = domain;
  }

  return options;
};

export const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  const cookieOptions = getCookieOptions();

  res.cookie('token', token, cookieOptions);

  res.status(statusCode).json({
    success: true,
    message: 'Authentication successful',
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        mustChangePassword: !!user.mustChangePassword
      }
    }
  });
};

