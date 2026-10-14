import React from 'react';
import { X, Calendar, Clock, DollarSign, Trash2, Repeat, CheckCircle, Tag } from 'lucide-react';

export default function EventDetailsModal({
  isOpen,
  onClose,
  event,
  onDelete,
  onConvertToInvoice,
  currentTimezone,
}) {
  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2">
            <span
              className={`w-3 h-3 rounded-full ${
                event.category === 'MILESTONE' ? 'bg-amber-400' : 'bg-indigo-400'
              }`}
            />
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
              {event.category}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div>
            <h3 className="text-xl font-bold text-white">{event.title}</h3>
            {event.description && (
              <p className="text-sm text-slate-400 mt-2 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                {event.description}
              </p>
            )}
          </div>

          {/* Time & Timezone Box */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center space-x-1.5 text-slate-400">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Start Time:</span>
              </span>
              <span className="font-semibold text-white">
                {new Date(event.start_time).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center space-x-1.5 text-slate-400">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>End Time:</span>
              </span>
              <span className="font-semibold text-white">
                {new Date(event.end_time).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-400 pt-2 border-t border-slate-800/80">
              <span>Source Time Zone:</span>
              <span className="font-mono text-indigo-400">{event.time_zone}</span>
            </div>
          </div>

          {/* Recurrence Details if applicable */}
          {event.is_recurring && (
            <div className="flex items-center space-x-2 text-xs bg-indigo-500/10 text-indigo-300 p-3 rounded-xl border border-indigo-500/20">
              <Repeat className="w-4 h-4 flex-shrink-0" />
              <span>
                Repeats <strong className="text-white">{event.recurrence_pattern}</strong>
                {event.recurrence_end_date && ` until ${new Date(event.recurrence_end_date).toLocaleDateString()}`}
              </span>
            </div>
          )}

          {/* Linked Invoices Indicator */}
          {event.invoice_count > 0 && (
            <div className="flex items-center space-x-2 text-xs bg-emerald-500/10 text-emerald-300 p-3 rounded-xl border border-emerald-500/20">
              <DollarSign className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>This milestone has {event.invoice_count} billing invoice record(s) attached.</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this event?')) {
                onDelete(event.id);
                onClose();
              }
            }}
            className="flex items-center space-x-1.5 px-3 py-2 text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Event</span>
          </button>

          <div className="flex items-center space-x-2">
            {event.category === 'MILESTONE' && (
              <button
                onClick={() => {
                  onClose();
                  onConvertToInvoice(event);
                }}
                className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition-all hover:scale-105"
              >
                <DollarSign className="w-4 h-4" />
                <span>Bill Milestone</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
