import { ReactNode } from 'react';
import { LoadScript } from '@react-google-maps/api';
import { Loader2, AlertCircle } from 'lucide-react';

const libraries: ("places")[] = ["places"];

interface GoogleMapsProviderProps {
  children: ReactNode;
}

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-destructive/10 border border-destructive/20">
        <AlertCircle className="w-8 h-8 text-destructive mb-2" />
        <p className="text-sm text-destructive font-medium text-center">
          Google Maps API key not configured
        </p>
        <p className="text-xs text-muted-foreground text-center mt-1">
          Add VITE_GOOGLE_MAPS_API_KEY to your environment
        </p>
      </div>
    );
  }

  return (
    <LoadScript
      googleMapsApiKey={apiKey}
      libraries={libraries}
      loadingElement={
        <div className="flex items-center justify-center h-48 rounded-xl bg-secondary">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      {children}
    </LoadScript>
  );
}
