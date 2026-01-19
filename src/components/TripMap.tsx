import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import type { Stop, Day } from '../types/trip';

// Fix for default marker icons in Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

let DefaultIcon = L.icon({
  iconRetinaUrl: iconRetina,
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface TripMapProps {
  days: Day[];
  selectedDayId?: string;
  onStopDrag?: (stopId: string, newLocation: { lat: number; lng: number }) => void;
}

// Custom marker icons for different stop types
const getStopIcon = (stop: Stop, isSelected: boolean) => {
  let color = '#3388ff';

  switch (stop.type) {
    case 'start':
      color = '#00ff00';
      break;
    case 'end':
      color = '#ff0000';
      break;
    case 'accommodation':
      color = '#ff9900';
      break;
    case 'activity':
      color = '#9900ff';
      break;
    default:
      color = '#3388ff';
  }

  const borderColor = stop.isLocked ? '#000000' : color;
  const borderWidth = stop.isLocked ? 3 : 0;

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: ${borderWidth}px solid ${borderColor};
        ${isSelected ? 'box-shadow: 0 0 10px rgba(0,0,0,0.5);' : ''}
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
      ">
        ${stop.isLocked ? '🔒' : ''}
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Component to handle routing between stops
function RoutingMachine({ stops }: { stops: Stop[] }) {
  const map = useMap();
  const routingControlRef = useRef<L.Routing.Control | null>(null);

  useEffect(() => {
    if (!map || stops.length < 2) return;

    // Remove existing routing control
    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
    }

    // Create waypoints from stops
    const waypoints = stops.map(stop =>
      L.latLng(stop.location.lat, stop.location.lng)
    );

    // Create routing control using OSRM (free routing service)
    const routingControl = L.Routing.control({
      waypoints,
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1',
      }),
      lineOptions: {
        styles: [{ color: '#6FA1EC', weight: 4 }],
        extendToWaypoints: true,
        missingRouteTolerance: 0
      },
      show: false, // Hide the routing instructions panel
      addWaypoints: false,
      routeWhileDragging: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
    }).addTo(map);

    routingControlRef.current = routingControl;

    return () => {
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
      }
    };
  }, [map, stops]);

  return null;
}

export default function TripMap({ days, selectedDayId, onStopDrag }: TripMapProps) {
  // Filter visible days
  const visibleDays = days.filter(day => day.isVisible);

  // Get all stops from visible days
  const allStops = visibleDays.flatMap(day => day.stops);

  // Get stops for selected day (for routing)
  const selectedDay = days.find(day => day.id === selectedDayId);
  const routingStops = selectedDay?.stops || [];

  // Calculate center point
  const center: [number, number] = allStops.length > 0
    ? [
        allStops.reduce((sum, stop) => sum + stop.location.lat, 0) / allStops.length,
        allStops.reduce((sum, stop) => sum + stop.location.lng, 0) / allStops.length,
      ]
    : [51.505, -0.09]; // Default to London

  return (
    <MapContainer
      center={center}
      zoom={6}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Render markers for all visible stops */}
      {allStops.map(stop => (
        <Marker
          key={stop.id}
          position={[stop.location.lat, stop.location.lng]}
          icon={getStopIcon(stop, selectedDay?.stops.some(s => s.id === stop.id) || false)}
          draggable={!stop.isLocked}
          eventHandlers={{
            dragend: (e) => {
              const marker = e.target;
              const position = marker.getLatLng();
              onStopDrag?.(stop.id, { lat: position.lat, lng: position.lng });
            },
          }}
        >
          <Popup>
            <div>
              <h3>{stop.name}</h3>
              <p><strong>Type:</strong> {stop.type}</p>
              {stop.duration && <p><strong>Duration:</strong> {stop.duration} minutes</p>}
              {stop.notes && <p><strong>Notes:</strong> {stop.notes}</p>}
              <p><strong>Locked:</strong> {stop.isLocked ? 'Yes' : 'No'}</p>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Show routing for selected day */}
      {routingStops.length >= 2 && <RoutingMachine stops={routingStops} />}
    </MapContainer>
  );
}
