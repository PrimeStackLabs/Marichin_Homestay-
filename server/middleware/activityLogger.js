import { ActivityLog } from '../models/ActivityLog.js';

export const logActivity = async ({ req, user, action, entityType, entityId, details }) => {
  try {
    const actor = user || req?.user;
    const ipAddress = req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || req?.ip || '';

    await ActivityLog.create({
      user: actor?._id || null,
      userName: actor?.name || 'System / Admin',
      userRole: actor?.role || 'admin',
      action,
      entityType,
      entityId: entityId ? String(entityId) : '',
      details: details || {},
      ipAddress
    });
  } catch (err) {
    console.error('Failed to write activity log:', err.message);
  }
};

