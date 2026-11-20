import React from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Heart,
  CalendarCheck,
  TrendingUp,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as ChartTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';

export function OverviewPage({ stats, loading, onNavigate }) {
  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-medium">Loading live statistics from MongoDB Atlas...</p>
      </div>
    );
  }

  const summary = stats?.summary || {
    totalRsvps: 0,
    attendingCount: 0,
    notAttendingCount: 0,
    totalBlessings: 0,
    attendanceRate: 0
  };

  const eventCounts = stats?.eventCounts || {};
  const timeline = stats?.timeline || [];
  const recentActivity = stats?.recentActivity || { rsvps: [], blessings: [] };

  // Data for Attendance Donut Chart
  const attendancePieData = [
    { name: 'Attending (Yes)', value: summary.attendingCount, color: '#10b981' },
    { name: 'Not Attending (No)', value: summary.notAttendingCount, color: '#94a3b8' }
  ];

  // Data for Events Bar Chart
  const eventBarData = Object.keys(eventCounts).map((key) => ({
    eventKey: key,
    name: eventCounts[key].name.replace(/\s*\(.*\)/, ''),
    fullName: eventCounts[key].name,
    attendees: eventCounts[key].count
  }));

  const metricCards = [
    {
      label: 'Total RSVP Submissions',
      value: summary.totalRsvps,
      subtitle: 'Total unique response forms',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
      action: () => onNavigate('rsvps')
    },
    {
      label: 'Attending With Joy',
      value: summary.attendingCount,
      subtitle: `${summary.attendanceRate}% of total responses`,
      icon: UserCheck,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      action: () => onNavigate('rsvps')
    },
    {
      label: 'Regretfully Declined',
      value: summary.notAttendingCount,
      subtitle: `${100 - summary.attendanceRate}% of total responses`,
      icon: UserX,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      action: () => onNavigate('rsvps')
    },
    {
      label: 'Total Blessings Received',
      value: summary.totalBlessings,
      subtitle: 'Heartfelt wishes & prayers',
      icon: Heart,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-100',
      action: () => onNavigate('blessings')
    }
  ];

  return (
    <div className="space-y-8">
      {/* Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={card.action}
              className={`p-5 rounded-2xl bg-white border ${card.borderColor} shadow-xs hover:shadow-md transition-all cursor-pointer`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {card.label}
                </span>
                <div className={`w-9 h-9 rounded-xl ${card.bgColor} ${card.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {card.value}
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">{card.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Breakdown (Donut) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Attendance Distribution</h3>
                <p className="text-xs text-slate-500">Proportion of yes vs no responses</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>

            {summary.totalRsvps === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center text-slate-400 text-xs">
                <Users className="w-8 h-8 mb-2 opacity-40" />
                <span>No RSVPs recorded yet</span>
              </div>
            ) : (
              <div className="h-56 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendancePieData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {attendancePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      formatter={(val, name) => [`${val} guests`, name]}
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-slate-900">{summary.attendanceRate}%</span>
                  <span className="text-[11px] text-slate-400 font-medium">Attending</span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-slate-600">Attending: <b>{summary.attendingCount}</b></span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
              <span className="text-slate-600">Declined: <b>{summary.notAttendingCount}</b></span>
            </div>
          </div>
        </div>

        {/* Event-by-Event Participation (Bar Chart) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Event Participation</h3>
                <p className="text-xs text-slate-500">Guest count breakdown across wedding ceremonies</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <CalendarCheck className="w-4 h-4" />
              </div>
            </div>

            {summary.attendingCount === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center text-slate-400 text-xs">
                <CalendarCheck className="w-8 h-8 mb-2 opacity-40" />
                <span>Event counts will appear as guests confirm attendance</span>
              </div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={eventBarData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      angle={-15}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <ChartTooltip
                      formatter={(val, name, item) => [`${val} attendees`, item.payload.fullName]}
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Bar dataKey="attendees" fill="#d97706" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>5 ceremonies planned across Jan 3 & 4</span>
            <button
              onClick={() => onNavigate('rsvps')}
              className="text-amber-700 hover:text-amber-800 font-medium hover:underline"
            >
              Filter records by event &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Submission Timeline & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Submission Activity Over Time</h3>
              <p className="text-xs text-slate-500">Daily volume of incoming RSVPs</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          {timeline.length === 0 ? (
            <div className="h-52 flex flex-col items-center justify-center text-slate-400 text-xs">
              <TrendingUp className="w-8 h-8 mb-2 opacity-40" />
              <span>Timeline data will populate as submissions are recorded</span>
            </div>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rsvpColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d97706" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <ChartTooltip
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="rsvps" stroke="#d97706" fillOpacity={1} fill="url(#rsvpColor)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Latest Activity Feed */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
              <p className="text-xs text-slate-500">Latest responses received</p>
            </div>
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-64 pr-1">
            {recentActivity.rsvps.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No recent activity yet</p>
            ) : (
              recentActivity.rsvps.map((item) => (
                <div
                  key={item._id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-slate-900 truncate">
                      {item.firstName} {item.lastName || ''}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${
                      item.attending === 'yes'
                        ? 'bg-emerald-100/80 text-emerald-800'
                        : 'bg-slate-200/80 text-slate-700'
                    }`}
                  >
                    {item.attending === 'yes' ? 'Attending' : 'Declined'}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <button
              onClick={() => onNavigate('rsvps')}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800"
            >
              View all RSVP records &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

