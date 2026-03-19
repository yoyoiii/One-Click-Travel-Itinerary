import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Search, MapPin, LogOut, User as UserIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isDetailPage = location.pathname === '/detail';

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl relative flex flex-col">
        <main className={clsx("flex-1 overflow-y-auto", !isDetailPage && "pb-24")}>
          {children}
        </main>

        {/* Bottom Navigation */}
        {user && !isDetailPage && (
          <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/80 backdrop-blur-lg border-t border-slate-100 p-3 flex items-center justify-around z-40">
            <NavLink 
              to="/"
              className={({ isActive }) => clsx(
                "flex flex-col items-center gap-1 p-2 rounded-2xl transition-all",
                isActive ? "text-slate-900 bg-slate-100 px-6" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Search className="w-5 h-5" />
              <span className="text-[10px] font-bold">规划行程</span>
            </NavLink>
            <NavLink 
              to="/collection"
              className={({ isActive }) => clsx(
                "flex flex-col items-center gap-1 p-2 rounded-2xl transition-all",
                isActive ? "text-slate-900 bg-slate-100 px-6" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <MapPin className="w-5 h-5" />
              <span className="text-[10px] font-bold">旅行集</span>
            </NavLink>
            <NavLink 
              to="/profile"
              className={({ isActive }) => clsx(
                "flex flex-col items-center gap-1 p-2 rounded-2xl transition-all",
                isActive ? "text-slate-900 bg-slate-100 px-6" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <UserIcon className="w-5 h-5" />
              <span className="text-[10px] font-bold">我</span>
            </NavLink>
          </nav>
        )}
      </div>
    </div>
  );
};
