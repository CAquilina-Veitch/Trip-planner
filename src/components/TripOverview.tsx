import { useState } from 'react';
import { Car, Clock, MapPin, ChevronDown, ChevronRight, ArrowLeft, ArrowRight, Lock, Play } from 'lucide-react';
import type { Day } from '../types/trip';
import clsx from 'clsx';

interface TripOverviewProps {
  days: Day[];
  onSelectDay: (dayId: string) => void;
  onMoveStopToDay: (fromDayId: string, toDayId: string, stopId: string) => void;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h${minutes}m`;
}

function formatDistance(meters: number): string {
  const km = meters / 1000;
  return km >= 100 ? `${Math.round(km)}km` : `${km.toFixed(0)}km`;
}

// Helper to get inherited start for a day
function getInheritedStart(days: Day[], dayIndex: number): { stop: Day['stops'][0]; fromDayIndex: number } | null {
  if (dayIndex <= 0) return null; // Day 1 has no inherited start

  const prevDay = days[dayIndex - 1];
  if (prevDay.stops.length === 0) return null;

  return {
    stop: prevDay.stops[prevDay.stops.length - 1],
    fromDayIndex: dayIndex - 1,
  };
}

export default function TripOverview({ days, onSelectDay, onMoveStopToDay }: TripOverviewProps) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  // Calculate trip totals
  const totals = days.reduce(
    (acc, day) => {
      const stats = day.stats;
      if (stats) {
        acc.stops += stats.stopCount;
        acc.drivingTime += stats.totalDrivingTime;
        acc.drivingDistance += stats.totalDrivingDistance;
        acc.activityTime += stats.totalActivityTime;
      }
      return acc;
    },
    { stops: 0, drivingTime: 0, drivingDistance: 0, activityTime: 0 }
  );

  const toggleExpanded = (dayId: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(dayId)) {
        next.delete(dayId);
      } else {
        next.add(dayId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedDays(new Set(days.map(d => d.id)));
  };

  const collapseAll = () => {
    setExpandedDays(new Set());
  };

  if (days.length === 0) return null;

  return (
    <div className="p-5">
      {/* Trip totals */}
      <div className="mb-4 p-4 bg-slate-50 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Trip Total
          </h4>
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Expand all
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={collapseAll}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Collapse all
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <div className="flex items-center gap-1.5 text-slate-700">
            <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="font-medium">{totals.stops}</span>
            <span className="text-slate-500">stops</span>
          </div>
          {totals.drivingTime > 0 && (
            <div className="flex items-center gap-1.5 text-slate-700">
              <Car className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="font-medium">{formatDuration(totals.drivingTime)}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500">{formatDistance(totals.drivingDistance)}</span>
            </div>
          )}
          {totals.activityTime > 0 && (
            <div className="flex items-center gap-1.5 text-slate-700">
              <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="font-medium">{totals.activityTime}m</span>
              <span className="text-slate-500">activities</span>
            </div>
          )}
        </div>
      </div>

      {/* Day-by-day breakdown */}
      <div className="space-y-3">
        {days.map((day, dayIndex) => {
          const isExpanded = expandedDays.has(day.id);
          const prevDayId = dayIndex > 0 ? days[dayIndex - 1].id : null;
          const nextDayId = dayIndex < days.length - 1 ? days[dayIndex + 1].id : null;

          return (
            <div
              key={day.id}
              className="bg-white rounded-lg border border-slate-200 overflow-hidden"
            >
              {/* Day header */}
              <button
                onClick={() => toggleExpanded(day.id)}
                className="w-full text-left p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Expand/collapse icon */}
                  <div className="text-slate-400">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>

                  {/* Day color indicator */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                    style={{ backgroundColor: day.color }}
                  >
                    {dayIndex + 1}
                  </div>

                  {/* Day info */}
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">
                        Day {dayIndex + 1}
                      </span>
                      <span className="text-xs text-slate-400">{day.date}</span>
                    </div>

                    {/* Stops preview when collapsed */}
                    {!isExpanded && day.stops.length > 0 && (
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        {day.stops.map(s => s.name).join(' → ')}
                      </div>
                    )}
                  </div>

                  {/* Day stats */}
                  {day.stats && (
                    <div className="text-right text-xs text-slate-500 flex-shrink-0">
                      <div>{day.stats.stopCount} stops</div>
                      {day.stats.totalDrivingTime > 0 && (
                        <div className="text-slate-400">
                          {formatDuration(day.stats.totalDrivingTime)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </button>

              {/* Expanded stops list */}
              {isExpanded && (() => {
                const inheritedStart = getInheritedStart(days, dayIndex);
                const hasContent = inheritedStart || day.stops.length > 0;

                return (
                  <div className="border-t border-slate-100">
                    {!hasContent ? (
                      <div className="p-4 text-center text-sm text-slate-400">
                        No stops for this day
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {/* Inherited start from previous day */}
                        {inheritedStart && (
                          <div className="px-4 py-3 flex items-center gap-3 bg-slate-50">
                            {/* Start indicator */}
                            <div className="w-6 h-6 rounded-full flex items-center justify-center bg-slate-400 text-white flex-shrink-0">
                              <Play className="w-3 h-3 ml-0.5" />
                            </div>

                            {/* Stop info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-600 truncate">
                                  Start
                                </span>
                                <span className="text-xs text-slate-400">
                                  from Day {inheritedStart.fromDayIndex + 1}
                                </span>
                              </div>
                              <span className="text-xs text-slate-500">
                                {inheritedStart.stop.name}
                              </span>
                            </div>

                            {/* Lock icon (read-only) */}
                            <div className="p-1.5 text-slate-300">
                              <Lock className="w-4 h-4" />
                            </div>
                          </div>
                        )}
                        {day.stops.map((stop, stopIndex) => (
                          <div
                            key={stop.id}
                            className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50"
                          >
                            {/* Stop number */}
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0"
                              style={{ backgroundColor: day.color }}
                            >
                              {inheritedStart ? stopIndex + 2 : stopIndex + 1}
                            </div>

                            {/* Stop info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-900 truncate">
                                  {stop.name}
                                </span>
                                {stop.isLocked && (
                                  <Lock className="w-3 h-3 text-amber-500 flex-shrink-0" />
                                )}
                              </div>
                              {stop.duration && (
                                <span className="text-xs text-slate-400">
                                  {stop.duration} min
                                </span>
                              )}
                            </div>

                            {/* Move buttons */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (prevDayId) {
                                    onMoveStopToDay(day.id, prevDayId, stop.id);
                                  }
                                }}
                                disabled={!prevDayId}
                                className={clsx(
                                  'p-1.5 rounded transition-colors',
                                  prevDayId
                                    ? 'hover:bg-slate-200 text-slate-500'
                                    : 'text-slate-200 cursor-not-allowed'
                                )}
                                title={prevDayId ? `Move to Day ${dayIndex}` : 'No previous day'}
                              >
                                <ArrowLeft className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (nextDayId) {
                                    onMoveStopToDay(day.id, nextDayId, stop.id);
                                  }
                                }}
                                disabled={!nextDayId}
                                className={clsx(
                                  'p-1.5 rounded transition-colors',
                                  nextDayId
                                    ? 'hover:bg-slate-200 text-slate-500'
                                    : 'text-slate-200 cursor-not-allowed'
                                )}
                                title={nextDayId ? `Move to Day ${dayIndex + 2}` : 'No next day'}
                              >
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Edit day button */}
                    <div className="p-3 bg-slate-50 border-t border-slate-100">
                      <button
                        onClick={() => onSelectDay(day.id)}
                        className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Edit Day {dayIndex + 1}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
