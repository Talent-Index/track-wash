import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Star, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAppStore, nairobiAreas } from '@/store/appStore';
import { cn } from '@/lib/utils';

export default function Explore() {
  const { stations, detailers } = useAppStore();
  const [activeTab, setActiveTab] = useState('doorstep');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [minRating, setMinRating] = useState(0);
  const [availableOnly, setAvailableOnly] = useState(false);

  const filteredDetailers = useMemo(() => {
    return detailers.filter((d) => {
      if (searchQuery && !d.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (selectedArea !== 'all' && d.area !== selectedArea) return false;
      if (d.rating < minRating) return false;
      if (availableOnly && d.availability !== 'available') return false;
      return true;
    });
  }, [detailers, searchQuery, selectedArea, minRating, availableOnly]);

  const filteredStations = useMemo(() => {
    return stations.filter((s) => {
      if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (selectedArea !== 'all' && s.area !== selectedArea) return false;
      if (s.rating < minRating) return false;
      if (availableOnly && s.availability !== 'available') return false;
      return true;
    });
  }, [stations, searchQuery, selectedArea, minRating, availableOnly]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedArea('all');
    setPriceRange([0, 10000]);
    setMinRating(0);
    setAvailableOnly(false);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-16 z-40">
        <div className="container section-padding py-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search detailers or stations..."
                className="pl-10 input-field"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(showFilters && 'bg-primary/10 text-primary border-primary')}
            >
              <Filter className="w-5 h-5" />
            </Button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-secondary/30 rounded-xl animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium text-foreground">Filters</span>
                <button onClick={clearFilters} className="text-sm text-primary hover:underline">
                  Clear all
                </button>
              </div>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Area</label>
                  <Select value={selectedArea} onValueChange={setSelectedArea}>
                    <SelectTrigger className="input-field">
                      <SelectValue placeholder="All areas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All areas</SelectItem>
                      {nairobiAreas.map((area) => (
                        <SelectItem key={area} value={area}>{area}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">
                    Min Rating: {minRating} ★
                  </label>
                  <Slider
                    value={[minRating]}
                    onValueChange={([val]) => setMinRating(val)}
                    max={5}
                    step={0.5}
                    className="mt-3"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm text-muted-foreground">Available now only</label>
                  <Switch checked={availableOnly} onCheckedChange={setAvailableOnly} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="container section-padding py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-2 mb-6">
            <TabsTrigger value="doorstep" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Doorstep Detailers
            </TabsTrigger>
            <TabsTrigger value="stations" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Nearby Stations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="doorstep" className="mt-0">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDetailers.map((detailer, i) => (
                <DetailerCard key={detailer.id} detailer={detailer} index={i} />
              ))}
            </div>
            {filteredDetailers.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No detailers found matching your criteria
              </div>
            )}
          </TabsContent>

          <TabsContent value="stations" className="mt-0">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStations.map((station, i) => (
                <StationCard key={station.id} station={station} index={i} />
              ))}
            </div>
            {filteredStations.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No stations found matching your criteria
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function DetailerCard({ detailer, index }: { detailer: any; index: number }) {
  return (
    <div
      className="card-interactive animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="aspect-[16/9] bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center text-3xl font-bold text-primary">
          {detailer.name.charAt(0)}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-foreground">{detailer.name}</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              {detailer.area}
            </div>
          </div>
          <StatusBadge status={detailer.availability} />
        </div>

        <div className="flex items-center gap-4 text-sm mb-4">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-warning fill-warning" />
            <span className="font-medium">{detailer.rating}</span>
            <span className="text-muted-foreground">({detailer.reviewCount})</span>
          </div>
          <span className="text-muted-foreground">{detailer.priceRange}</span>
        </div>

        <div className="flex gap-2">
          <Link to={`/booking/new?detailer=${detailer.id}`} className="flex-1">
            <Button className="btn-primary w-full text-sm py-2 h-auto">Book Now</Button>
          </Link>
          <Button variant="outline" className="text-sm py-2 h-auto">View</Button>
        </div>
      </div>
    </div>
  );
}

function StationCard({ station, index }: { station: any; index: number }) {
  return (
    <div
      className="card-interactive animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="aspect-[16/9] bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
          {station.name.charAt(0)}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-foreground">{station.name}</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              {station.area}
            </div>
          </div>
          <StatusBadge status={station.availability} />
        </div>

        <div className="flex items-center gap-4 text-sm mb-4">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-warning fill-warning" />
            <span className="font-medium">{station.rating}</span>
            <span className="text-muted-foreground">({station.reviewCount})</span>
          </div>
          <span className="text-muted-foreground">{station.priceRange}</span>
        </div>

        <div className="flex gap-2">
          <Link to={`/booking/new?station=${station.id}`} className="flex-1">
            <Button className="btn-primary w-full text-sm py-2 h-auto">Book Now</Button>
          </Link>
          <Button variant="outline" className="text-sm py-2 h-auto">View</Button>
        </div>
      </div>
    </div>
  );
}
