import { useState, useEffect } from 'react';
import { MapPin, Building2, Navigation } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface ManualLocationData {
  estate: string;
  details?: string;
  city: string;
  locationText: string;
}

interface ManualLocationPickerProps {
  value?: ManualLocationData | null;
  onChange: (location: ManualLocationData) => void;
}

const kenyanCities = [
  'Nairobi',
  'Mombasa',
  'Kisumu',
  'Nakuru',
  'Eldoret',
  'Thika',
  'Malindi',
  'Kitale',
  'Garissa',
  'Nyeri',
];

const popularAreas = [
  'Westlands', 'Kilimani', 'Lavington', 'Karen', 'Langata', 
  'Parklands', 'Upperhill', 'South B', 'South C', 'Embakasi', 
  'Kasarani', 'Ruaka', 'Gigiri', 'Runda', 'Muthaiga', 
  'Kileleshwa', 'Hurlingham', 'Syokimau', 'Athi River', 'Kitengela'
];

function generateLocationText(estate: string, city: string, details?: string): string {
  let text = estate;
  if (city && city !== 'Nairobi') {
    text += `, ${city}`;
  }
  if (details?.trim()) {
    text += ` — ${details.trim()}`;
  }
  return text;
}

export function ManualLocationPicker({ value, onChange }: ManualLocationPickerProps) {
  const [estate, setEstate] = useState(value?.estate || '');
  const [details, setDetails] = useState(value?.details || '');
  const [city, setCity] = useState(value?.city || 'Nairobi');

  // Update parent when any field changes
  useEffect(() => {
    if (estate.trim()) {
      onChange({
        estate: estate.trim(),
        details: details.trim() || undefined,
        city,
        locationText: generateLocationText(estate.trim(), city, details),
      });
    }
  }, [estate, details, city]);

  // Sync from parent value
  useEffect(() => {
    if (value) {
      setEstate(value.estate || '');
      setDetails(value.details || '');
      setCity(value.city || 'Nairobi');
    }
  }, [value?.estate, value?.details, value?.city]);

  return (
    <div className="space-y-5">
      {/* Estate / Area - Required */}
      <div className="space-y-2">
        <Label htmlFor="estate" className="text-sm font-medium flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          Estate / Area <span className="text-destructive">*</span>
        </Label>
        <Input
          id="estate"
          value={estate}
          onChange={(e) => setEstate(e.target.value)}
          placeholder="e.g., Kilimani, Ruaka, Syokimau"
          className="input-field"
          list="popular-areas"
        />
        <datalist id="popular-areas">
          {popularAreas.map((area) => (
            <option key={area} value={area} />
          ))}
        </datalist>
        {!estate.trim() && (
          <p className="text-xs text-destructive">Please enter your estate or area</p>
        )}
      </div>

      {/* Town / City - Optional */}
      <div className="space-y-2">
        <Label htmlFor="city" className="text-sm font-medium flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          Town / City
        </Label>
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className="input-field">
            <SelectValue placeholder="Select city" />
          </SelectTrigger>
          <SelectContent>
            {kenyanCities.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Additional Directions - Optional */}
      <div className="space-y-2">
        <Label htmlFor="details" className="text-sm font-medium flex items-center gap-2">
          <Navigation className="w-4 h-4 text-muted-foreground" />
          Additional Directions <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Textarea
          id="details"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Landmark, gate instructions, building name..."
          className="input-field min-h-[80px] resize-none"
          maxLength={200}
        />
        <p className="text-xs text-muted-foreground text-right">{details.length}/200</p>
      </div>

      {/* Preview */}
      {estate.trim() && (
        <div className="p-4 rounded-xl bg-success/10 border border-success/20">
          <p className="text-xs text-muted-foreground mb-1">Your location:</p>
          <p className="font-medium text-foreground">
            {generateLocationText(estate.trim(), city, details)}
          </p>
        </div>
      )}
    </div>
  );
}
