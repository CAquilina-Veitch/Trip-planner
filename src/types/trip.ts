export interface Location {
  lat: number;
  lng: number;
}

export interface PlaceDetails {
  displayName: string;
  address?: string;
  city?: string;
  country?: string;
  placeType?: string;
  osmId?: string;
}

export interface RouteSegment {
  fromStopId: string;
  toStopId: string;
  distance: number; // meters
  duration: number; // seconds
}

export type StopType =
  | 'start'
  | 'waypoint'
  | 'end'
  | 'accommodation'
  | 'activity'
  | 'restaurant'
  | 'gas_station'
  | 'rest_stop';

export interface Stop {
  id: string;
  name: string;
  location: Location;
  placeDetails?: PlaceDetails;
  isLocked: boolean;
  duration?: number; // Time spent at stop (minutes)
  notes?: string;
  type: StopType;
}

export interface DayStats {
  totalDrivingTime: number; // seconds
  totalDrivingDistance: number; // meters
  totalActivityTime: number; // minutes
  stopCount: number;
}

export interface Day {
  id: string;
  date: string;
  name?: string;
  stops: Stop[];
  isVisible: boolean;
  color: string;
  routeSegments: RouteSegment[];
  stats?: DayStats;
}

export interface TripSettings {
  defaultStopDuration: number; // minutes
  distanceUnit: 'km' | 'mi';
}

export interface Trip {
  id: string;
  name: string;
  description?: string;
  days: Day[];
  settings: TripSettings;
}

// Day colors for visualization
export const DAY_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
];

export function getDayColor(index: number): string {
  return DAY_COLORS[index % DAY_COLORS.length];
}
