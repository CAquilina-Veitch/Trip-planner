import { useState } from 'react';
import { MapPinPlus, MousePointer2, Eye, EyeOff, Trash2, Download, Upload } from 'lucide-react';
import type { UseTripReturn } from '../hooks/useTrip';
import type { Location, Trip } from '../types/trip';
import type { SearchResult } from '../services/photonApi';
import PlaceSearch from './PlaceSearch';
import DayTabs from './DayTabs';
import StopCard from './StopCard';
import TripOverview from './TripOverview';
import clsx from 'clsx';

interface SidebarProps {
  tripState: UseTripReturn;
  mapCenter?: Location;
}

export default function Sidebar({ tripState, mapCenter }: SidebarProps) {
  const [showAllDays, setShowAllDays] = useState(false);

  const {
    trip,
    selectedDayId,
    selectedDay,
    isAddingStop,
    setSelectedDayId,
    setIsAddingStop,
    setTrip,
    addDay,
    removeDay,
    toggleDayVisibility,
    addStop,
    updateStop,
    removeStop,
    moveStop,
    moveStopToDay,
    toggleLock,
    updateTripName,
    getInheritedStart,
  } = tripState;

  // Get inherited start for selected day
  const inheritedStart = selectedDayId ? getInheritedStart(selectedDayId) : null;

  // Handle search result selection
  const handleSearchSelect = (result: SearchResult) => {
    if (!selectedDayId) {
      // If no day selected, create one first
      addDay();
      return;
    }

    addStop(selectedDayId, {
      name: result.name,
      location: result.location,
      placeDetails: result.placeDetails,
      type: 'waypoint',
    });
  };

  // Get route segment for a stop (from previous stop)
  const getRouteSegment = (stopId: string) => {
    if (!selectedDay) return undefined;
    return selectedDay.routeSegments.find(seg => seg.toStopId === stopId);
  };

  // Handle day selection (exit "All" view)
  const handleSelectDay = (dayId: string) => {
    setShowAllDays(false);
    setSelectedDayId(dayId);
  };

  // Handle adding a new day (exit "All" view)
  const handleAddDay = () => {
    setShowAllDays(false);
    addDay();
  };

  // Export trip to JSON file
  const handleExport = () => {
    const dataStr = JSON.stringify(trip, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${trip.name.replace(/[^a-z0-9]/gi, '_')}_trip.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import trip from JSON file
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importedTrip: Trip = JSON.parse(text);

        // Basic validation
        if (!importedTrip.id || !importedTrip.days) {
          alert('Invalid trip file format');
          return;
        }

        setTrip(importedTrip);
        if (importedTrip.days.length > 0) {
          setSelectedDayId(importedTrip.days[0].id);
        }
      } catch (err) {
        alert('Failed to import trip file');
        console.error(err);
      }
    };
    input.click();
  };

  return (
    <div className="w-[380px] h-full flex flex-col bg-white border-r border-slate-200">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between gap-3">
          <input
            type="text"
            value={trip.name}
            onChange={(e) => updateTripName(e.target.value)}
            className="flex-1 text-xl font-semibold text-slate-900 bg-transparent border-none
                       focus:outline-none focus:ring-0 min-w-0"
          />
          <div className="flex items-center gap-1">
            <button
              onClick={handleExport}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
              title="Export trip"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleImport}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
              title="Import trip"
            >
              <Upload className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-5 py-3 border-b border-slate-200">
        <PlaceSearch
          onSelect={handleSearchSelect}
          mapCenter={mapCenter}
          placeholder="Search places or paste coordinates..."
        />
      </div>

      {/* Day tabs */}
      {trip.days.length > 0 && (
        <DayTabs
          days={trip.days}
          selectedDayId={selectedDayId}
          showAllDays={showAllDays}
          onSelectDay={handleSelectDay}
          onShowAllDays={() => setShowAllDays(true)}
          onAddDay={handleAddDay}
        />
      )}

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        {trip.days.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <MapPinPlus className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No days yet
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Start planning your trip by adding a day
            </p>
            <button
              onClick={handleAddDay}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg
                         hover:bg-blue-700 transition-colors"
            >
              Add Day 1
            </button>
          </div>
        ) : showAllDays ? (
          // Show trip overview
          <TripOverview
            days={trip.days}
            onSelectDay={handleSelectDay}
            onMoveStopToDay={moveStopToDay}
          />
        ) : selectedDay ? (
          <div className="p-5">
            {/* Day header with controls */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-slate-900">
                  {selectedDay.date}
                </h3>
                {selectedDay.stats && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedDay.stats.stopCount} stops
                    {selectedDay.stats.totalDrivingTime > 0 && (
                      <> · {Math.round(selectedDay.stats.totalDrivingTime / 60)}min driving</>
                    )}
                    {selectedDay.stats.totalActivityTime > 0 && (
                      <> · {selectedDay.stats.totalActivityTime}min activities</>
                    )}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleDayVisibility(selectedDay.id)}
                  className={clsx(
                    'p-2 rounded-lg hover:bg-slate-100 transition-colors',
                    selectedDay.isVisible ? 'text-slate-600' : 'text-slate-400'
                  )}
                  title={selectedDay.isVisible ? 'Hide on map' : 'Show on map'}
                >
                  {selectedDay.isVisible ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => removeDay(selectedDay.id)}
                  className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                  title="Delete day"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Stops list */}
            {selectedDay.stops.length === 0 && !inheritedStart ? (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-500 mb-3">
                  No stops for this day yet
                </p>
                <p className="text-xs text-slate-400">
                  Search for a place above or click on the map
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Inherited start from previous day */}
                {inheritedStart && (
                  <StopCard
                    stop={inheritedStart.stop}
                    index={0}
                    isFirst={true}
                    isLast={selectedDay.stops.length === 0}
                    dayColor={selectedDay.color}
                    onMoveUp={() => {}}
                    onMoveDown={() => {}}
                    onToggleLock={() => {}}
                    onRemove={() => {}}
                    onUpdateDuration={() => {}}
                    onUpdateName={() => {}}
                    isInherited={true}
                    fromDayIndex={inheritedStart.fromDayIndex}
                  />
                )}
                {selectedDay.stops.map((stop, index) => (
                  <StopCard
                    key={stop.id}
                    stop={stop}
                    index={inheritedStart ? index + 1 : index}
                    isFirst={index === 0 && !inheritedStart}
                    isLast={index === selectedDay.stops.length - 1}
                    routeFromPrevious={getRouteSegment(stop.id)}
                    dayColor={selectedDay.color}
                    onMoveUp={() => moveStop(selectedDay.id, stop.id, 'up')}
                    onMoveDown={() => moveStop(selectedDay.id, stop.id, 'down')}
                    onToggleLock={() => toggleLock(selectedDay.id, stop.id)}
                    onRemove={() => removeStop(selectedDay.id, stop.id)}
                    onUpdateDuration={(duration) =>
                      updateStop(selectedDay.id, stop.id, { duration })
                    }
                    onUpdateName={(name) =>
                      updateStop(selectedDay.id, stop.id, { name })
                    }
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-slate-500">
            Select a day to view stops
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      {selectedDay && !showAllDays && (
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50">
          <button
            onClick={() => setIsAddingStop(!isAddingStop)}
            className={clsx(
              'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isAddingStop
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            )}
          >
            <MousePointer2 className="w-4 h-4" />
            {isAddingStop ? 'Click map to add stop' : 'Click to add stop on map'}
          </button>
        </div>
      )}
    </div>
  );
}
