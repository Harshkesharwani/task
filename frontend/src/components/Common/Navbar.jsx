import React from 'react';
import { Calendar, DollarSign, Clock, Plus } from 'lucide-react';

const TIMEZONE_OPTIONS = [
  { code: 'UTC', label: 'UTC (+00:00)' },
  { code: 'Asia/Kolkata', label: 'IST - Kolkata (+05:30)' },
  { code: 'America/New_York', label: 'EST - New York (-05:00)' },
  { code: 'America/Los_Angeles', label: 'PST - Los Angeles (-08:00)' },
  { code: 'Europe/London', label: 'GMT - London (+00:00)' },
  { code: 'Europe/Paris', label: 'CET - Paris (+01:00)' },
  { code: 'Asia/Dubai', label: 'GST - Dubai (+04:00)' },
  { code: 'Asia/Tokyo', label: 'JST - Tokyo (+09:00)' },
];

export default function Navbar({
  activeTab,
  setActiveTab,
  currentTimezone,
  setCurrentTimezone,
  onOpenCreateEvent,
  onOpenCreateInvoice,
}) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* App Title */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              EI
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-lg text-white leading-tight">
                Event & Invoice Engine
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">Technical Interview Assignment</p>
            </div>
          </div>

          {/* Clean 2 Tabs */}
          <nav className="flex space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'calendar'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Calendar</span>
            </button>

            <button
              onClick={() => setActiveTab('invoices')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'invoices'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Invoices</span>
            </button>
          </nav>

          {/* Timezone & Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Timezone Selector */}
            <div className="flex items-center bg-slate-800 rounded-lg px-2 py-1.5 border border-slate-700 text-xs">
              <Clock className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
              <select
                value={currentTimezone}
                onChange={(e) => setCurrentTimezone(e.target.value)}
                className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
                title="Active Time Zone"
              >
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz.code} value={tz.code} className="bg-slate-800 text-slate-100">
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Action Buttons */}
            {activeTab === 'calendar' ? (
              <button
                onClick={onOpenCreateEvent}
                className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Schedule Event</span>
              </button>
            ) : (
              <button
                onClick={onOpenCreateInvoice}
                className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Invoice</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
