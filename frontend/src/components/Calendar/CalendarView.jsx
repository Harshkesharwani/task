import React from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  parseISO
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Repeat,
  DollarSign,
  Filter,
  Layers
} from 'lucide-react';

const CATEGORY_COLORS = {
  MILESTONE: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  MEETING: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
  DEPLOYMENT: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  REVIEW: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  TASK: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
};

export default function CalendarView({
  events,
  currentDate,
  setCurrentDate,
  selectedCategory,
  setSelectedCategory,
  expandRecurring,
  setExpandRecurring,
  onOpenCreateEvent,
  onSelectEvent,
  onDateClick,
}) {
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const getEventsForDay = (date) => {
    return events.filter((ev) => {
      try {
        const evDate = parseISO(ev.start_time);
        return isSameDay(evDate, date);
      } catch {
        return false;
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Calendar Controls & Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Month Navigation */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={prevMonth}
              className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {format(currentDate, 'MMMM yyyy')}
          </h2>

          <button
            onClick={goToToday}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition-all"
          >
            Today
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <div className="flex items-center bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-indigo-400 mr-1.5" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All Categories</option>
              <option value="MILESTONE" className="bg-slate-900">Milestone</option>
              <option value="MEETING" className="bg-slate-900">Meeting</option>
              <option value="DEPLOYMENT" className="bg-slate-900">Deployment</option>
              <option value="REVIEW" className="bg-slate-900">Review</option>
              <option value="TASK" className="bg-slate-900">Task</option>
            </select>
          </div>

          {/* Expand Recurrence Toggle */}
          <button
            onClick={() => setExpandRecurring(!expandRecurring)}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              expandRecurring
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800'
            }`}
            title="Expand recurring occurrences"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{expandRecurring ? 'Recurring: Expanded' : 'Recurring: Rules Only'}</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-950 text-center py-2 text-xs font-bold text-slate-400">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Day Cells Grid */}
        <div className="grid grid-cols-7 auto-rows-fr bg-slate-950/20 divide-x divide-y divide-slate-800">
          {days.map((dateItem, idx) => {
            const isCurrentMonth = isSameMonth(dateItem, currentDate);
            const isToday = isSameDay(dateItem, new Date());
            const dayEvents = getEventsForDay(dateItem);

            return (
              <div
                key={idx}
                onClick={() => onDateClick(dateItem)}
                className={`min-h-[90px] sm:min-h-[110px] p-1.5 transition-colors flex flex-col group cursor-pointer ${
                  !isCurrentMonth
                    ? 'bg-slate-950/60 text-slate-600'
                    : isToday
                    ? 'bg-indigo-950/20 text-white'
                    : 'bg-slate-900/40 text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {/* Date Header */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                      isToday
                        ? 'bg-indigo-600 text-white font-bold'
                        : isCurrentMonth
                        ? 'text-slate-300'
                        : 'text-slate-600'
                    }`}
                  >
                    {format(dateItem, 'd')}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCreateEvent(dateItem);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-indigo-600 hover:text-white text-slate-400 rounded transition-all text-xs"
                    title="Add event"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Day Events */}
                <div className="flex-1 space-y-1 overflow-y-auto max-h-20 sm:max-h-24">
                  {dayEvents.map((ev) => {
                    const badgeStyle = CATEGORY_COLORS[ev.category] || CATEGORY_COLORS.MILESTONE;
                    const timeFormatted = format(parseISO(ev.start_time), 'h:mm a');

                    return (
                      <div
                        key={ev.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent(ev);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[11px] font-medium border truncate flex items-center justify-between cursor-pointer ${badgeStyle}`}
                        title={`${ev.title} (${timeFormatted})`}
                      >
                        <div className="flex items-center space-x-1 truncate">
                          {ev.is_recurring && <Repeat className="w-2.5 h-2.5 flex-shrink-0" />}
                          <span className="truncate">{ev.title}</span>
                        </div>
                        <span className="text-[9px] opacity-75 ml-1 hidden sm:inline flex-shrink-0">
                          {timeFormatted}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
