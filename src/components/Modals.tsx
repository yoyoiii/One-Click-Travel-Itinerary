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
  confirmText = "确定", 
  cancelText = "取消", 
  onConfirm,
  confirmColor = "bg-slate-800 shadow-slate-200",
  isLoading = false
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl space-y-6"
          >
            <div className="space-y-2 text-center">
              <h3 className="text-lg font-bold text-slate-900">{title}</h3>
              {description && (
                <p className="text-sm text-slate-500 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            {children}
            <div className="flex flex-col gap-2">
              {onConfirm && (
                <button 
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`w-full py-3 ${confirmColor} text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {confirmText}
                </button>
              )}
              <button 
                onClick={onClose}
                disabled={isLoading}
                className="w-full py-3 bg-slate-100 text-slate-500 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
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
