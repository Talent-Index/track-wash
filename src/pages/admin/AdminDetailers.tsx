import { useState } from 'react';
import { Search, Star, MapPin, Phone, Mail, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAppStore } from '@/store/appStore';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { toast } from '@/hooks/use-toast';

export default function AdminDetailers() {
  const { detailers, approveDetailer, suspendDetailer } = useAppStore();
  const [search, setSearch] = useState('');
  const [selectedDetailer, setSelectedDetailer] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const filteredDetailers = detailers.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.area.toLowerCase().includes(search.toLowerCase()) ||
    d.phone.includes(search)
  );

  const detailer = detailers.find((d) => d.id === selectedDetailer);

  const handleApprove = (id: string) => {
    approveDetailer(id);
    toast({ title: 'Detailer approved!' });
  };

  const handleSuspend = (id: string) => {
    suspendDetailer(id);
    toast({ title: 'Detailer suspended' });
  };

  const openDetailModal = (id: string) => {
    setSelectedDetailer(id);
    setShowDetailModal(true);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-card border-b border-border">
        <div className="container section-padding py-6">
          <h1 className="text-2xl font-bold text-foreground">Detailers</h1>
          <p className="text-muted-foreground">
            {detailers.filter((d) => d.status === 'approved').length} approved • {detailers.filter((d) => d.status === 'pending').length} pending
          </p>
        </div>
      </div>

      <div className="container section-padding py-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search detailers..."
            className="pl-10"
          />
        </div>

        {/* Detailers Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDetailers.map((d) => (
            <div key={d.id} className="card-elevated p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-lg font-bold text-foreground">
                    {d.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{d.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {d.area}
                    </div>
                  </div>
                </div>
                <StatusBadge status={d.status} />
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-warning" />
                  {d.rating}
                </div>
                <span>{d.completedJobs} jobs</span>
                <span>KES {d.earnings.toLocaleString()}</span>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => openDetailModal(d.id)}
                >
                  View
                </Button>
                {d.status === 'pending' && (
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleApprove(d.id)}
                  >
                    Approve
                  </Button>
                )}
                {d.status === 'approved' && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleSuspend(d.id)}
                  >
                    Suspend
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detailer Profile</DialogTitle>
          </DialogHeader>
          {detailer && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-2xl font-bold text-foreground">
                  {detailer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{detailer.name}</h3>
                  <StatusBadge status={detailer.status} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-secondary/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Rating</p>
                  <p className="font-semibold text-foreground flex items-center gap-1">
                    <Star className="w-4 h-4 text-warning" />
                    {detailer.rating} ({detailer.reviewCount})
                  </p>
                </div>
                <div className="p-3 bg-secondary/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="font-semibold text-foreground">{detailer.completedJobs} jobs</p>
                </div>
                <div className="p-3 bg-secondary/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Earnings</p>
                  <p className="font-semibold text-foreground">KES {detailer.earnings.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-secondary/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Area</p>
                  <p className="font-semibold text-foreground">{detailer.area}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  {detailer.phone}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  {detailer.email}
                </div>
              </div>

              <div className="flex gap-2">
                {detailer.status === 'pending' && (
                  <Button className="flex-1" onClick={() => { handleApprove(detailer.id); setShowDetailModal(false); }}>
                    <Check className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                )}
                {detailer.status === 'approved' && (
                  <Button variant="destructive" className="flex-1" onClick={() => { handleSuspend(detailer.id); setShowDetailModal(false); }}>
                    <X className="w-4 h-4 mr-2" />
                    Suspend
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
