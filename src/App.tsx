import { useState, useCallback } from 'react';
import { useTrip } from './hooks/useTrip';
import TripMap from './components/TripMap';
import Sidebar from './components/Sidebar';
import RouteInfoOverlay from './components/RouteInfoOverlay';
import type { Location, RouteSegment, DayStats } from './types/trip';
import './App.css';

function App() {
  const tripState = useTrip();
  const [mapCenter, setMapCenter] = useState<Location | undefined>();

  const {
    trip,
    selectedDayId,
    selectedDay,
    isAddingStop,
    addStop,
    updateStop,
    updateRouteSegments,
    updateDayStats,
    setIsAddingStop,
  } = tripState;

  // Handle marker drag on map
  const handleStopDrag = useCallback((stopId: string, newLocation: Location) => {
    // Find which day contains this stop
    for (const day of trip.days) {
      const stop = day.stops.find(s => s.id === stopId);
      if (stop) {
        updateStop(day.id, stopId, { location: newLocation });
        break;
      }
    }
  }, [trip.days, updateStop]);

  // Handle click-to-add on map
  const handleMapClick = useCallback((location: Location, placeName?: string) => {
    if (!selectedDayId || !isAddingStop) return;

    addStop(selectedDayId, {
      name: placeName || `Stop at ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`,
      location,
      type: 'waypoint',
      placeDetails: placeName ? { displayName: placeName } : undefined,
    });

    // Turn off adding mode after placing
    setIsAddingStop(false);
  }, [selectedDayId, isAddingStop, addStop, setIsAddingStop]);

  // Handle route calculation results
  const handleRouteCalculated = useCallback((dayId: string, segments: RouteSegment[], stats: DayStats) => {
    updateRouteSegments(dayId, segments);
    updateDayStats(dayId, stats);
  }, [updateRouteSegments, updateDayStats]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar
        tripState={tripState}
        mapCenter={mapCenter}
      />
      <div className="flex-1 relative">
        <TripMap
          days={trip.days}
          selectedDayId={selectedDayId}
          isAddingStop={isAddingStop}
          tripId={trip.id}
          onStopDrag={handleStopDrag}
          onMapClick={handleMapClick}
          onRouteCalculated={handleRouteCalculated}
          onMapCenterChange={setMapCenter}
        />
        <RouteInfoOverlay day={selectedDay} />
      </div>
    </div>
  );
}

export default App;
