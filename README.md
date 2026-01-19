# Trip Planner - Visual Route Planning Tool

A free, open-source trip planner that helps you visualize and organize multi-day trips with interactive maps, draggable waypoints, and route planning.

## Features

- **Day-by-Day Planning**: Organize your trip into individual days
- **Interactive Map**: Powered by OpenStreetMap and Leaflet (100% free)
- **Draggable Markers**: Click and drag stops to adjust your route in real-time
- **Locked Stops**: Lock start/end points (like booked hotels) to prevent accidental changes
- **Automatic Routing**: See driving routes between stops using OSRM (free routing service)
- **Multiple Stop Types**:
  - 🟢 Start points
  - 🔴 End points
  - 🟠 Accommodations
  - 🟣 Activities
  - 🔵 Waypoints
- **Duration Tracking**: Add time estimates for each stop
- **Notes**: Add details and information to each location
- **Day Visibility**: Toggle which days appear on the map
- **No API Keys Required**: Completely free with no sign-ups or credit cards

## Tech Stack

All free and open-source:
- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast development server
- **Leaflet** - Map library
- **OpenStreetMap** - Map tiles (free)
- **OSRM** - Routing service (free)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd Trip-planner
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

## Usage

### Adding Stops

1. Select a day from the sidebar
2. Click "+ Add Stop" to add a new waypoint
3. Drag the marker on the map to position it
4. The route will automatically update

### Locking Stops

Click the lock icon (🔒) next to any stop to prevent it from being dragged. This is useful for:
- Booked hotels (start/end of each day)
- Fixed meeting points
- Pre-purchased tickets

### Managing Days

- Click a day header to select it and see its route
- Use the "Show" checkbox to toggle day visibility on the map
- Compare multiple days by showing them simultaneously

### Customizing Stops

Each stop can have:
- **Name**: Location name
- **Type**: start, end, accommodation, activity, or waypoint
- **Duration**: How long you'll spend there (in minutes)
- **Notes**: Additional information
- **Location**: Latitude/longitude (drag the marker to change)

## Sample Data

The app includes sample data of a European road trip from Paris to La Rochelle. Replace `initialTrip` in `src/App.tsx` with your own trip data.

## Data Format

```typescript
{
  id: '1',
  name: 'My Trip',
  days: [
    {
      id: '1',
      date: '2024-06-01',
      isVisible: true,
      stops: [
        {
          id: 's1-1',
          name: 'Starting City',
          location: { lat: 48.8566, lng: 2.3522 },
          type: 'start',
          isLocked: true,
          duration: 60,
          notes: 'Hotel check-in'
        }
      ]
    }
  ]
}
```

## Future Enhancements

Potential features you could add:
- Import from Google Maps
- Export to GPX/KML
- POI discovery along routes (using Overpass API)
- Weather integration
- Distance/time summaries
- Local storage persistence
- Share trips via URL
- Print itineraries

## Free API Limits

All services used are free:
- **OpenStreetMap tiles**: Unlimited (fair use)
- **OSRM routing**: Unlimited (fair use, max 100 requests/min)
- **Overpass API**: Free for POI queries

For heavy usage, you can self-host these services.

## Contributing

Feel free to submit issues or pull requests!

## License

MIT License - feel free to use for personal or commercial projects.
