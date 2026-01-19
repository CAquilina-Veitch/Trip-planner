import {
  ChevronUp,
  ChevronDown,
  Lock,
  Unlock,
  X,
  Clock,
  Car,
  MapPin,
  Hotel,
  Camera,
  Utensils,
  Fuel,
  Coffee,
  Flag,
  Play,
} from 'lucide-react';
import type { Stop, StopType, RouteSegment } from '../types/trip';
import clsx from 'clsx';

interface StopCardProps {
  stop: Stop;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  routeFromPrevious?: RouteSegment;
  dayColor: string;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleLock: () => void;
  onRemove: () => void;
  onUpdateDuration: (duration: number | undefined) => void;
  onUpdateName: (name: string) => void;
  // Inherited start props
  isInherited?: boolean;
  fromDayIndex?: number;
}

function getStopIcon(type: StopType) {
  switch (type) {
    case 'start':
      return Play;
    case 'end':
      return Flag;
    case 'accommodation':
      return Hotel;
    case 'activity':
      return Camera;
    case 'restaurant':
      return Utensils;
    case 'gas_station':
      return Fuel;
    case 'rest_stop':
      return Coffee;
    default:
      return MapPin;
  }
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes}min`;
  }
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}min`;
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

export default function StopCard({
  stop,
  index,
  isFirst,
  isLast,
  routeFromPrevious,
  dayColor,
  onMoveUp,
  onMoveDown,
  onToggleLock,
  onRemove,
  onUpdateDuration,
  onUpdateName,
  isInherited = false,
  fromDayIndex,
}: StopCardProps) {
  const Icon = isInherited ? Play : getStopIcon(stop.type);

  // Inherited start card (read-only)
  if (isInherited) {
    return (
      <div className="bg-slate-50 rounded-lg border border-slate-200 border-dashed overflow-hidden">
        <div className="p-4">
          <div className="flex items-start gap-2">
            {/* Start indicator */}
            <div
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-slate-400 text-white"
            >
              <Play className="w-3.5 h-3.5 ml-0.5" />
            </div>

            {/* Stop info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">
                  Start
                </span>
                {fromDayIndex !== undefined && (
                  <span className="text-xs text-slate-400">
                    from Day {fromDayIndex + 1}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-700 truncate mt-0.5">
                {stop.name}
              </p>
              {stop.placeDetails?.address && (
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {stop.placeDetails.city
                    ? `${stop.placeDetails.address}, ${stop.placeDetails.city}`
                    : stop.placeDetails.address}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-2 italic">
                Edit this stop in Day {(fromDayIndex ?? 0) + 1}
              </p>
            </div>

            {/* Lock icon (always shown, not toggleable) */}
            <div className="p-1 text-slate-300">
              <Lock className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group bg-white rounded-lg border border-slate-200 overflow-hidden hover:border-slate-300 transition-colors">
      {/* Route info from previous stop */}
      {routeFromPrevious && (
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2 text-xs text-slate-500">
          <Car className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{formatDuration(routeFromPrevious.duration)}</span>
          <span className="text-slate-300">|</span>
          <span>{formatDistance(routeFromPrevious.distance)}</span>
        </div>
      )}

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-2">
          {/* Stop number with color indicator */}
          <div
            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-semibold"
            style={{ backgroundColor: dayColor }}
          >
            {index + 1}
          </div>

          {/* Stop info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                value={stop.name}
                onChange={(e) => onUpdateName(e.target.value)}
                className="text-sm font-medium text-slate-900 bg-transparent border-none
                           focus:outline-none focus:ring-0 w-full min-w-0
                           hover:bg-slate-50 focus:bg-slate-50 rounded px-1 -mx-1"
                placeholder="Stop name..."
              />
            </div>

            {/* Address */}
            {stop.placeDetails?.address && (
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {stop.placeDetails.city
                  ? `${stop.placeDetails.address}, ${stop.placeDetails.city}`
                  : stop.placeDetails.address}
              </p>
            )}

            {/* Duration and notes */}
            <div className="flex items-center gap-3 mt-2">
              {/* Duration input */}
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="number"
                  min="0"
                  step="15"
                  value={stop.duration || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    onUpdateDuration(value ? parseInt(value, 10) : undefined);
                  }}
                  placeholder="0"
                  className="w-12 text-xs text-slate-600 bg-transparent border-b border-dashed border-slate-300
                             focus:outline-none focus:border-blue-500 text-center"
                />
                <span className="text-xs text-slate-400">min</span>
              </div>

              {stop.notes && (
                <span className="text-xs text-slate-400 truncate">
                  {stop.notes}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onMoveUp}
              disabled={isFirst}
              className={clsx(
                'p-1 rounded hover:bg-slate-100 transition-colors',
                isFirst ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-slate-600'
              )}
              title="Move up"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={onMoveDown}
              disabled={isLast}
              className={clsx(
                'p-1 rounded hover:bg-slate-100 transition-colors',
                isLast ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-slate-600'
              )}
              title="Move down"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleLock}
              className={clsx(
                'p-1 rounded hover:bg-slate-100 transition-colors',
                stop.isLocked ? 'text-amber-500' : 'text-slate-400 hover:text-slate-600'
              )}
              title={stop.isLocked ? 'Unlock stop' : 'Lock stop'}
            >
              {stop.isLocked ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Unlock className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onRemove}
              className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
              title="Remove stop"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
