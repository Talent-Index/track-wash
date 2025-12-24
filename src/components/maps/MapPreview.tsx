import { GoogleMap, Marker } from '@react-google-maps/api';
import { useJsApiLoader } from '@react-google-maps/api';
import { MapPin, AlertCircle, Loader2 } from 'lucide-react';

interface MapPreviewProps {
  lat: number;
  lng: number;
  address?: string;
  height?: string;
}

const libraries: ("places")[] = ["places"];

export function MapPreview({ lat, lng, address, height = '160px' }: MapPreviewProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || '',
    libraries,
  });

  if (!apiKey) {
    return (
      <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-secondary" style={{ height }}>
        <MapPin className="w-6 h-6 text-muted-foreground mb-2" />
        <p className="text-xs text-muted-foreground text-center">{address || 'Location set'}</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-destructive/10" style={{ height }}>
        <AlertCircle className="w-6 h-6 text-destructive mb-2" />
        <p className="text-xs text-destructive">Failed to load map</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center rounded-xl bg-secondary" style={{ height }}>
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ height }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={{ lat, lng }}
        zoom={15}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          zoomControl: false,
          gestureHandling: 'none',
          disableDefaultUI: true,
        }}
      >
        <Marker position={{ lat, lng }} />
      </GoogleMap>
    </div>
  );
}
