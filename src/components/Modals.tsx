import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  confirmColor?: string;
  isLoading?: boolean;
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  children, 
  confirmText = "确认", 
  cancelText = "取消", 
  onConfirm,
  confirmColor = "bg-[var(--accent)] text-white",
  isLoading = false
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[var(--bg-base)]/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="clean-card p-8 w-full max-w-sm space-y-6 relative overflow-hidden"
          >
            <div className="space-y-2 text-center relative z-10">
              <h3 className="text-2xl font-bold text-[var(--text-base)]">{title}</h3>
              {description && (
                <p className="text-sm font-medium text-[var(--text-muted)] leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            <div className="relative z-10">
              {children}
            </div>
            <div className="flex flex-col gap-3 relative z-10">
              {onConfirm && (
                <button 
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-sm py-4 rounded-2xl ${confirmColor}`}
                >
                  {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                  {confirmText}
                </button>
              )}
              <button 
                onClick={onClose}
                disabled={isLoading}
                className="w-full clean-btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
