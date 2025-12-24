import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Car, Plus, Trash2, LogOut, ChevronRight, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store/appStore';
import { toast } from '@/hooks/use-toast';

export default function Profile() {
  const navigate = useNavigate();
  const { currentUser, vehicles, logout, addVehicle, removeVehicle } = useAppStore();

  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newPlate, setNewPlate] = useState('');
  const [newNickname, setNewNickname] = useState('');

  const userVehicles = vehicles.filter((v) => v.userId === currentUser?.id || v.userId === 'customer');

  const handleAddVehicle = () => {
    if (!newPlate || !newNickname) {
      toast({ title: 'Please fill all fields', variant: 'destructive' });
      return;
    }
    addVehicle({
      userId: currentUser?.id || 'customer',
      plate: newPlate.toUpperCase(),
      nickname: newNickname,
      type: 'sedan',
    });
    toast({ title: 'Vehicle added!' });
    setShowAddVehicle(false);
    setNewPlate('');
    setNewNickname('');
  };

  const handleRemoveVehicle = (id: string) => {
    removeVehicle(id);
    toast({ title: 'Vehicle removed' });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast({ title: 'Logged out' });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-hero">
        <div className="container section-padding py-12 text-center">
          <div className="w-24 h-24 rounded-full bg-card flex items-center justify-center mx-auto mb-4 shadow-lg">
            <User className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{currentUser?.name}</h1>
          <p className="text-muted-foreground capitalize">{currentUser?.role}</p>
        </div>
      </div>

      <div className="container section-padding -mt-4">
        {/* Contact Info */}
        <div className="card-elevated p-5 mb-6">
          <h2 className="font-semibold text-foreground mb-4">Contact Information</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <Mail className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{currentUser?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <Phone className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium text-foreground">{currentUser?.phone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicles */}
        {currentUser?.role === 'customer' && (
          <div className="card-elevated p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">My Vehicles</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowAddVehicle(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-3">
              {userVehicles.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Car className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{v.nickname}</p>
                      <p className="text-sm text-muted-foreground">{v.plate}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveVehicle(v.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {userVehicles.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No vehicles added yet
                </p>
              )}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="card-elevated overflow-hidden mb-6">
          {currentUser?.role === 'customer' && (
            <>
              <Link to="/history" className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors">
                <span className="font-medium text-foreground">Service History</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
              <div className="border-t border-border" />
              <Link to="/loyalty" className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors">
                <span className="font-medium text-foreground">Loyalty Rewards</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            </>
          )}
          {currentUser?.role === 'detailer' && (
            <>
              <Link to="/detailer/earnings" className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors">
                <span className="font-medium text-foreground">My Earnings</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
              <div className="border-t border-border" />
              <Link to="/detailer/jobs" className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors">
                <span className="font-medium text-foreground">Job History</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            </>
          )}
        </div>

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full text-destructive hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Log out
        </Button>
      </div>

      {/* Add Vehicle Dialog */}
      <Dialog open={showAddVehicle} onOpenChange={setShowAddVehicle}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add new vehicle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label className="text-sm mb-1.5 block">License plate</Label>
              <Input
                value={newPlate}
                onChange={(e) => setNewPlate(e.target.value)}
                placeholder="KDA 123A"
                className="input-field uppercase"
              />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Nickname</Label>
              <Input
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                placeholder="e.g., Daily Driver"
                className="input-field"
              />
            </div>
            <Button onClick={handleAddVehicle} className="btn-primary w-full">
              Add Vehicle
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
