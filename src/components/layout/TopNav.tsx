import { Link, useLocation } from 'react-router-dom';
import { Car, Menu, User, LogOut, ChevronDown } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const customerLinks = [
  { to: '/', label: 'Home' },
  { to: '/explore', label: 'Explore' },
  { to: '/booking/new', label: 'Book Now' },
  { to: '/loyalty', label: 'Rewards' },
  { to: '/history', label: 'History' },
];

const detailerLinks = [
  { to: '/detailer/home', label: 'Dashboard' },
  { to: '/detailer/jobs', label: 'Jobs' },
  { to: '/detailer/earnings', label: 'Earnings' },
];

const adminLinks = [
  { to: '/admin/home', label: 'Dashboard' },
  { to: '/admin/bookings', label: 'Bookings' },
  { to: '/admin/payouts', label: 'Payouts' },
  { to: '/admin/analytics', label: 'Analytics' },
  { to: '/admin/detailers', label: 'Detailers' },
];

export function TopNav() {
  const { currentUser, isAuthenticated, logout } = useAppStore();
  const location = useLocation();

  const links = !isAuthenticated
    ? [{ to: '/', label: 'Home' }, { to: '/explore', label: 'Explore' }]
    : currentUser?.role === 'admin'
    ? adminLinks
    : currentUser?.role === 'detailer'
    ? detailerLinks
    : customerLinks;

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="container flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md group-hover:shadow-glow transition-shadow">
            <Car className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl text-foreground hidden sm:block">TrackWash</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200',
                location.pathname === link.to
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium">{currentUser?.name}</span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button className="btn-primary text-sm">Get Started</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
