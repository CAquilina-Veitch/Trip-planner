import { useState } from 'react';
import TripMap from './components/TripMap';
import TripSidebar from './components/TripSidebar';
import type { Trip, Stop } from './types/trip';
import './App.css';

// Sample trip data - replace with your own
const initialTrip: Trip = {
  id: '1',
  name: 'European Road Trip',
  days: [
    {
      id: '1',
      date: '2024-06-01',
      isVisible: true,
      stops: [
        {
          id: 's1-1',
          name: 'Paris',
          location: { lat: 48.8566, lng: 2.3522 },
          type: 'start',
          isLocked: true,
          notes: 'Starting point - booked hotel',
        },
        {
          id: 's1-2',
          name: 'Versailles',
          location: { lat: 48.8049, lng: 2.1204 },
          type: 'activity',
          isLocked: false,
          duration: 180,
          notes: 'Visit the palace',
        },
        {
          id: 's1-3',
          name: 'Chartres',
          location: { lat: 48.4469, lng: 1.4892 },
          type: 'end',
          isLocked: true,
          notes: 'Overnight stay - hotel booked',
        },
      ],
    },
    {
      id: '2',
      date: '2024-06-02',
      isVisible: true,
      stops: [
        {
          id: 's2-1',
          name: 'Chartres',
          location: { lat: 48.4469, lng: 1.4892 },
          type: 'start',
          isLocked: true,
        },
        {
          id: 's2-2',
          name: 'Le Mans',
          location: { lat: 48.0077, lng: 0.1984 },
          type: 'waypoint',
          isLocked: false,
          duration: 90,
          notes: 'Lunch break',
        },
        {
          id: 's2-3',
          name: 'Angers',
          location: { lat: 47.4784, lng: -0.5632 },
          type: 'end',
          isLocked: true,
          notes: 'Evening accommodation',
        },
      ],
    },
    {
      id: '3',
      date: '2024-06-03',
      isVisible: true,
      stops: [
        {
          id: 's3-1',
          name: 'Angers',
          location: { lat: 47.4784, lng: -0.5632 },
          type: 'start',
          isLocked: true,
        },
        {
          id: 's3-2',
          name: 'Nantes',
          location: { lat: 47.2184, lng: -1.5536 },
          type: 'activity',
          isLocked: false,
          duration: 120,
          notes: 'City exploration',
        },
        {
          id: 's3-3',
          name: 'La Rochelle',
          location: { lat: 46.1591, lng: -1.1520 },
          type: 'end',
          isLocked: true,
          notes: 'Coastal hotel',
        },
      ],
    },
  ],
};

function App() {
  const [trip, setTrip] = useState<Trip>(initialTrip);
  const [selectedDayId, setSelectedDayId] = useState<string>('1');

  const handleDayVisibilityToggle = (dayId: string) => {
    setTrip(prev => ({
      ...prev,
      days: prev.days.map(day =>
        day.id === dayId ? { ...day, isVisible: !day.isVisible } : day
      ),
    }));
  };

  const handleAddStop = (dayId: string) => {
    const day = trip.days.find(d => d.id === dayId);
    if (!day) return;

    // Calculate a new position near the last stop
    const lastStop = day.stops[day.stops.length - 1];
    const newLocation = lastStop
      ? { lat: lastStop.location.lat + 0.1, lng: lastStop.location.lng + 0.1 }
      : { lat: 48.8566, lng: 2.3522 };

    const newStop: Stop = {
      id: `s${dayId}-${Date.now()}`,
      name: `New Stop ${day.stops.length + 1}`,
      location: newLocation,
      type: 'waypoint',
      isLocked: false,
    };

    setTrip(prev => ({
      ...prev,
      days: prev.days.map(d =>
        d.id === dayId ? { ...d, stops: [...d.stops, newStop] } : d
      ),
    }));
  };

  const handleRemoveStop = (dayId: string, stopId: string) => {
    setTrip(prev => ({
      ...prev,
      days: prev.days.map(day =>
        day.id === dayId
          ? { ...day, stops: day.stops.filter(stop => stop.id !== stopId) }
          : day
      ),
    }));
  };

  const handleToggleLock = (dayId: string, stopId: string) => {
    setTrip(prev => ({
      ...prev,
      days: prev.days.map(day =>
        day.id === dayId
          ? {
              ...day,
              stops: day.stops.map(stop =>
                stop.id === stopId ? { ...stop, isLocked: !stop.isLocked } : stop
              ),
            }
          : day
      ),
    }));
  };

  const handleStopDrag = (stopId: string, newLocation: { lat: number; lng: number }) => {
    setTrip(prev => ({
      ...prev,
      days: prev.days.map(day => ({
        ...day,
        stops: day.stops.map(stop =>
          stop.id === stopId ? { ...stop, location: newLocation } : stop
        ),
      })),
    }));
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <TripSidebar
        days={trip.days}
        selectedDayId={selectedDayId}
        onDaySelect={setSelectedDayId}
        onDayVisibilityToggle={handleDayVisibilityToggle}
        onAddStop={handleAddStop}
        onRemoveStop={handleRemoveStop}
        onToggleLock={handleToggleLock}
      />
      <div style={{ flex: 1, position: 'relative' }}>
        <TripMap
          days={trip.days}
          selectedDayId={selectedDayId}
          onStopDrag={handleStopDrag}
        />
      </div>
    </div>
  );
}

export default App;
