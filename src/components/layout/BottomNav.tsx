import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Calendar, Gift, User, Briefcase, DollarSign, LayoutDashboard, Users, BarChart3 } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';

const customerTabs = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/explore', icon: Search, label: 'Explore' },
  { to: '/booking/new', icon: Calendar, label: 'Book' },
  { to: '/loyalty', icon: Gift, label: 'Rewards' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const detailerTabs = [
  { to: '/detailer/home', icon: Home, label: 'Home' },
  { to: '/detailer/jobs', icon: Briefcase, label: 'Jobs' },
  { to: '/detailer/earnings', icon: DollarSign, label: 'Earnings' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const adminTabs = [
  { to: '/admin/home', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/bookings', icon: Calendar, label: 'Bookings' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/detailers', icon: Users, label: 'Team' },
];

export function BottomNav() {
  const { currentUser, isAuthenticated } = useAppStore();
  const location = useLocation();

  if (!isAuthenticated) return null;

  const tabs =
    currentUser?.role === 'admin'
      ? adminTabs
      : currentUser?.role === 'detailer'
      ? detailerTabs
      : customerTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.to;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-2 gap-1 transition-all duration-200',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div
                className={cn(
                  'p-1.5 rounded-xl transition-all duration-200',
                  isActive && 'bg-primary/10'
                )}
              >
                <Icon className={cn('w-5 h-5', isActive && 'animate-scale-in')} />
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
