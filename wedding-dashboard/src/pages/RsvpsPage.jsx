import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Search,
  Download,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Mail,
  Phone,
  MessageSquare,
  AlertCircle,
  X,
  Loader2
} from 'lucide-react';

const EVENT_LABELS = {
  'haldi-ceremony': 'Haldi Ceremony (3 Jan)',
  'haldi-night-dinner': 'Haldi Night Dinner (3 Jan)',
  'holy-matrimony': '✝ Holy Matrimony (4 Jan)',
  'wedding-dinner': 'Wedding Dinner (4 Jan)',
  'farewell': 'Bride & Groom Farewell (4 Jan)'
};

export function RsvpsPage() {
  const [rsvps, setRsvps] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Search
  const [search, setSearch] = useState('');
  const [attendingFilter, setAttendingFilter] = useState('all');
  const [eventFilter, setEventFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals
  const [selectedRsvp, setSelectedRsvp] = useState(null);
  const [rsvpToDelete, setRsvpToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const fetchRsvps = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getRsvps({
        page,
        limit: pagination.limit,
        search,
        attending: attendingFilter,
        event: eventFilter,
        sortBy: 'createdAt',
        sortOrder
      });
      setRsvps(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to load RSVPs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRsvps(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search, attendingFilter, eventFilter, sortOrder]);

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      await api.exportRsvpsCsv();
    } catch (err) {
      alert('Failed to export CSV: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const confirmDelete = async () => {
    if (!rsvpToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteRsvp(rsvpToDelete._id);
      setRsvpToDelete(null);
      fetchRsvps(pagination.page);
    } catch (err) {
      alert('Delete failed: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleExportCsv}
              disabled={isExporting}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs disabled:opacity-50"
            >
              <Download className={`w-3.5 h-3.5 ${isExporting ? 'animate-bounce' : ''}`} />
              <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center space-x-1 text-slate-500 font-medium mr-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Attendance Filter Pills */}
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
            {['all', 'yes', 'no'].map((type) => (
              <button
                key={type}
                onClick={() => setAttendingFilter(type)}
                className={`px-2.5 py-1 rounded-md font-medium capitalize transition-all ${
                  attendingFilter === type
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {type === 'all' ? 'All Responses' : type === 'yes' ? 'Attending' : 'Declined'}
              </button>
            ))}
          </div>

          {/* Event Filter Select */}
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Events</option>
            {Object.keys(EVENT_LABELS).map((k) => (
              <option key={k} value={k}>
                {EVENT_LABELS[k]}
              </option>
            ))}
          </select>

          {/* Sort Order */}
          <button
            onClick={() => setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
            className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium ml-auto"
          >
            {sortOrder === 'desc' ? 'Newest First ↓' : 'Oldest First ↑'}
          </button>
        </div>
      </div>

      {/* Main Table or Card List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-2 text-slate-500">
            <Loader2 className="w-7 h-7 text-amber-600 animate-spin" />
            <span className="text-xs">Loading records...</span>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-xs text-rose-600 space-y-2">
            <AlertCircle className="w-6 h-6 mx-auto text-rose-500" />
            <p>{error}</p>
          </div>
        ) : rsvps.length === 0 ? (
          <div className="py-20 text-center text-slate-400 space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto opacity-40" />
            <p className="text-sm font-medium text-slate-600">No RSVP submissions found</p>
            <p className="text-xs text-slate-400">Try adjusting your search terms or filter criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Guest Name</th>
                  <th className="py-3 px-4">Attendance</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Selected Events</th>
                  <th className="py-3 px-4">Blessing</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rsvps.map((rsvp) => {
                  const fullName = `${rsvp.firstName} ${rsvp.lastName || ''}`.trim();
                  return (
                    <tr key={rsvp._id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{fullName}</div>
                      </td>

                      {/* Attendance */}
                      <td className="py-3.5 px-4">
                        {rsvp.attending === 'yes' ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>Attending</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                            <XCircle className="w-3 h-3 text-slate-400" />
                            <span>Declined</span>
                          </span>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 text-slate-600 space-y-0.5">
                        {rsvp.email ? (
                          <div className="flex items-center space-x-1.5 truncate max-w-[180px]">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{rsvp.email}</span>
                          </div>
                        ) : null}
                        {rsvp.phone ? (
                          <div className="flex items-center space-x-1.5 text-slate-500">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{rsvp.phone}</span>
                          </div>
                        ) : null}
                        {!rsvp.email && !rsvp.phone && <span className="text-slate-300">—</span>}
                      </td>

                      {/* Events */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {rsvp.attending === 'no' ? (
                          <span className="text-slate-400 text-[11px]">N/A (Declined)</span>
                        ) : (rsvp.events && rsvp.events.length > 0) ? (
                          <div className="flex flex-wrap gap-1">
                            {rsvp.events.map((ev) => (
                              <span
                                key={ev}
                                className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-medium border border-amber-200/50"
                              >
                                {EVENT_LABELS[ev]?.split(' (')[0] || ev}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">None chosen</span>
                        )}
                      </td>

                      {/* Blessing Preview */}
                      <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">
                        {rsvp.blessing ? (
                          <span title={rsvp.blessing} className="truncate block font-serif italic text-slate-700">
                            "{rsvp.blessing}"
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(rsvp.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1">
                          <button
                            onClick={() => setSelectedRsvp(rsvp)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setRsvpToDelete(rsvp)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete submission"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <b>{rsvps.length}</b> of <b>{pagination.total}</b> total records
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchRsvps(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium text-slate-700">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchRsvps(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRsvp && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedRsvp.firstName} {selectedRsvp.lastName || ''}
                </h3>
                <p className="text-xs text-slate-400">
                  Submitted {new Date(selectedRsvp.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedRsvp(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50">
                <div>
                  <span className="text-slate-400 font-medium block">Attendance</span>
                  <span className={`font-semibold ${selectedRsvp.attending === 'yes' ? 'text-emerald-700' : 'text-slate-700'}`}>
                    {selectedRsvp.attending === 'yes' ? 'Yes, attending with joy' : 'Regretfully declined'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Submission ID</span>
                  <span className="font-mono text-[10px] text-slate-600 truncate block">
                    {selectedRsvp.submissionId || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Email</span>
                  <span className="text-slate-700">{selectedRsvp.email || 'None provided'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Phone</span>
                  <span className="text-slate-700">{selectedRsvp.phone || 'None provided'}</span>
                </div>
              </div>

              {selectedRsvp.attending === 'yes' && (
                <div>
                  <span className="text-slate-500 font-semibold block mb-1">Ceremonies Attending:</span>
                  <div className="space-y-1">
                    {(selectedRsvp.events || []).length > 0 ? (
                      selectedRsvp.events.map((ev) => (
                        <div key={ev} className="p-2 rounded-lg bg-amber-50/70 border border-amber-200/50 text-amber-900 font-medium">
                          {EVENT_LABELS[ev] || ev}
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 italic">No specific events selected</p>
                    )}
                  </div>
                </div>
              )}

              {selectedRsvp.blessing && (
                <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-100 space-y-1">
                  <span className="text-rose-700 font-semibold flex items-center space-x-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Blessing Message:</span>
                  </span>
                  <p className="font-serif italic text-slate-700 leading-relaxed text-sm">
                    "{selectedRsvp.blessing}"
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedRsvp(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {rsvpToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete RSVP Submission?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently delete the submission for{' '}
                <b>{rsvpToDelete.firstName} {rsvpToDelete.lastName || ''}</b>? If a blessing was submitted with this RSVP, it will also be removed.
              </p>
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setRsvpToDelete(null)}
                disabled={isDeleting}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

