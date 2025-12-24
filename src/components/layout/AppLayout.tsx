import { ReactNode } from 'react';
import { TopNav } from './TopNav';
import { BottomNav } from './BottomNav';
import { useAppStore } from '@/store/appStore';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated } = useAppStore();

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className={isAuthenticated ? 'pb-safe' : ''}>{children}</main>
      <BottomNav />
    </div>
  );
}
