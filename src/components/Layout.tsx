import React from 'react';
import { NavLink } from 'react-router-dom';
import { Search, MapPin } from 'lucide-react';
import { clsx } from 'clsx';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl relative flex flex-col">
        <main className="flex-1 overflow-y-auto pb-24">
          {children}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/80 backdrop-blur-lg border-t border-slate-100 p-3 flex items-center justify-around z-40">
          <NavLink 
            to="/"
            className={({ isActive }) => clsx(
              "flex flex-col items-center gap-1 p-2 rounded-2xl transition-all",
              isActive ? "text-emerald-600 bg-emerald-50 px-6" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Search className="w-5 h-5" />
            <span className="text-[10px] font-bold">规划行程</span>
          </NavLink>
          <NavLink 
            to="/collection"
            className={({ isActive }) => clsx(
              "flex flex-col items-center gap-1 p-2 rounded-2xl transition-all",
              isActive ? "text-emerald-600 bg-emerald-50 px-6" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <MapPin className="w-5 h-5" />
            <span className="text-[10px] font-bold">我的旅行集</span>
          </NavLink>
        </nav>
      </div>
    </div>
  );
};
