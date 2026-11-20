import { Rsvp } from '../models/Rsvp.js';
import { Blessing } from '../models/Blessing.js';
import { escapeRegex } from '../utils/sanitize.js';

const ALLOWED_SORT_FIELDS = ['createdAt', 'firstName', 'lastName', 'email', 'attending', 'updatedAt'];

// Public: Submit RSVP & Blessing
export async function submitRsvp(req, res, next) {
  try {
    const {
      submissionId,
      firstName,
      lastName,
      email,
      phone,
      attending,
      events,
      blessing
    } = req.body;

    const fields = {};
    if (!firstName || typeof firstName !== 'string' || !firstName.trim()) {
      fields.firstName = 'First name is required.';
    }

    if (!attending || !['yes', 'no'].includes(attending)) {
      fields.attending = 'Please let us know if you are attending ("yes" or "no").';
    }

    if (email && typeof email === 'string' && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        fields.email = 'Please provide a valid email address.';
      }
    } else if (email && typeof email !== 'string') {
      fields.email = 'Please provide a valid email address.';
    }

    if (blessing && typeof blessing === 'string' && blessing.trim().length > 500) {
      fields.blessing = 'Blessing cannot exceed 500 characters.';
    } else if (blessing && typeof blessing !== 'string') {
      fields.blessing = 'Blessing must be text.';
    }

    if (Object.keys(fields).length > 0) {
      return res.status(400).json({
        ok: false,
        success: false,
        message: 'Please check the submitted information.',
        fields
      });
    }

    const trimmedSubId = submissionId && typeof submissionId === 'string' ? submissionId.trim() : undefined;

    // Check idempotency if client provided a submissionId
    if (trimmedSubId) {
      const existing = await Rsvp.findOne({ submissionId: trimmedSubId });
      if (existing) {
        return res.status(200).json({
          ok: true,
          success: true,
          message: 'Your response has already been recorded.',
          data: {
            id: existing._id,
            firstName: existing.firstName,
            attending: existing.attending
          }
        });
      }
    }

    // Filter valid events array
    const validEventsList = [
      'haldi-ceremony',
      'haldi-night-dinner',
      'holy-matrimony',
      'wedding-dinner',
      'farewell'
    ];
    const sanitizedEvents = Array.isArray(events)
      ? events.filter(e => validEventsList.includes(e))
      : [];

    let newRsvp;
    try {
      newRsvp = await Rsvp.create({
        submissionId: trimmedSubId,
        firstName: firstName.trim(),
        lastName: lastName ? lastName.trim() : '',
        email: email ? email.trim().toLowerCase() : '',
        phone: phone ? phone.trim() : '',
        attending,
        events: attending === 'yes' ? sanitizedEvents : [],
        blessing: blessing ? blessing.trim() : ''
      });
    } catch (insertErr) {
      // Handle rare race condition where duplicate submissionId hits at the exact same millisecond
      if (insertErr.code === 11000 && trimmedSubId) {
        const existing = await Rsvp.findOne({ submissionId: trimmedSubId });
        if (existing) {
          return res.status(200).json({
            ok: true,
            success: true,
            message: 'Your response has already been recorded.',
            data: {
              id: existing._id,
              firstName: existing.firstName,
              attending: existing.attending
            }
          });
        }
      }
      throw insertErr;
    }

    // If a blessing message was included, save to blessings collection
    if (blessing && blessing.trim()) {
      const fullName = `${newRsvp.firstName} ${newRsvp.lastName}`.trim() || newRsvp.firstName;
      await Blessing.create({
        guestName: fullName,
        firstName: newRsvp.firstName,
        lastName: newRsvp.lastName,
        message: blessing.trim(),
        rsvpId: newRsvp._id,
        submissionId: trimmedSubId
      });
    }

    return res.status(201).json({
      ok: true,
      success: true,
      message: 'Submission received successfully.',
      data: {
        id: newRsvp._id,
        firstName: newRsvp.firstName,
        attending: newRsvp.attending
      }
    });
  } catch (err) {
    next(err);
  }
}

// Protected: Get paginated RSVPs with filtering and search
export async function getAllRsvps(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const { search, attending, event, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = {};

    if (search && search.trim()) {
      const term = escapeRegex(search.trim());
      query.$or = [
        { firstName: { $regex: term, $options: 'i' } },
        { lastName: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
        { phone: { $regex: term, $options: 'i' } }
      ];
    }

    if (attending && ['yes', 'no'].includes(attending)) {
      query.attending = attending;
    }

    if (event && event.trim()) {
      query.events = event.trim();
    }

    const safeSortBy = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sort = { [safeSortBy]: sortDirection };

    const [rsvps, total] = await Promise.all([
      Rsvp.find(query).sort(sort).skip(skip).limit(limit).lean(),
      Rsvp.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: rsvps,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (err) {
    next(err);
  }
}

// Protected: Get single RSVP
export async function getRsvpById(req, res, next) {
  try {
    const rsvp = await Rsvp.findById(req.params.id);
    if (!rsvp) {
      return res.status(404).json({
        success: false,
        message: 'RSVP record not found.'
      });
    }
    res.json({
      success: true,
      data: rsvp
    });
  } catch (err) {
    next(err);
  }
}

// Protected: Delete RSVP
export async function deleteRsvp(req, res, next) {
  try {
    const rsvp = await Rsvp.findByIdAndDelete(req.params.id);
    if (!rsvp) {
      return res.status(404).json({
        success: false,
        message: 'RSVP record not found.'
      });
    }

    await Blessing.deleteMany({ rsvpId: req.params.id });

    res.json({
      success: true,
      message: 'RSVP record and associated blessing removed successfully.'
    });
  } catch (err) {
    next(err);
  }
}

// Protected: Export RSVPs as CSV
export async function exportRsvpsCsv(req, res, next) {
  try {
    const rsvps = await Rsvp.find().sort({ createdAt: -1 }).lean();

    const headers = [
      'Submission Date',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Attending',
      'Events',
      'Blessing Message'
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = rsvps.map(r => [
      escapeCsv(new Date(r.createdAt).toISOString()),
      escapeCsv(r.firstName),
      escapeCsv(r.lastName || ''),
      escapeCsv(r.email || ''),
      escapeCsv(r.phone || ''),
      escapeCsv(r.attending),
      escapeCsv((r.events || []).join('; ')),
      escapeCsv(r.blessing || '')
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="wedding_rsvps.csv"');
    res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
}
