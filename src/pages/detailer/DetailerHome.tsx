import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Power, Star, DollarSign, Briefcase, MapPin, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAppStore } from '@/store/appStore';
import { toast } from '@/hooks/use-toast';

export default function DetailerHome() {
  const { detailers, currentUser, bookings, updateDetailerStatus } = useAppStore();
  const detailer = detailers.find((d) => d.userId === currentUser?.id || d.id === 'd1');
  
  const todayJobs = bookings.filter((b) => b.detailerId === detailer?.id && b.scheduledDate === new Date().toISOString().split('T')[0]);
  const pendingJobs = bookings.filter((b) => b.detailerId === detailer?.id && !['completed', 'rated', 'cancelled'].includes(b.status));

  const handleToggleOnline = (checked: boolean) => {
    if (detailer) {
      updateDetailerStatus(detailer.id, checked);
      toast({ title: checked ? "You're now online!" : "You're now offline" });
    }
  };

  if (!detailer) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-hero">
        <div className="container section-padding py-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Welcome back,</p>
              <h1 className="text-2xl font-bold text-foreground">{detailer.name}</h1>
            </div>
            <div className="flex items-center gap-3 bg-card px-4 py-2 rounded-full shadow-md">
              <span className="text-sm font-medium">{detailer.isOnline ? 'Online' : 'Offline'}</span>
              <Switch checked={detailer.isOnline} onCheckedChange={handleToggleOnline} />
            </div>
          </div>
        </div>
      </div>

      <div className="container section-padding py-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="card-elevated p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Star className="w-4 h-4 text-warning" />
              <span className="text-sm">Rating</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{detailer.rating}</p>
          </div>
          <div className="card-elevated p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <DollarSign className="w-4 h-4 text-success" />
              <span className="text-sm">Earnings</span>
            </div>
            <p className="text-2xl font-bold text-foreground">KES {detailer.earnings.toLocaleString()}</p>
          </div>
          <div className="card-elevated p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Briefcase className="w-4 h-4 text-primary" />
              <span className="text-sm">Completed</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{detailer.completedJobs}</p>
          </div>
          <div className="card-elevated p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <MapPin className="w-4 h-4 text-accent" />
              <span className="text-sm">Area</span>
            </div>
            <p className="text-lg font-bold text-foreground">{detailer.area}</p>
          </div>
        </div>

        {pendingJobs.length > 0 && (
          <div className="card-elevated p-5 mb-6 border-l-4 border-primary">
            <h2 className="font-semibold text-foreground mb-3">Active Jobs ({pendingJobs.length})</h2>
            {pendingJobs.slice(0, 2).map((job) => (
              <Link key={job.id} to={`/detailer/job/${job.id}`} className="block p-3 bg-secondary/30 rounded-lg mb-2 last:mb-0">
                <p className="font-medium text-foreground">{job.packageName}</p>
                <p className="text-sm text-muted-foreground">{job.vehiclePlate} • {job.location || 'Station'}</p>
              </Link>
            ))}
          </div>
        )}

        <Link to="/detailer/jobs">
          <Button className="btn-primary w-full">View All Jobs</Button>
        </Link>
      </div>
    </div>
  );
}
