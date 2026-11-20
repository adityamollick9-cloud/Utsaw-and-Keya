import jwt from 'jsonwebtoken';
import { Admin } from '../models/Admin.js';
import { Rsvp } from '../models/Rsvp.js';
import { Blessing } from '../models/Blessing.js';

// Admin Login
export async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.'
      });
    }

    const admin = await Admin.findOne({ username: username.trim().toLowerCase() });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
    }

    const payload = {
      id: admin._id,
      username: admin.username
    };

    const secret = process.env.JWT_SECRET || 'wedding_jwt_secret_fallback';
    const token = jwt.sign(payload, secret, { expiresIn: '24h' });

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      admin: {
        username: admin.username
      }
    });
  } catch (err) {
    next(err);
  }
}

// Current logged in admin check
export async function getMe(req, res) {
  res.json({
    success: true,
    admin: req.admin
  });
}

// Live Dashboard Statistics
export async function getStatistics(req, res, next) {
  try {
    const [
      totalRsvps,
      attendingCount,
      notAttendingCount,
      totalBlessings,
      recentRsvps,
      recentBlessings,
      eventAggregation,
      timelineAggregation
    ] = await Promise.all([
      Rsvp.countDocuments(),
      Rsvp.countDocuments({ attending: 'yes' }),
      Rsvp.countDocuments({ attending: 'no' }),
      Blessing.countDocuments(),
      Rsvp.find().sort({ createdAt: -1 }).limit(5).lean(),
      Blessing.find().sort({ createdAt: -1 }).limit(5).lean(),
      Rsvp.aggregate([
        { $match: { attending: 'yes' } },
        { $unwind: '$events' },
        { $group: { _id: '$events', count: { $sum: 1 } } }
      ]),
      Rsvp.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            rsvps: { $sum: 1 },
            attending: {
              $sum: { $cond: [{ $eq: ['$attending', 'yes'] }, 1, 0] }
            }
          }
        },
        { $sort: { _id: 1 } },
        { $limit: 30 }
      ])
    ]);

    const eventNames = {
      'haldi-ceremony': 'Haldi Ceremony (3 Jan)',
      'haldi-night-dinner': 'Haldi Night Dinner (3 Jan)',
      'holy-matrimony': 'Holy Matrimony (4 Jan)',
      'wedding-dinner': 'Wedding Dinner (4 Jan)',
      'farewell': 'Farewell (4 Jan)'
    };

    const eventCounts = {};
    for (const key of Object.keys(eventNames)) {
      const match = eventAggregation.find(e => e._id === key);
      eventCounts[key] = {
        name: eventNames[key],
        count: match ? match.count : 0
      };
    }

    res.json({
      success: true,
      data: {
        summary: {
          totalRsvps,
          attendingCount,
          notAttendingCount,
          totalBlessings,
          attendanceRate: totalRsvps > 0 ? Math.round((attendingCount / totalRsvps) * 100) : 0
        },
        eventCounts,
        timeline: timelineAggregation.map(t => ({
          date: t._id,
          rsvps: t.rsvps,
          attending: t.attending
        })),
        recentActivity: {
          rsvps: recentRsvps,
          blessings: recentBlessings
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

