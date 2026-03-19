import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  Loader2, 
  Star, 
  Info, 
  Cloud, 
  Navigation,
  Utensils,
  Camera,
  Car,
  Bus,
  MapPin,
  Coffee,
  Croissant
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { useTravel } from '../context/TravelContext';
import { Modal } from '../components/Modals';

export const DetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentItinerary, setCurrentItinerary, savedItineraries, saveItinerary } = useTravel();
  
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showSaveNamePrompt, setShowSaveNamePrompt] = useState(false);
  const [itineraryName, setItineraryName] = useState('');

  useEffect(() => {
    if (!currentItinerary) {
      navigate('/');
    }
  }, [currentItinerary, navigate]);

  if (!currentItinerary) return null;

  const activeDay = currentItinerary.days[activeDayIdx];

  const handleBack = () => {
    if (currentItinerary && !currentItinerary.id) {
      setShowSaveConfirm(true);
    } else {
      navigate(-1);
    }
  };

  const navigateItinerary = (direction: 'prev' | 'next') => {
    const currentIndex = savedItineraries.findIndex(i => i.id === currentItinerary.id);
    if (currentIndex === -1) return;

    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < savedItineraries.length) {
      setCurrentItinerary(savedItineraries[nextIndex]);
      setActiveDayIdx(0);
    }
  };

  const handleSaveClick = () => {
    setItineraryName(`${currentItinerary.destination}之旅 (${(currentItinerary.arrivalTime || (currentItinerary as any).startDate || '').split('T')[0]})`);
    setShowSaveNamePrompt(true);
  };

  const confirmSave = async (shouldSave: boolean) => {
    if (shouldSave) {
      handleSaveClick();
    } else {
      navigate('/');
    }
    setShowSaveConfirm(false);
  };

  const handleFinalSave = async () => {
    setIsSaving(true);
    const saved = await saveItinerary(currentItinerary, itineraryName);
    setIsSaving(false);
    setShowSaveNamePrompt(false);
    if (saved) {
      setCurrentItinerary(saved);
      navigate('/collection');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top Navigation Bar */}
      <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between sticky top-0 z-30">
        <button 
          onClick={handleBack}
          className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-full transition-colors flex items-center gap-1 text-sm font-bold"
        >
          <ChevronRight className="w-5 h-5 rotate-180" />
          返回
        </button>
        <h2 className="text-sm font-bold truncate max-w-[120px]">{currentItinerary.name || `${currentItinerary.destination}攻略`}</h2>
        <div className="flex items-center gap-2">
          {currentItinerary.id ? (
            <div className="flex items-center gap-1">
              <button 
                onClick={() => navigateItinerary('prev')}
                disabled={savedItineraries.findIndex(i => i.id === currentItinerary.id) <= 0}
                className="p-1.5 bg-slate-100 text-slate-600 rounded-lg disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
              <button 
                onClick={() => navigateItinerary('next')}
                disabled={savedItineraries.findIndex(i => i.id === currentItinerary.id) >= savedItineraries.length - 1}
                className="p-1.5 bg-slate-100 text-slate-600 rounded-lg disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleSaveClick}
              disabled={isSaving}
              className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-slate-900 transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Star className="w-3 h-3 fill-current" />
              )}
              {isSaving ? '保存中...' : '保存'}
            </button>
          )}
        </div>
      </div>

      {/* Itinerary Details */}
      <div className="flex-1 bg-white p-6 space-y-8">
        {/* Pace Warning */}
        {currentItinerary.paceWarning && (
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex gap-3 items-start">
            <Info className="w-5 h-5 text-slate-700 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 leading-relaxed">
              <span className="font-bold">行程小贴士：</span>{currentItinerary.paceWarning}
            </div>
          </div>
        )}

        {/* Weather Info */}
        {activeDay && (
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100">
                <Cloud className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">{activeDay.weather.temp}</div>
                <div className="text-[10px] text-slate-500 font-medium">{activeDay.weather.condition} • {activeDay.weather.description}</div>
              </div>
            </div>
            <div className="text-[10px] font-bold text-slate-500 bg-white border border-slate-100 px-2 py-1 rounded-md">
              今日天气
            </div>
          </div>
        )}

        {/* Day Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {currentItinerary.days.map((day, idx) => (
            <button
              key={day.day}
              onClick={() => setActiveDayIdx(idx)}
              className={clsx(
                "px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all",
                activeDayIdx === idx 
                  ? "bg-slate-800 text-white shadow-lg shadow-slate-200" 
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              )}
            >
              第 {day.day} 天
            </button>
          ))}
          {((currentItinerary.cafesAndTea && currentItinerary.cafesAndTea.length > 0) || 
            (currentItinerary.bakeriesAndDesserts && currentItinerary.bakeriesAndDesserts.length > 0)) && (
            <button
              onClick={() => setActiveDayIdx(currentItinerary.days.length)}
              className={clsx(
                "px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all",
                activeDayIdx === currentItinerary.days.length 
                  ? "bg-slate-800 text-white shadow-lg shadow-slate-200" 
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              )}
            >
              特色推荐
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeDayIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {activeDayIdx < currentItinerary.days.length && activeDay && (
              <>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-2">
                    <Navigation className="w-4 h-4 text-slate-700" />
                    路线概览
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {activeDay.routeDescription}
                  </p>
                </div>

                <div className="space-y-6">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-slate-700" />
                    今日活动
                  </h3>
                  <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                    {activeDay.activities.map((activity, idx) => (
                      <div key={idx} className="relative pl-8">
                        <div className={clsx(
                          "absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white shadow-sm z-10",
                          activity.type === 'sightseeing' ? "bg-slate-700" :
                          activity.type === 'food' ? "bg-amber-500" :
                          activity.type === 'transport' ? "bg-sky-500" : "bg-slate-400"
                        )} />
                        <div className="text-[10px] font-bold text-slate-400 mb-1">{activity.time}</div>
                        <div className="font-bold text-sm text-slate-900 mb-1">{activity.location}</div>
                        <p className="text-xs text-slate-500 leading-relaxed">{activity.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-slate-700" />
                    美食推荐
                  </h3>
                  <div className="grid gap-4">
                    {activeDay.restaurants.map((rest, idx) => (
                      <div key={idx} className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm relative overflow-hidden">
                        {rest.mealType && (
                          <div className="absolute top-0 right-0 bg-slate-100 text-slate-700 text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                            {rest.mealType}
                          </div>
                        )}
                        <div className="flex justify-between items-start mb-2 pr-12">
                          <div className="font-bold text-sm">{rest.name}</div>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1 text-slate-700">
                            <Star className="w-3 h-3 fill-current" />
                            <span className="text-[10px] font-bold">{rest.rating}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">{rest.cuisine} • {rest.reviews}条点评</div>
                        </div>
                        <p className="text-xs text-slate-500 mb-3">{rest.description}</p>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          <MapPin className="w-3 h-3" />
                          {rest.address}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {activeDay.accommodation && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <Car className="w-5 h-5 text-slate-700" />
                      住宿安排
                    </h3>
                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-sm text-slate-900">{activeDay.accommodation.name}</div>
                        <div className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded-md shadow-sm">
                          {activeDay.accommodation.type === 'hotel' ? '酒店' : 
                           activeDay.accommodation.type === 'homestay' ? '民宿' : '露营地'}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 mb-3 leading-relaxed">{activeDay.accommodation.description}</p>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <MapPin className="w-3 h-3" />
                        {activeDay.accommodation.address}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeDayIdx === currentItinerary.days.length && (
              <>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-2">
                    <Star className="w-4 h-4 fill-current text-slate-700" />
                    目的地特色推荐
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    为您精选的当地特色饮品与甜点，让旅途更加甜蜜。
                  </p>
                </div>

                {currentItinerary.cafesAndTea && currentItinerary.cafesAndTea.length > 0 && (
                  <div className="space-y-4 mb-8">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <Coffee className="w-5 h-5 text-slate-700" />
                      特色奶茶 & 咖啡
                    </h3>
                    <div className="grid gap-4">
                      {currentItinerary.cafesAndTea.map((shop, idx) => (
                        <div key={idx} className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-bold text-sm">{shop.name}</div>
                            {shop.rating && (
                              <div className="flex items-center gap-1 text-slate-700">
                                <Star className="w-3 h-3 fill-current" />
                                <span className="text-[10px] font-bold">{shop.rating}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mb-3">{shop.description}</p>
                          {shop.address && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                              <MapPin className="w-3 h-3" />
                              {shop.address}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentItinerary.bakeriesAndDesserts && currentItinerary.bakeriesAndDesserts.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <Croissant className="w-5 h-5 text-slate-700" />
                      特色面包 & 甜品
                    </h3>
                    <div className="grid gap-4">
                      {currentItinerary.bakeriesAndDesserts.map((shop, idx) => (
                        <div key={idx} className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-bold text-sm">{shop.name}</div>
                            {shop.rating && (
                              <div className="flex items-center gap-1 text-slate-700">
                                <Star className="w-3 h-3 fill-current" />
                                <span className="text-[10px] font-bold">{shop.rating}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mb-3">{shop.description}</p>
                          {shop.address && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                              <MapPin className="w-3 h-3" />
                              {shop.address}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Modals */}
      <Modal 
        isOpen={showSaveConfirm}
        onClose={() => confirmSave(false)}
        onConfirm={() => confirmSave(true)}
        title="保存攻略？"
        description="是否将此次规划的行程保存到您的旅行集中？"
        confirmText="保存并返回"
        cancelText="不保存"
      />

      <Modal 
        isOpen={showSaveNamePrompt}
        onClose={() => setShowSaveNamePrompt(false)}
        onConfirm={handleFinalSave}
        title="攻略名称"
        description="为您的旅行计划起一个好听的名字吧"
        confirmText="保存"
        isLoading={isSaving}
      >
        <input 
          type="text"
          className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-800 outline-none text-sm"
          placeholder="输入攻略名称"
          value={itineraryName}
          onChange={(e) => setItineraryName(e.target.value)}
          disabled={isSaving}
        />
      </Modal>
    </div>
  );
};
