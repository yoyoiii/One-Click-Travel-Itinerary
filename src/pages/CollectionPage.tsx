import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Info, Check } from 'lucide-react';
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
    <div className="p-6 space-y-6">
      <header className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">我的旅行集</h1>
          <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold">
            {savedItineraries.length} 个行程
          </div>
        </div>
        <p className="text-slate-500 text-sm">回顾并管理您的所有旅行计划</p>
      </header>

      {savedItineraries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
            <MapPin className="w-8 h-8" />
          </div>
          <p className="text-sm">还没有保存的攻略，快去规划一个吧！</p>
        </div>
      ) : (
        <div className="space-y-4">
          {savedItineraries.map((item) => (
            <div 
              key={item.id}
              className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => {
                setCurrentItinerary(item);
                navigate('/detail');
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 truncate">{item.name || `${item.destination}之旅`}</h3>
                  <p className="text-[10px] text-slate-500">
                    {(item.arrivalTime || (item as any).startDate || '').replace('T', ' ')} 至 {(item.departureTime || (item as any).endDate || '').replace('T', ' ')}
                  </p>
                </div>
                <button 
                  onClick={(e) => handleDeleteClick(e, item.id!)}
                  className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-medium text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-md">
                <Check className="w-3 h-3" />
                已保存
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="删除攻略？"
        description="确定要删除这条攻略吗？删除后将无法恢复。"
        confirmText="确定删除"
        confirmColor="bg-rose-500 shadow-rose-200"
      />
    </div>
  );
};
