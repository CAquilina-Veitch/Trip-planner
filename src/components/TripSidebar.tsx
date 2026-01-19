import type { Day, Stop } from '../types/trip';

interface TripSidebarProps {
  days: Day[];
  selectedDayId?: string;
  onDaySelect: (dayId: string) => void;
  onDayVisibilityToggle: (dayId: string) => void;
  onAddStop: (dayId: string) => void;
  onRemoveStop: (dayId: string, stopId: string) => void;
  onToggleLock: (dayId: string, stopId: string) => void;
}

export default function TripSidebar({
  days,
  selectedDayId,
  onDaySelect,
  onDayVisibilityToggle,
  onAddStop,
  onRemoveStop,
  onToggleLock,
}: TripSidebarProps) {
  return (
    <div style={{
      width: '350px',
      height: '100vh',
      overflowY: 'auto',
      backgroundColor: '#f5f5f5',
      padding: '20px',
      boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
    }}>
      <h1 style={{ marginTop: 0 }}>Trip Planner</h1>

      {days.map(day => (
        <div
          key={day.id}
          style={{
            marginBottom: '20px',
            backgroundColor: selectedDayId === day.id ? '#e3f2fd' : 'white',
            padding: '15px',
            borderRadius: '8px',
            border: selectedDayId === day.id ? '2px solid #2196f3' : '1px solid #ddd',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3
              style={{ margin: 0, cursor: 'pointer' }}
              onClick={() => onDaySelect(day.id)}
            >
              Day {day.id}
            </h3>
            <label style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={day.isVisible}
                onChange={() => onDayVisibilityToggle(day.id)}
              />
              {' '}Show
            </label>
          </div>

          <p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
            {day.date}
          </p>

          {selectedDayId === day.id && (
            <div style={{ marginTop: '15px' }}>
              <h4 style={{ marginBottom: '10px' }}>Stops:</h4>
              {day.stops.map((stop, index) => (
                <div
                  key={stop.id}
                  style={{
                    backgroundColor: '#f9f9f9',
                    padding: '10px',
                    marginBottom: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{index + 1}. {stop.name}</strong>
                    <div>
                      <button
                        onClick={() => onToggleLock(day.id, stop.id)}
                        style={{
                          marginRight: '5px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        {stop.isLocked ? '🔓' : '🔒'}
                      </button>
                      <button
                        onClick={() => onRemoveStop(day.id, stop.id)}
                        style={{
                          padding: '4px 8px',
                          cursor: 'pointer',
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', marginTop: '5px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 6px',
                        backgroundColor: getTypeColor(stop.type),
                        color: 'white',
                        borderRadius: '3px',
                        marginRight: '5px',
                      }}
                    >
                      {stop.type}
                    </span>
                    {stop.duration && <span>⏱️ {stop.duration}min</span>}
                  </div>

                  {stop.notes && (
                    <p style={{ fontSize: '12px', margin: '5px 0 0 0', color: '#666' }}>
                      📝 {stop.notes}
                    </p>
                  )}

                  <div style={{ fontSize: '11px', color: '#999', marginTop: '5px' }}>
                    📍 {stop.location.lat.toFixed(4)}, {stop.location.lng.toFixed(4)}
                  </div>
                </div>
              ))}

              <button
                onClick={() => onAddStop(day.id)}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginTop: '10px',
                  cursor: 'pointer',
                  backgroundColor: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                }}
              >
                + Add Stop
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function getTypeColor(type: Stop['type']): string {
  switch (type) {
    case 'start':
      return '#00aa00';
    case 'end':
      return '#cc0000';
    case 'accommodation':
      return '#ff9900';
    case 'activity':
      return '#9900ff';
    default:
      return '#3388ff';
  }
}
