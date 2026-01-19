import { useState, useCallback, useEffect } from 'react';
import type { Trip, Day, Stop, RouteSegment, DayStats } from '../types/trip';
import { getDayColor } from '../types/trip';

const STORAGE_KEY = 'trip-planner-data';

function createEmptyTrip(): Trip {
  return {
    id: crypto.randomUUID(),
    name: 'My Trip',
    days: [],
    settings: {
      defaultStopDuration: 60,
      distanceUnit: 'km',
    },
  };
}

function createEmptyDay(index: number, date?: string): Day {
  const today = new Date();
  today.setDate(today.getDate() + index);

  return {
    id: crypto.randomUUID(),
    date: date || today.toISOString().split('T')[0],
    stops: [],
    isVisible: true,
    color: getDayColor(index),
    routeSegments: [],
  };
}

function loadFromStorage(): Trip | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load trip from storage:', e);
  }
  return null;
}

function saveToStorage(trip: Trip): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trip));
  } catch (e) {
    console.error('Failed to save trip to storage:', e);
  }
}

export function useTrip() {
  const [trip, setTrip] = useState<Trip>(() => {
    return loadFromStorage() || createEmptyTrip();
  });
  const [selectedDayId, setSelectedDayId] = useState<string | null>(() => {
    const loaded = loadFromStorage();
    return loaded?.days[0]?.id || null;
  });
  const [isAddingStop, setIsAddingStop] = useState(false);

  // Persist to localStorage on changes
  useEffect(() => {
    saveToStorage(trip);
  }, [trip]);

  // Add a new day
  const addDay = useCallback((afterDayId?: string) => {
    const newDayId = crypto.randomUUID();

    setTrip(prev => {
      const insertIndex = afterDayId
        ? prev.days.findIndex(d => d.id === afterDayId) + 1
        : prev.days.length;

      const newDay = { ...createEmptyDay(prev.days.length), id: newDayId };
      const newDays = [...prev.days];
      newDays.splice(insertIndex, 0, newDay);

      // Reassign colors based on new positions
      const recoloredDays = newDays.map((day, idx) => ({
        ...day,
        color: getDayColor(idx),
      }));

      return { ...prev, days: recoloredDays };
    });

    // Select the newly added day
    setSelectedDayId(newDayId);
  }, []);

  // Remove a day
  const removeDay = useCallback((dayId: string) => {
    setTrip(prev => {
      const newDays = prev.days
        .filter(d => d.id !== dayId)
        .map((day, idx) => ({
          ...day,
          color: getDayColor(idx),
        }));
      return { ...prev, days: newDays };
    });
    setSelectedDayId(prev => prev === dayId ? null : prev);
  }, []);

  // Toggle day visibility
  const toggleDayVisibility = useCallback((dayId: string) => {
    setTrip(prev => ({
      ...prev,
      days: prev.days.map(day =>
        day.id === dayId ? { ...day, isVisible: !day.isVisible } : day
      ),
    }));
  }, []);

  // Add a stop to a day
  const addStop = useCallback((dayId: string, stopData: Partial<Stop>) => {
    setTrip(prev => ({
      ...prev,
      days: prev.days.map(day => {
        if (day.id !== dayId) return day;

        const newStop: Stop = {
          id: crypto.randomUUID(),
          name: stopData.name || 'New Stop',
          location: stopData.location || { lat: 0, lng: 0 },
          isLocked: stopData.isLocked ?? false,
          type: stopData.type || 'waypoint',
          duration: stopData.duration,
          notes: stopData.notes,
          placeDetails: stopData.placeDetails,
        };

        return {
          ...day,
          stops: [...day.stops, newStop],
        };
      }),
    }));
  }, []);

  // Update a stop
  const updateStop = useCallback((dayId: string, stopId: string, updates: Partial<Stop>) => {
    setTrip(prev => ({
      ...prev,
      days: prev.days.map(day =>
        day.id === dayId
          ? {
              ...day,
              stops: day.stops.map(stop =>
                stop.id === stopId ? { ...stop, ...updates } : stop
              ),
            }
          : day
      ),
    }));
  }, []);

  // Remove a stop
  const removeStop = useCallback((dayId: string, stopId: string) => {
    setTrip(prev => ({
      ...prev,
      days: prev.days.map(day =>
        day.id === dayId
          ? { ...day, stops: day.stops.filter(stop => stop.id !== stopId) }
          : day
      ),
    }));
  }, []);

  // Move stop up/down within a day
  const moveStop = useCallback((dayId: string, stopId: string, direction: 'up' | 'down') => {
    setTrip(prev => ({
      ...prev,
      days: prev.days.map(day => {
        if (day.id !== dayId) return day;

        const stopIndex = day.stops.findIndex(s => s.id === stopId);
        if (stopIndex === -1) return day;

        const newIndex = direction === 'up' ? stopIndex - 1 : stopIndex + 1;
        if (newIndex < 0 || newIndex >= day.stops.length) return day;

        const newStops = [...day.stops];
        [newStops[stopIndex], newStops[newIndex]] = [newStops[newIndex], newStops[stopIndex]];

        return { ...day, stops: newStops };
      }),
    }));
  }, []);

  // Move stop to a different day
  const moveStopToDay = useCallback((fromDayId: string, toDayId: string, stopId: string) => {
    if (fromDayId === toDayId) return;

    setTrip(prev => {
      // Find the stop to move
      const fromDay = prev.days.find(d => d.id === fromDayId);
      if (!fromDay) return prev;

      const stopToMove = fromDay.stops.find(s => s.id === stopId);
      if (!stopToMove) return prev;

      return {
        ...prev,
        days: prev.days.map(day => {
          if (day.id === fromDayId) {
            // Remove from source day
            return { ...day, stops: day.stops.filter(s => s.id !== stopId) };
          }
          if (day.id === toDayId) {
            // Add to target day
            return { ...day, stops: [...day.stops, stopToMove] };
          }
          return day;
        }),
      };
    });
  }, []);

  // Toggle stop lock
  const toggleLock = useCallback((dayId: string, stopId: string) => {
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
  }, []);

  // Update route segments for a day
  const updateRouteSegments = useCallback((dayId: string, segments: RouteSegment[]) => {
    setTrip(prev => ({
      ...prev,
      days: prev.days.map(day =>
        day.id === dayId ? { ...day, routeSegments: segments } : day
      ),
    }));
  }, []);

  // Update day stats
  const updateDayStats = useCallback((dayId: string, stats: DayStats) => {
    setTrip(prev => ({
      ...prev,
      days: prev.days.map(day =>
        day.id === dayId ? { ...day, stats } : day
      ),
    }));
  }, []);

  // Update trip name
  const updateTripName = useCallback((name: string) => {
    setTrip(prev => ({ ...prev, name }));
  }, []);

  // Get selected day
  const selectedDay = trip.days.find(d => d.id === selectedDayId) || null;

  // Get the inherited start for a day (previous day's last stop)
  const getInheritedStart = useCallback((dayId: string): { stop: Stop; fromDayIndex: number } | null => {
    const dayIndex = trip.days.findIndex(d => d.id === dayId);
    if (dayIndex <= 0) return null; // Day 1 has no inherited start

    const prevDay = trip.days[dayIndex - 1];
    if (prevDay.stops.length === 0) return null;

    return {
      stop: prevDay.stops[prevDay.stops.length - 1],
      fromDayIndex: dayIndex - 1,
    };
  }, [trip.days]);

  return {
    trip,
    selectedDayId,
    selectedDay,
    isAddingStop,
    // Actions
    setTrip,
    setSelectedDayId,
    setIsAddingStop,
    addDay,
    removeDay,
    toggleDayVisibility,
    addStop,
    updateStop,
    removeStop,
    moveStop,
    moveStopToDay,
    toggleLock,
    updateRouteSegments,
    updateDayStats,
    updateTripName,
    getInheritedStart,
  };
}

export type UseTripReturn = ReturnType<typeof useTrip>;
