import { Blessing } from '../models/Blessing.js';
import { escapeRegex } from '../utils/sanitize.js';

const ALLOWED_SORT_FIELDS = ['createdAt', 'guestName', 'updatedAt'];

// Public: Submit a standalone blessing
export async function submitBlessing(req, res, next) {
  try {
    const { guestName, firstName, lastName, message, blessing } = req.body;

    const rawMessage = typeof message === 'string' ? message : (typeof blessing === 'string' ? blessing : '');
    const rawGuestName = typeof guestName === 'string' ? guestName : '';
    const rawFirstName = typeof firstName === 'string' ? firstName : '';
    const rawLastName = typeof lastName === 'string' ? lastName : '';

    const actualMessage = rawMessage.trim();
    const actualName = (rawGuestName || `${rawFirstName} ${rawLastName}`.trim() || '').trim();

    const fields = {};
    if (!actualName) {
      fields.guestName = 'Please provide your name.';
    }
    if (!actualMessage) {
      fields.message = 'Please write your blessing message.';
    } else if (actualMessage.length > 500) {
      fields.message = 'Blessing message cannot exceed 500 characters.';
    }

    if (Object.keys(fields).length > 0) {
      return res.status(400).json({
        ok: false,
        success: false,
        message: 'Please check the submitted information.',
        fields
      });
    }

    const newBlessing = await Blessing.create({
      guestName: actualName,
      firstName: firstName ? firstName.trim() : '',
      lastName: lastName ? lastName.trim() : '',
      message: actualMessage
    });

    return res.status(201).json({
      ok: true,
      success: true,
      message: 'Blessing received with heartfelt thanks.',
      data: {
        id: newBlessing._id,
        guestName: newBlessing.guestName
      }
    });
  } catch (err) {
    next(err);
  }
}

// Protected: Get paginated blessings for admin dashboard
export async function getAllBlessings(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const skip = (page - 1) * limit;

    const { search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = {};
    if (search && search.trim()) {
      const term = escapeRegex(search.trim());
      query.$or = [
        { guestName: { $regex: term, $options: 'i' } },
        { message: { $regex: term, $options: 'i' } }
      ];
    }

    const safeSortBy = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sort = { [safeSortBy]: sortDirection };

    const [blessings, total] = await Promise.all([
      Blessing.find(query).sort(sort).skip(skip).limit(limit).lean(),
      Blessing.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: blessings,
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

// Protected: Delete a blessing
export async function deleteBlessing(req, res, next) {
  try {
    const item = await Blessing.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Blessing not found.'
      });
    }
    res.json({
      success: true,
      message: 'Blessing removed successfully.'
    });
  } catch (err) {
    next(err);
  }
}

// Protected: Export blessings as CSV
export async function exportBlessingsCsv(req, res, next) {
  try {
    const blessings = await Blessing.find().sort({ createdAt: -1 }).lean();

    const headers = ['Submission Date', 'Guest Name', 'Blessing Message'];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = blessings.map(b => [
      escapeCsv(new Date(b.createdAt).toISOString()),
      escapeCsv(b.guestName),
      escapeCsv(b.message)
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="wedding_blessings.csv"');
    res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
}
