import { Car, Clock, MapPin } from 'lucide-react';
import type { Day } from '../types/trip';

interface RouteInfoOverlayProps {
  day: Day | null;
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
  const km = meters / 1000;
  return km >= 100 ? `${Math.round(km)}km` : `${km.toFixed(1)}km`;
}

export default function RouteInfoOverlay({ day }: RouteInfoOverlayProps) {
  if (!day || !day.stats || day.stops.length < 2) {
    return null;
  }

  const { stats } = day;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000]">
      <div
        className="flex items-center gap-4 px-4 py-2.5 bg-white/95 backdrop-blur-sm rounded-full shadow-lg border border-slate-200"
      >
        {/* Day indicator */}
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: day.color }}
          />
          <span className="text-sm font-medium text-slate-900">
            Day {day.date}
          </span>
        </div>

        <div className="w-px h-5 bg-slate-200" />

        {/* Stops count */}
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <MapPin className="w-4 h-4 text-slate-400" />
          <span>{stats.stopCount} stops</span>
        </div>

        <div className="w-px h-5 bg-slate-200" />

        {/* Driving time */}
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <Car className="w-4 h-4 text-slate-400" />
          <span>{formatDuration(stats.totalDrivingTime)}</span>
          <span className="text-slate-400">·</span>
          <span>{formatDistance(stats.totalDrivingDistance)}</span>
        </div>

        {/* Activity time if any */}
        {stats.totalActivityTime > 0 && (
          <>
            <div className="w-px h-5 bg-slate-200" />
            <div className="flex items-center gap-1.5 text-sm text-slate-600">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>{stats.totalActivityTime}min activities</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
