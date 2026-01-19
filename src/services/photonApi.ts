import type { Location, PlaceDetails } from '../types/trip';

const PHOTON_URL = 'https://photon.komoot.io/api/';

export interface SearchResult {
  id: string;
  name: string;
  displayAddress: string;
  location: Location;
  placeDetails: PlaceDetails;
}

interface PhotonFeature {
  geometry: {
    coordinates: [number, number]; // [lng, lat]
  };
  properties: {
    osm_id?: number;
    osm_type?: string;
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    state?: string;
    country?: string;
    type?: string;
    osm_key?: string;
    osm_value?: string;
  };
}

interface PhotonResponse {
  features: PhotonFeature[];
}

function formatAddress(props: PhotonFeature['properties']): string {
  const parts: string[] = [];

  if (props.street) {
    parts.push(props.housenumber ? `${props.housenumber} ${props.street}` : props.street);
  }

  if (props.city) {
    parts.push(props.city);
  } else if (props.state) {
    parts.push(props.state);
  }

  if (props.country) {
    parts.push(props.country);
  }

  return parts.join(', ') || 'Unknown location';
}

function transformPhotonResult(feature: PhotonFeature): SearchResult {
  const props = feature.properties;
  const [lng, lat] = feature.geometry.coordinates;

  return {
    id: `${props.osm_type || 'place'}-${props.osm_id || Math.random().toString(36).slice(2)}`,
    name: props.name || formatAddress(props),
    displayAddress: formatAddress(props),
    location: { lat, lng },
    placeDetails: {
      displayName: props.name || formatAddress(props),
      address: props.street
        ? (props.housenumber ? `${props.housenumber} ${props.street}` : props.street)
        : undefined,
      city: props.city,
      country: props.country,
      placeType: props.osm_value || props.type,
      osmId: props.osm_id?.toString(),
    },
  };
}

export async function searchPlaces(
  query: string,
  options?: {
    lat?: number;
    lng?: number;
    limit?: number;
    lang?: string;
  }
): Promise<SearchResult[]> {
  if (!query.trim()) {
    return [];
  }

  const params = new URLSearchParams({
    q: query,
    limit: String(options?.limit || 5),
    lang: options?.lang || 'en',
  });

  // Bias results toward map center if provided
  if (options?.lat !== undefined && options?.lng !== undefined) {
    params.append('lat', String(options.lat));
    params.append('lon', String(options.lng));
  }

  try {
    const response = await fetch(`${PHOTON_URL}?${params}`);
    if (!response.ok) {
      throw new Error(`Photon API error: ${response.status}`);
    }

    const data: PhotonResponse = await response.json();
    return data.features.map(transformPhotonResult);
  } catch (error) {
    console.error('Place search error:', error);
    return [];
  }
}

// Parse coordinates from various formats
export function parseCoordinates(input: string): Location | null {
  const trimmed = input.trim();

  // Format: "48.8566, 2.3522" or "48.8566 2.3522"
  const decimalMatch = trimmed.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);
  if (decimalMatch) {
    const lat = parseFloat(decimalMatch[1]);
    const lng = parseFloat(decimalMatch[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }

  // Format: Google Maps URL
  const gmapsMatch = trimmed.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (gmapsMatch) {
    const lat = parseFloat(gmapsMatch[1]);
    const lng = parseFloat(gmapsMatch[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }

  return null;
}

// Reverse geocode - get place name from coordinates
export async function reverseGeocode(location: Location): Promise<PlaceDetails | null> {
  try {
    const params = new URLSearchParams({
      lat: String(location.lat),
      lon: String(location.lng),
      lang: 'en',
    });

    const response = await fetch(`https://photon.komoot.io/reverse?${params}`);
    if (!response.ok) {
      return null;
    }

    const data: PhotonResponse = await response.json();
    if (data.features.length > 0) {
      const result = transformPhotonResult(data.features[0]);
      return result.placeDetails;
    }
  } catch (error) {
    console.error('Reverse geocode error:', error);
  }

  return null;
}
