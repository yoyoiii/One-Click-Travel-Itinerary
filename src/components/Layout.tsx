import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Search, MapPin, User as UserIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  const isDetailPage = location.pathname === '/detail';

  return (
    <div className="min-h-screen relative bg-[var(--bg-base)]">
      <div className="max-w-md mx-auto min-h-screen relative flex flex-col bg-[var(--bg-base)]">
        <main className={clsx("flex-1 overflow-y-auto", !isDetailPage && "pb-24")}>
          {children}
        </main>

        {/* Bottom Navigation */}
        {user && !isDetailPage && (
          <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[calc(28rem-2rem)] glass-panel rounded-[2.5rem] p-2 flex items-center justify-around z-40">
            <NavLink 
              to="/"
              className={({ isActive }) => clsx(
                "flex flex-col items-center gap-1.5 p-2.5 transition-all w-24 rounded-2xl",
                isActive ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
              )}
            >
              <Search className="w-5 h-5" />
              <span className="text-[11px] font-black">规划</span>
            </NavLink>
            <NavLink 
              to="/collection"
              className={({ isActive }) => clsx(
                "flex flex-col items-center gap-1.5 p-2.5 transition-all w-24 rounded-2xl",
                isActive ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
              )}
            >
              <MapPin className="w-5 h-5" />
              <span className="text-[11px] font-black">收藏</span>
            </NavLink>
            <NavLink 
              to="/profile"
              className={({ isActive }) => clsx(
                "flex flex-col items-center gap-1.5 p-2.5 transition-all w-24 rounded-2xl",
                isActive ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
              )}
            >
              <UserIcon className="w-5 h-5" />
              <span className="text-[11px] font-black">我的</span>
            </NavLink>
          </nav>
        )}
      </div>
    </div>
  );
};
