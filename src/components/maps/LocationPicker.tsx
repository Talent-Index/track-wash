import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export interface LocationData {
  lat: number;
  lng: number;
  formattedAddress: string;
  area: string;
}

interface LocationPickerProps {
  value?: LocationData | null;
  onChange: (location: LocationData) => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '240px',
  borderRadius: '12px',
};

const defaultCenter = {
  lat: -1.2921,
  lng: 36.8219,
};

const nairobiAreas = [
  'Westlands', 'Kilimani', 'Lavington', 'Karen', 'Langata', 'CBD',
  'Parklands', 'Upperhill', 'South B', 'South C', 'Embakasi', 'Kasarani',
  'Ruaka', 'Gigiri', 'Runda', 'Muthaiga', 'Kileleshwa', 'Hurlingham'
];

function deriveArea(address: string): string {
  const lowerAddress = address.toLowerCase();
  for (const area of nairobiAreas) {
    if (lowerAddress.includes(area.toLowerCase())) {
      return area;
    }
  }
  return 'Nairobi';
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral | null>(
    value ? { lat: value.lat, lng: value.lng } : null
  );
  const [inputValue, setInputValue] = useState(value?.formattedAddress || '');
  const [isLocating, setIsLocating] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const onAutocompleteLoad = useCallback((autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  }, []);

  const onPlaceChanged = useCallback(() => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const formattedAddress = place.formatted_address || place.name || '';
        const area = deriveArea(formattedAddress);

        setMarkerPosition({ lat, lng });
        setInputValue(formattedAddress);
        map?.panTo({ lat, lng });
        map?.setZoom(16);

        onChange({ lat, lng, formattedAddress, area });
      }
    }
  }, [map, onChange]);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });

      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          const formattedAddress = results[0].formatted_address;
          const area = deriveArea(formattedAddress);
          setInputValue(formattedAddress);
          onChange({ lat, lng, formattedAddress, area });
        } else {
          const fallbackAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          setInputValue(fallbackAddress);
          onChange({ lat, lng, formattedAddress: fallbackAddress, area: 'Nairobi' });
        }
      });
    }
  }, [onChange]);

  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({ title: 'Geolocation not supported', variant: 'destructive' });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setMarkerPosition({ lat, lng });
        map?.panTo({ lat, lng });
        map?.setZoom(16);

        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          setIsLocating(false);
          if (status === 'OK' && results?.[0]) {
            const formattedAddress = results[0].formatted_address;
            const area = deriveArea(formattedAddress);
            setInputValue(formattedAddress);
            onChange({ lat, lng, formattedAddress, area });
            toast({ title: 'Location set', description: formattedAddress });
          } else {
            const fallbackAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            setInputValue(fallbackAddress);
            onChange({ lat, lng, formattedAddress: fallbackAddress, area: 'Nairobi' });
          }
        });
      },
      (error) => {
        setIsLocating(false);
        toast({
          title: 'Could not get location',
          description: error.message,
          variant: 'destructive',
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [map, onChange]);

  useEffect(() => {
    if (value && map) {
      setMarkerPosition({ lat: value.lat, lng: value.lng });
      setInputValue(value.formattedAddress);
      map.panTo({ lat: value.lat, lng: value.lng });
    }
  }, [value, map]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Autocomplete
          onLoad={onAutocompleteLoad}
          onPlaceChanged={onPlaceChanged}
          options={{
            componentRestrictions: { country: 'ke' },
            types: ['geocode', 'establishment'],
          }}
        >
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search for a location in Nairobi..."
              className="input-field pl-10"
            />
          </div>
        </Autocomplete>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleUseCurrentLocation}
        disabled={isLocating}
      >
        {isLocating ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Navigation className="w-4 h-4 mr-2" />
        )}
        Use my current location
      </Button>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={markerPosition || defaultCenter}
        zoom={markerPosition ? 16 : 12}
        onLoad={onLoad}
        onClick={handleMapClick}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          zoomControl: true,
        }}
      >
        {markerPosition && (
          <Marker
            position={markerPosition}
            animation={google.maps.Animation.DROP}
          />
        )}
      </GoogleMap>

      {value && (
        <div className="p-3 rounded-lg bg-secondary/50 text-sm">
          <p className="font-medium text-foreground">{value.formattedAddress}</p>
          <p className="text-muted-foreground mt-1">Area: {value.area}</p>
        </div>
      )}
    </div>
  );
}
