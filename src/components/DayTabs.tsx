import { Plus, LayoutList } from 'lucide-react';
import type { Day } from '../types/trip';
import clsx from 'clsx';

interface DayTabsProps {
  days: Day[];
  selectedDayId: string | null;
  showAllDays: boolean;
  onSelectDay: (dayId: string) => void;
  onShowAllDays: () => void;
  onAddDay: () => void;
}

export default function DayTabs({
  days,
  selectedDayId,
  showAllDays,
  onSelectDay,
  onShowAllDays,
  onAddDay,
}: DayTabsProps) {
  return (
    <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
      <div className="flex items-center gap-2 flex-wrap">
        {/* All Days button */}
        <button
          onClick={onShowAllDays}
          className={clsx(
            'flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-colors',
            showAllDays
              ? 'bg-white shadow-sm text-slate-900 ring-2 ring-blue-500'
              : 'bg-white/50 text-slate-600 hover:bg-white'
          )}
          title="View all days"
        >
          <LayoutList className="w-4 h-4" />
        </button>

        {/* Day circles */}
        {days.map((day, index) => (
          <button
            key={day.id}
            onClick={() => onSelectDay(day.id)}
            className={clsx(
              'flex items-center justify-center w-9 h-9 rounded-lg text-sm font-semibold transition-all',
              !showAllDays && selectedDayId === day.id
                ? 'text-white shadow-md scale-110'
                : 'text-white/90 hover:scale-105 hover:shadow-sm'
            )}
            style={{
              backgroundColor: day.color,
              opacity: !showAllDays && selectedDayId === day.id ? 1 : 0.75,
            }}
            title={`Day ${index + 1}${day.stops.length > 0 ? ` (${day.stops.length} stops)` : ''}`}
          >
            {index + 1}
          </button>
        ))}

        {/* Add day button */}
        <button
          onClick={onAddDay}
          className="flex items-center justify-center w-9 h-9 rounded-lg border-2 border-dashed
                     border-slate-300 text-slate-400 hover:border-slate-400 hover:text-slate-500
                     transition-colors"
          title="Add new day"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
