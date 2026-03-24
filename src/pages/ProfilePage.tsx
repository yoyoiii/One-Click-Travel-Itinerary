import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, LogOut, ChevronRight, Edit2, Check, X, Moon, Sun } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';
import { useTheme } from '../context/ThemeContext';

export const ProfilePage: React.FC = () => {
  const { user, logout, updateUsername } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.displayName || '');

  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) return;
    try {
      await updateUsername(newUsername.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update username:', error);
    }
  };

  if (!user) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 space-y-6 animate-reveal min-h-full bg-[var(--bg-base)] pb-24"
    >
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-[var(--text-base)]">
          我的主页
        </h1>
        <p className="text-[var(--text-muted)] mt-1 font-medium text-xs uppercase tracking-wider">
          Account Settings
        </p>
      </header>

      {/* User Info Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between group bg-white p-5 rounded-2xl clean-card border border-[var(--border)]">
          {isEditing ? (
            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  maxLength={16}
                  className="clean-input flex-1 text-base font-black"
                  autoFocus
                />
                <button 
                  onClick={handleUpdateUsername}
                  className="p-3 bg-[var(--accent)] text-white rounded-xl hover:bg-[var(--accent)]/90 transition-all border border-[var(--accent)]"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => {
                    setIsEditing(false);
                    setNewUsername(user.displayName || '');
                  }}
                  className="p-3 bg-[var(--bg-base)] text-[var(--text-base)] rounded-xl hover:bg-[var(--border)] transition-all border border-[var(--border)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex justify-end px-1">
                <span className={clsx(
                  "text-[10px] font-bold",
                  newUsername.length >= 16 ? "text-red-500" : "text-[var(--text-muted)]"
                )}>
                  {newUsername.length} / 16
                </span>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-black text-[var(--text-base)] truncate tracking-tight">
                {user.displayName || user.email?.split('@')[0]}
              </h2>
              <button 
                onClick={() => setIsEditing(true)}
                className="p-2 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-light)] rounded-xl transition-all border border-transparent hover:border-[var(--accent-light)]"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-3 text-[var(--text-muted)] text-xs font-bold bg-white p-4 rounded-2xl clean-card border border-[var(--border)]">
          <Mail className="w-5 h-5 text-[var(--accent)]" />
          {user.email}
        </div>
      </div>

      {/* Action Section */}
      <div className="space-y-4 pt-2">
        <p className="text-[10px] font-black text-[var(--text-muted)] px-2 uppercase tracking-widest">
          系统设置
        </p>
        
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-between p-5 bg-white rounded-2xl clean-card hover:bg-red-50 transition-all group border border-[var(--border)] hover:border-red-100"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center border border-red-50">
              <LogOut className="w-5 h-5 text-red-500" />
            </div>
            <span className="font-black text-sm text-red-500 uppercase tracking-wider">退出登录</span>
          </div>
          <ChevronRight className="w-5 h-5 text-red-300 group-hover:text-red-500 transition-all" />
        </button>
      </div>

      <div className="pt-8 text-center">
        <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">
          One Click Travel v2.0
        </p>
      </div>
    </motion.div>
  );
};
