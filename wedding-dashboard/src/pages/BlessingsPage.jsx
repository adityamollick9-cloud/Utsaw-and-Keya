import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Heart,
  Search,
  Download,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Loader2,
  Quote
} from 'lucide-react';

export function BlessingsPage() {
  const [blessings, setBlessings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [blessingToDelete, setBlessingToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const fetchBlessings = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getBlessings({
        page,
        limit: pagination.limit,
        search,
        sortBy: 'createdAt',
        sortOrder
      });
      setBlessings(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 12, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to load blessings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBlessings(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search, sortOrder]);

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      await api.exportBlessingsCsv();
    } catch (err) {
      alert('Failed to export blessings: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const confirmDelete = async () => {
    if (!blessingToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteBlessing(blessingToDelete._id);
      setBlessingToDelete(null);
      fetchBlessings(pagination.page);
    } catch (err) {
      alert('Delete failed: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search blessings by guest name or message..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Export & Sort Actions */}
        <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
          <button
            onClick={() => setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
          >
            {sortOrder === 'desc' ? 'Newest First ↓' : 'Oldest First ↑'}
          </button>
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

      {/* Main Grid Content */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-2 text-slate-500 bg-white rounded-2xl border border-slate-200/80">
          <Loader2 className="w-7 h-7 text-amber-600 animate-spin" />
          <span className="text-xs">Loading blessings...</span>
        </div>
      ) : error ? (
        <div className="p-12 text-center text-xs text-rose-600 bg-white rounded-2xl border border-slate-200/80 space-y-2">
          <AlertCircle className="w-6 h-6 mx-auto text-rose-500" />
          <p>{error}</p>
        </div>
      ) : blessings.length === 0 ? (
        <div className="py-24 text-center bg-white rounded-2xl border border-slate-200/80 text-slate-400 space-y-2">
          <Heart className="w-8 h-8 mx-auto opacity-40 text-rose-400" />
          <p className="text-sm font-medium text-slate-600">No blessings found</p>
          <p className="text-xs text-slate-400">Guest wishes will appear here as they are submitted</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {blessings.map((b) => (
            <div
              key={b._id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative group"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center shrink-0">
                      <Heart className="w-4 h-4 fill-rose-500/20 text-rose-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 leading-tight">
                        {b.guestName}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {new Date(b.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setBlessingToDelete(b)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    title="Delete blessing"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="relative mt-2">
                  <Quote className="w-5 h-5 text-amber-200 absolute -top-2.5 -left-1 opacity-60" />
                  <p className="font-serif italic text-slate-700 text-sm leading-relaxed pl-4">
                    "{b.message}"
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Cherished Memory</span>
                </span>
                <span>{b.message.length} chars</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      {blessings.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <b>{blessings.length}</b> of <b>{pagination.total}</b> blessings
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchBlessings(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium text-slate-700">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchBlessings(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {blessingToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Blessing?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently delete the blessing from{' '}
                <b>{blessingToDelete.guestName}</b>?
              </p>
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setBlessingToDelete(null)}
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

