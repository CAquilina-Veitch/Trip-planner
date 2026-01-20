import { useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Day, Location, RouteSegment, DayStats } from '../types/trip';
import { reverseGeocode } from '../services/photonApi';
import { routeQueue } from '../services/routeQueue';

interface TripMapProps {
  days: Day[];
  selectedDayId: string | null;
  isAddingStop: boolean;
  tripId: string;
  onStopDrag: (stopId: string, newLocation: Location) => void;
  onMapClick: (location: Location, placeName?: string) => void;
  onRouteCalculated: (dayId: string, segments: RouteSegment[], stats: DayStats) => void;
  onMapCenterChange?: (center: Location) => void;
}

// Create custom marker icon
function createMarkerIcon(dayColor: string, index: number, isLocked: boolean, isSelected: boolean) {
  const size = isSelected ? 36 : 30;
  const borderWidth = isLocked ? 3 : 0;

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="stop-marker ${isLocked ? 'locked' : ''}" style="
        background-color: ${dayColor};
        width: ${size}px;
        height: ${size}px;
        border: ${borderWidth}px solid #000;
        ${isSelected ? 'box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);' : ''}
      ">
        ${index + 1}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Component to handle map click events
function MapClickHandler({
  isAddingStop,
  onMapClick
}: {
  isAddingStop: boolean;
  onMapClick: (location: Location, placeName?: string) => void;
}) {
  useMapEvents({
    click: async (e) => {
      if (!isAddingStop) return;

      const location = { lat: e.latlng.lat, lng: e.latlng.lng };

      // Try to get place name via reverse geocoding
      const placeDetails = await reverseGeocode(location);
      onMapClick(location, placeDetails?.displayName);
    },
  });

  return null;
}

// Component to track map center
function MapCenterTracker({ onCenterChange }: { onCenterChange?: (center: Location) => void }) {
  const map = useMap();

  useEffect(() => {
    if (!onCenterChange) return;

    const handleMoveEnd = () => {
      const center = map.getCenter();
      onCenterChange({ lat: center.lat, lng: center.lng });
    };

    map.on('moveend', handleMoveEnd);
    // Initial center
    handleMoveEnd();

    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [map, onCenterChange]);

  return null;
}

// Component to handle routing for a single day
function DayRoute({
  day,
  isSelected,
  onRouteCalculated,
  inheritedStart,
}: {
  day: Day;
  isSelected: boolean;
  onRouteCalculated: (dayId: string, segments: RouteSegment[], stats: DayStats) => void;
  inheritedStart: { lat: number; lng: number } | null;
}) {
  const map = useMap();
  const routeRef = useRef<L.Polyline[]>([]);

  const calculateRoute = useCallback(async () => {
    // Include inherited start in route calculation
    const routeStops = inheritedStart
      ? [{ location: inheritedStart }, ...day.stops]
      : day.stops;

    if (routeStops.length < 2) return;

    // Clean up old routes immediately
    routeRef.current.forEach(line => map.removeLayer(line));
    routeRef.current = [];

    // Build coordinates string for OSRM
    const coords = routeStops
      .map(stop => `${stop.location.lng},${stop.location.lat}`)
      .join(';');

    // Use queue to rate-limit requests
    await routeQueue.enqueue(day.id, async () => {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=true`
      );

      if (response.status === 429) {
        throw new Error('429 Rate limited');
      }

      if (!response.ok) throw new Error('Route calculation failed');

      const data = await response.json();

      if (data.code !== 'Ok' || !data.routes?.[0]) {
        throw new Error('No route found');
      }

      const route = data.routes[0];
      const legs = route.legs;

      // Create route segments
      const segments: RouteSegment[] = [];
      let totalDrivingTime = 0;
      let totalDrivingDistance = 0;

      // When we have inherited start, first leg is from inherited start to first real stop
      const startOffset = inheritedStart ? 1 : 0;

      for (let i = 0; i < legs.length; i++) {
        const leg = legs[i];
        totalDrivingTime += leg.duration;
        totalDrivingDistance += leg.distance;

        if (inheritedStart && i === 0) {
          segments.push({
            fromStopId: 'inherited-start',
            toStopId: day.stops[0].id,
            distance: leg.distance,
            duration: leg.duration,
          });
        } else {
          const fromIndex = i - startOffset;
          const toIndex = i - startOffset + 1;
          if (toIndex < day.stops.length) {
            segments.push({
              fromStopId: day.stops[fromIndex].id,
              toStopId: day.stops[toIndex].id,
              distance: leg.distance,
              duration: leg.duration,
            });
          }
        }
      }

      // Calculate activity time
      const totalActivityTime = day.stops.reduce(
        (sum, stop) => sum + (stop.duration || 0),
        0
      );

      // Report stats
      onRouteCalculated(day.id, segments, {
        totalDrivingTime,
        totalDrivingDistance,
        totalActivityTime,
        stopCount: day.stops.length,
      });

      // Draw route on map
      const coordinates = route.geometry.coordinates.map(
        (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
      );

      const polyline = L.polyline(coordinates, {
        color: day.color,
        weight: isSelected ? 5 : 4,
        opacity: isSelected ? 0.9 : 0.7,
      }).addTo(map);

      routeRef.current.push(polyline);
    });
  }, [day.id, day.stops, day.color, isSelected, map, onRouteCalculated, inheritedStart]);

  // Recalculate route when stops change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      calculateRoute().catch(err => {
        console.error('Route calculation failed:', err);
      });
    }, 300);
    return () => {
      clearTimeout(timeoutId);
      routeQueue.cancel(day.id);
    };
  }, [calculateRoute, day.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      routeQueue.cancel(day.id);
      routeRef.current.forEach(line => map.removeLayer(line));
    };
  }, [map, day.id]);

  return null;
}

// Fit bounds helper
function FitBounds({ days, tripId }: { days: Day[]; tripId: string }) {
  const map = useMap();
  const fittedRef = useRef(false);
  const lastTripIdRef = useRef(tripId);

  useEffect(() => {
    // Reset fit flag when trip changes (e.g., after import)
    if (lastTripIdRef.current !== tripId) {
      fittedRef.current = false;
      lastTripIdRef.current = tripId;
    }

    if (fittedRef.current) return;

    const visibleStops = days
      .filter(day => day.isVisible)
      .flatMap(day => day.stops);

    if (visibleStops.length === 0) return;

    const bounds = L.latLngBounds(
      visibleStops.map(stop => [stop.location.lat, stop.location.lng])
    );

    map.fitBounds(bounds, { padding: [50, 50] });
    fittedRef.current = true;
  }, [days, map, tripId]);

  return null;
}

// Helper to get inherited start location for a day
function getInheritedStartLocation(days: Day[], dayId: string): { lat: number; lng: number } | null {
  const dayIndex = days.findIndex(d => d.id === dayId);
  if (dayIndex <= 0) return null; // Day 1 has no inherited start

  const prevDay = days[dayIndex - 1];
  if (prevDay.stops.length === 0) return null;

  return prevDay.stops[prevDay.stops.length - 1].location;
}

export default function TripMap({
  days,
  selectedDayId,
  isAddingStop,
  tripId,
  onStopDrag,
  onMapClick,
  onRouteCalculated,
  onMapCenterChange,
}: TripMapProps) {
  // Filter visible days
  const visibleDays = days.filter(day => day.isVisible);

  // Get all stops with their day info
  const allStops = visibleDays.flatMap(day =>
    day.stops.map((stop, index) => ({
      stop,
      index,
      day,
      isSelected: day.id === selectedDayId,
    }))
  );

  // Calculate center
  const defaultCenter: [number, number] = [48.8566, 2.3522]; // Paris
  const center: [number, number] = allStops.length > 0
    ? [
        allStops.reduce((sum, s) => sum + s.stop.location.lat, 0) / allStops.length,
        allStops.reduce((sum, s) => sum + s.stop.location.lng, 0) / allStops.length,
      ]
    : defaultCenter;

  return (
    <MapContainer
      center={center}
      zoom={allStops.length > 0 ? 8 : 5}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
      className={isAddingStop ? 'cursor-crosshair' : ''}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapClickHandler isAddingStop={isAddingStop} onMapClick={onMapClick} />
      <MapCenterTracker onCenterChange={onMapCenterChange} />
      <FitBounds days={days} tripId={tripId} />

      {/* Render routes for each visible day */}
      {visibleDays.map(day => (
        <DayRoute
          key={day.id}
          day={day}
          isSelected={day.id === selectedDayId}
          onRouteCalculated={onRouteCalculated}
          inheritedStart={getInheritedStartLocation(days, day.id)}
        />
      ))}

      {/* Render markers for all visible stops */}
      {allStops.map(({ stop, index, day, isSelected }) => (
        <Marker
          key={stop.id}
          position={[stop.location.lat, stop.location.lng]}
          icon={createMarkerIcon(day.color, index, stop.isLocked, isSelected)}
          draggable={!stop.isLocked}
          eventHandlers={{
            dragend: (e) => {
              const marker = e.target;
              const position = marker.getLatLng();
              onStopDrag(stop.id, { lat: position.lat, lng: position.lng });
            },
          }}
        >
          <Popup>
            <div className="min-w-[150px]">
              <h3 className="font-semibold text-slate-900">{stop.name}</h3>
              {stop.placeDetails?.address && (
                <p className="text-sm text-slate-500 mt-1">
                  {stop.placeDetails.address}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-600">
                <span className="px-1.5 py-0.5 bg-slate-100 rounded">
                  {stop.type}
                </span>
                {stop.duration && (
                  <span>{stop.duration} min</span>
                )}
                {stop.isLocked && (
                  <span className="text-amber-600">Locked</span>
                )}
              </div>
              {stop.notes && (
                <p className="text-sm text-slate-600 mt-2 border-t pt-2">
                  {stop.notes}
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
