import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

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
  confirmColor = "bg-emerald-500 shadow-emerald-200"
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
                  className={`w-full py-3 ${confirmColor} text-white rounded-xl font-bold shadow-lg`}
                >
                  {confirmText}
                </button>
              )}
              <button 
                onClick={onClose}
                className="w-full py-3 bg-slate-100 text-slate-500 rounded-xl font-bold"
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
