import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Car, DollarSign, Check, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore, BookingStatus } from '@/store/appStore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type JobTab = 'open' | 'accepted' | 'en_route' | 'in_progress' | 'completed';

const tabStatusMap: Record<JobTab, BookingStatus[]> = {
  open: ['booking_confirmed'],
  accepted: ['detailer_assigned'],
  en_route: ['en_route'],
  in_progress: ['in_progress'],
  completed: ['completed', 'rated'],
};

export default function DetailerJobs() {
  const navigate = useNavigate();
  const { bookings, detailers, currentUser, assignDetailer, updateBookingStatus, updateLoyalty, addEmailLog } = useAppStore();
  const [activeTab, setActiveTab] = useState<JobTab>('open');
  
  const detailer = detailers.find((d) => d.userId === currentUser?.id || d.id === 'd1');
  
  const getJobsForTab = (tab: JobTab) => {
    const statuses = tabStatusMap[tab];
    if (tab === 'open') {
      // Open jobs: booking_confirmed AND no detailer assigned
      return bookings.filter((b) => statuses.includes(b.status) && !b.detailerId);
    }
    // Other tabs: only jobs assigned to current detailer
    return bookings.filter((b) => statuses.includes(b.status) && b.detailerId === detailer?.id);
  };

  const handleAcceptJob = (bookingId: string) => {
    if (!detailer) return;
    assignDetailer(bookingId, detailer.id);
    addEmailLog({
      to: 'customer@email.com',
      subject: 'Detailer Assigned - TrackWash',
      type: 'detailer_assigned',
      bookingId,
    });
    toast({ title: 'Job accepted!', description: 'Navigate to the job to start.' });
    setActiveTab('accepted');
  };

  const handleStatusUpdate = (bookingId: string, newStatus: BookingStatus, customerId?: string) => {
    updateBookingStatus(bookingId, newStatus);
    addEmailLog({
      to: 'customer@email.com',
      subject: `Booking Update: ${newStatus.replace(/_/g, ' ')}`,
      type: newStatus === 'completed' ? 'service_completed' : 'booking_confirmed',
      bookingId,
    });
    
    // Increment loyalty when service completed
    if (newStatus === 'completed' && customerId) {
      updateLoyalty(customerId);
    }
    
    toast({ title: 'Status updated!' });
  };

  const tabs: { id: JobTab; label: string }[] = [
    { id: 'open', label: 'Open' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'en_route', label: 'En Route' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-card border-b border-border">
        <div className="container section-padding py-6">
          <h1 className="text-2xl font-bold text-foreground">Jobs</h1>
          <p className="text-muted-foreground">Manage your bookings</p>
        </div>
      </div>

      <div className="container section-padding py-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as JobTab)}>
          <TabsList className="w-full mb-6 overflow-x-auto flex">
            {tabs.map((tab) => {
              const count = getJobsForTab(tab.id).length;
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="flex-1 min-w-fit">
                  {tab.label}
                  {count > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
                      {count}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="space-y-4">
              {getJobsForTab(tab.id).length === 0 ? (
                <div className="card-elevated p-8 text-center">
                  <Car className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground mb-1">No {tab.label.toLowerCase()} jobs</h3>
                  <p className="text-muted-foreground text-sm">
                    {tab.id === 'open' ? 'Check back soon for new opportunities' : 'Jobs will appear here when available'}
                  </p>
                </div>
              ) : (
                getJobsForTab(tab.id).map((job) => (
                  <div key={job.id} className="card-elevated p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground">{job.packageName}</h3>
                        <p className="text-sm text-muted-foreground">{job.vehicleNickname} • {job.vehiclePlate}</p>
                      </div>
                      <p className="text-lg font-bold text-primary">KES {job.totalPrice.toLocaleString()}</p>
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
                      {job.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {job.location.split(',')[0]}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {job.scheduledTime === 'ASAP' ? 'ASAP' : `${job.scheduledDate} ${job.scheduledTime}`}
                      </div>
                      <div className="flex items-center gap-1">
                        <Car className="w-4 h-4" />
                        {job.serviceType}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {/* Open jobs - Accept */}
                      {tab.id === 'open' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/detailer/job/${job.id}`)}
                          >
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleAcceptJob(job.id)}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Accept Job
                          </Button>
                        </>
                      )}

                      {/* Accepted - Start En Route */}
                      {tab.id === 'accepted' && (
                        <>
                          <Link to={`/detailer/job/${job.id}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full">View Details</Button>
                          </Link>
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleStatusUpdate(job.id, 'en_route')}
                          >
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Start Trip
                          </Button>
                        </>
                      )}

                      {/* En Route - Arrived / Start Service */}
                      {tab.id === 'en_route' && (
                        <>
                          <Link to={`/detailer/job/${job.id}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full">View Details</Button>
                          </Link>
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleStatusUpdate(job.id, 'in_progress')}
                          >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Start Service
                          </Button>
                        </>
                      )}

                      {/* In Progress - Complete */}
                      {tab.id === 'in_progress' && (
                        <>
                          <Link to={`/detailer/job/${job.id}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full">View Details</Button>
                          </Link>
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleStatusUpdate(job.id, 'completed', job.customerId)}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Complete
                          </Button>
                        </>
                      )}

                      {/* Completed - View only */}
                      {tab.id === 'completed' && (
                        <Link to={`/detailer/job/${job.id}`} className="w-full">
                          <Button variant="outline" size="sm" className="w-full">View Details</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
