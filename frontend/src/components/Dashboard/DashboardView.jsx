import React from 'react';
import { 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  ArrowRight,
  Database,
  Layers
} from 'lucide-react';

export default function DashboardView({
  stats,
  events,
  invoices,
  onOpenCreateEvent,
  onOpenCreateInvoice,
  onSelectEvent,
  onSelectInvoice,
  onConvertToInvoice,
  onSeedData,
}) {
  const upcomingEvents = events.filter((e) => e.status === 'SCHEDULED').slice(0, 5);
  const recentInvoices = invoices.slice(0, 5);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner / Hero - Mobile Responsive */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <span>Enterprise Assignment</span>
              <span>•</span>
              <span>Harsh Kesharwani</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Event Scheduling & Project Invoice Management Engine
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
              Django REST Framework (DRF) backend + interactive React dashboard for scheduling recurring events, overlap validation across timezones, and billing management.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={onOpenCreateEvent}
              className="flex items-center space-x-1.5 px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Event</span>
            </button>

            <button
              onClick={onOpenCreateInvoice}
              className="flex items-center space-x-1.5 px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>New Invoice</span>
            </button>

            <button
              onClick={onSeedData}
              className="flex items-center space-x-1 px-2.5 sm:px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition-all"
              title="Populate demo data"
            >
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Reset Demo</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid - Responsive (2-cols on mobile, 4-cols on lg) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* Total Revenue */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Billed</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-4">
            <h3 className="text-xl sm:text-2xl font-bold text-white">${stats.total_revenue?.toLocaleString() || '0.00'}</h3>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 truncate">
              <span className="text-emerald-400 font-medium">${stats.paid_revenue?.toLocaleString() || '0'} Paid</span>
            </p>
          </div>
        </div>

        {/* Paid Invoices */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Paid Invoices</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-4">
            <h3 className="text-xl sm:text-2xl font-bold text-white">{stats.paid_invoices || 0}</h3>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">
              Of {stats.total_invoices || 0} invoices
            </p>
          </div>
        </div>

        {/* Scheduled Events */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Events</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-4">
            <h3 className="text-xl sm:text-2xl font-bold text-white">{stats.upcoming_events || 0}</h3>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">
              {stats.completed_events || 0} completed
            </p>
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Overdue</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-4">
            <h3 className="text-xl sm:text-2xl font-bold text-rose-400">{stats.overdue_invoices || 0}</h3>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">
              {stats.draft_invoices || 0} in draft
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Upcoming Events & Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Module 1: Project Events */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Upcoming Events & Milestones</h2>
              <p className="text-[11px] sm:text-xs text-slate-400">Scheduled team milestones & reviews</p>
            </div>
            <span className="text-[11px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-semibold border border-indigo-500/20">
              {upcomingEvents.length} Active
            </span>
          </div>

          <div className="space-y-2.5">
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs sm:text-sm">
                No upcoming events scheduled. Click "+ Schedule Event" above.
              </div>
            ) : (
              upcomingEvents.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => onSelectEvent(ev)}
                  className="p-3 bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 rounded-xl transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-start space-x-2.5 min-w-0">
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        ev.category === 'MILESTONE' ? 'bg-amber-400' : 'bg-indigo-400'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5 truncate">
                        <span className="font-semibold text-xs sm:text-sm text-white group-hover:text-indigo-400 transition-colors truncate">
                          {ev.title}
                        </span>
                        {ev.is_recurring && (
                          <span className="text-[9px] bg-slate-800 text-slate-300 px-1 py-0.2 rounded border border-slate-700 flex-shrink-0">
                            {ev.recurrence_pattern}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {new Date(ev.start_time).toLocaleString()} • {ev.time_zone}
                      </p>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors flex-shrink-0 ml-2" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Module 2: Recent Invoices */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Recent Billing Invoices</h2>
              <p className="text-[11px] sm:text-xs text-slate-400">Event-linked and project invoice records</p>
            </div>
            <span className="text-[11px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/20">
              Recent
            </span>
          </div>

          <div className="space-y-2.5">
            {recentInvoices.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs sm:text-sm">
                No invoices found. Click "+ New Invoice" above to generate billing records.
              </div>
            ) : (
              recentInvoices.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => onSelectInvoice(inv)}
                  className="p-3 bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 rounded-xl transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-start space-x-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 text-indigo-400 flex items-center justify-center font-mono text-[10px] font-bold border border-slate-700 flex-shrink-0">
                      INV
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold text-xs sm:text-sm text-white group-hover:text-emerald-400 transition-colors font-mono truncate block">
                        {inv.invoice_number}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {inv.event_title ? `Linked: ${inv.event_title}` : 'Standalone Billing'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 ml-2">
                    <span className="font-bold text-white text-xs sm:text-sm">
                      ${parseFloat(inv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <div>
                      <span
                        className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : inv.status === 'OVERDUE'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
