import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Trash2 } from 'lucide-react';
import { useTravel } from '../context/TravelContext';
import { Modal } from '../components/Modals';

export const CollectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { savedItineraries, deleteItinerary, setCurrentItinerary } = useTravel();
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itineraryToDelete, setItineraryToDelete] = useState<string | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setItineraryToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (itineraryToDelete) {
      await deleteItinerary(itineraryToDelete);
      setItineraryToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="p-4 space-y-6 animate-reveal pb-24">
      <header className="mb-4">
        <div className="flex items-end justify-between mb-1">
          <h1 className="text-2xl font-bold text-[var(--text-base)]">
            我的收藏
          </h1>
          <div className="bg-[var(--accent-light)] text-[var(--accent)] px-2 py-0.5 text-[10px] font-bold rounded-md">
            {savedItineraries.length} 个行程
          </div>
        </div>
        <p className="text-[var(--text-muted)] font-medium text-xs uppercase tracking-wider">
          Saved Plans
        </p>
      </header>

      {savedItineraries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-[var(--text-muted)] space-y-3 bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
            <MapPin className="w-6 h-6 text-[var(--border)]" />
          </div>
          <p className="text-xs font-medium text-center">还没有收藏的行程<br/>去规划一个新的吧</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {savedItineraries.map((item) => (
            <div 
              key={item.id}
              className="clean-card p-5 cursor-pointer group bg-white border border-[var(--border)] hover:border-[var(--accent)] transition-all"
              onClick={() => {
                setCurrentItinerary(item);
                navigate('/detail');
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="font-black text-base text-[var(--text-base)] truncate mb-2 group-hover:text-[var(--accent)] transition-colors">{item.name || `${item.destination} 行程`}</h3>
                  <div className="text-[10px] font-black text-[var(--text-muted)] space-y-1 uppercase tracking-widest">
                    <p className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {(item.arrivalTime || (item as any).startDate || '').replace('T', ' ')}
                    </p>
                    <p className="flex items-center gap-2 opacity-40">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                      {(item.departureTime || (item as any).endDate || '').replace('T', ' ')}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={(e) => handleDeleteClick(e, item.id!)}
                  className="p-2.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="删除行程？"
        description="确定要删除这个行程吗？此操作无法撤销。"
        confirmText="删除"
        confirmColor="bg-red-500 text-white"
      />
    </div>
  );
};
