import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, LogOut, ChevronRight, Edit2, Check, X } from 'lucide-react';
import { motion } from 'motion/react';

export const ProfilePage: React.FC = () => {
  const { user, logout, updateUsername } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.displayName || '');

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
      className="p-8 space-y-12"
    >
      {/* User Info Section */}
      <div className="pt-12 space-y-4">
        <div className="flex items-center justify-between group">
          {isEditing ? (
            <div className="flex items-center gap-2 w-full">
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="text-3xl font-bold text-slate-900 tracking-tight bg-slate-50 border-b-2 border-emerald-500 outline-none w-full py-1"
                autoFocus
              />
              <button 
                onClick={handleUpdateUsername}
                className="p-2 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-colors"
              >
                <Check className="w-5 h-5" />
              </button>
              <button 
                onClick={() => {
                  setIsEditing(false);
                  setNewUsername(user.displayName || '');
                }}
                className="p-2 bg-slate-200 text-slate-600 rounded-full hover:bg-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                {user.displayName || user.email?.split('@')[0]}
              </h1>
              <button 
                onClick={() => setIsEditing(true)}
                className="p-2 text-slate-400 hover:text-emerald-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 text-slate-500 font-medium">
          <Mail className="w-4 h-4" />
          {user.email}
        </div>
      </div>

      <div className="h-px bg-slate-100 w-full" />

      {/* Action Section */}
      <div className="space-y-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
          账户操作
        </p>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-between p-5 bg-slate-50 hover:bg-slate-100 text-rose-600 font-bold rounded-2xl transition-all group"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-5 h-5" />
            <span>退出当前账号</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="pt-24 text-center">
        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em]">
          Travel AI Assistant v1.0.0
        </p>
      </div>
    </motion.div>
  );
};
