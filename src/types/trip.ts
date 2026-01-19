export interface Location {
  lat: number;
  lng: number;
}

export interface Stop {
  id: string;
  name: string;
  location: Location;
  isLocked: boolean; // For locked start/end points
  duration?: number; // Duration in minutes
  notes?: string;
  type: 'start' | 'waypoint' | 'end' | 'accommodation' | 'activity';
}

export interface Day {
  id: string;
  date: string;
  stops: Stop[];
  isVisible: boolean; // Toggle visibility on map
}

export interface Trip {
  id: string;
  name: string;
  days: Day[];
}
