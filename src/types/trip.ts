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

// Day colors for visualization - 24 unique colors with varied lightness
export const DAY_COLORS = [
  // Vibrant base colors
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  // Darker variants
  '#1E40AF', // Dark Blue
  '#047857', // Dark Emerald
  '#B45309', // Dark Amber
  '#B91C1C', // Dark Red
  '#5B21B6', // Dark Violet
  '#BE185D', // Dark Pink
  '#0E7490', // Dark Cyan
  '#4D7C0F', // Dark Lime
  // Lighter variants
  '#60A5FA', // Light Blue
  '#34D399', // Light Emerald
  '#FBBF24', // Light Amber
  '#F87171', // Light Red
  '#A78BFA', // Light Violet
  '#F472B6', // Light Pink
  '#22D3EE', // Light Cyan
  '#A3E635', // Light Lime
];

export function getDayColor(index: number): string {
  return DAY_COLORS[index % DAY_COLORS.length];
}
