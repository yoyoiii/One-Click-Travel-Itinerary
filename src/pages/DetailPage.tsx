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
    setItineraryName(`${currentItinerary.destination} 行程 (${(currentItinerary.arrivalTime || (currentItinerary as any).startDate || '').split('T')[0]})`);
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
    <div className="flex flex-col h-full bg-[var(--bg-base)] animate-reveal pb-24">
      {/* Top Navigation Bar */}
      <div className="p-4 bg-white/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-30 border-b border-[var(--border)]">
        <button 
          onClick={handleBack}
          className="p-2 -ml-2 text-[var(--text-base)] hover:bg-[var(--surface)] transition-colors flex items-center gap-1 text-sm font-bold rounded-xl"
        >
          <ChevronRight className="w-5 h-5 rotate-180" />
          返回
        </button>
        <h2 className="text-lg font-bold text-[var(--text-base)] truncate max-w-[150px]">{currentItinerary.name || `${currentItinerary.destination} 行程`}</h2>
        <div className="flex items-center gap-2">
          {currentItinerary.id ? (
            <div className="flex items-center gap-1">
              <button 
                onClick={() => navigateItinerary('prev')}
                disabled={savedItineraries.findIndex(i => i.id === currentItinerary.id) <= 0}
                className="p-2 bg-[var(--surface)] text-[var(--text-base)] disabled:opacity-30 hover:bg-[var(--accent-light)] hover:text-[var(--accent)] transition-all rounded-xl"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <button 
                onClick={() => navigateItinerary('next')}
                disabled={savedItineraries.findIndex(i => i.id === currentItinerary.id) >= savedItineraries.length - 1}
                className="p-2 bg-[var(--surface)] text-[var(--text-base)] disabled:opacity-30 hover:bg-[var(--accent-light)] hover:text-[var(--accent)] transition-all rounded-xl"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleSaveClick}
              disabled={isSaving}
              className="px-4 py-2 bg-[var(--accent)] text-white rounded-xl transition-all text-sm font-bold flex items-center gap-2 disabled:opacity-50 hover:bg-[var(--accent)]/90"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Star className="w-4 h-4 fill-current" />
              )}
              {isSaving ? '保存中...' : '保存'}
            </button>
          )}
        </div>
      </div>

      {/* Itinerary Details */}
      <div className="flex-1 p-4 space-y-4">
        {/* Pace Warning */}
        {currentItinerary.paceWarning && (
          <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl flex gap-2.5 items-start">
            <Info className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-orange-800 leading-relaxed font-bold">
              <span className="font-extrabold uppercase tracking-wider block mb-0.5">温馨提示</span>
              {currentItinerary.paceWarning}
            </div>
          </div>
        )}

        {/* Weather Info */}
        {activeDay && (
          <div className="flex items-center justify-between p-3 clean-card bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--accent-light)] rounded-xl flex items-center justify-center border border-[var(--accent-light)]">
                <Cloud className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <div>
                <div className="text-lg font-black text-[var(--text-base)] tracking-tight">{activeDay.weather.temp}</div>
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{activeDay.weather.condition} • {activeDay.weather.description}</div>
              </div>
            </div>
          </div>
        )}

        {/* Day Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {currentItinerary.days.map((day, idx) => (
            <button
              key={day.day}
              onClick={() => setActiveDayIdx(idx)}
              className={clsx(
                "px-5 py-2.5 text-xs font-black whitespace-nowrap transition-all rounded-full border-1",
                activeDayIdx === idx 
                  ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-md shadow-emerald-100" 
                  : "bg-white text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
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
                "px-5 py-2.5 text-xs font-black whitespace-nowrap transition-all rounded-full border-1",
                activeDayIdx === currentItinerary.days.length 
                  ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-md shadow-emerald-100" 
                  : "bg-white text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--text-base)] hover:text-[var(--accent)]"
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
            className="space-y-4"
          >
            {activeDayIdx < currentItinerary.days.length && activeDay && (
              <>
                <div className="clean-card p-4 bg-white">
                  <div className="flex items-center gap-1.5 text-[var(--accent)] font-black text-[14px] mb-2 uppercase tracking-widest">
                    <Navigation className="w-3.5 h-3.5" />
                    路线总览
                  </div>
                  <p className="text-xs text-[var(--text-base)] leading-relaxed">
                    {activeDay.routeDescription}
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-black text-base text-[var(--text-base)] flex items-center gap-1.5 ml-1">
                    <Camera className="w-4 h-4 text-[var(--accent)]" />
                    每日活动
                  </h3>
                  <div className="space-y-4 relative before:absolute before:left-[13px] before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--border)] before:rounded-full">
                    {activeDay.activities.map((activity, idx) => (
                      <div key={idx} className="relative pl-8">
                        <div className={clsx(
                          "absolute left-2 top-1.5 w-2.5 h-2.5 rounded-full border-2 bg-white z-10",
                          activity.type === 'sightseeing' ? "border-[var(--accent)]" :
                          activity.type === 'food' ? "border-orange-400" :
                          activity.type === 'transport' ? "border-blue-400" : "border-[var(--border)]"
                        )} />
                        <div className="text-[10px] font-black text-[var(--accent)] mb-0.5 bg-[var(--accent-light)] inline-block px-1.5 py-0.5 rounded-md uppercase tracking-wider">{activity.time}</div>
                        <div className="font-black text-sm text-[var(--text-base)] mb-0.5">{activity.location}</div>
                        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">{activity.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-black text-base text-[var(--text-base)] flex items-center gap-1.5 ml-1">
                    <Utensils className="w-4 h-4 text-[var(--accent)]" />
                    餐饮推荐
                  </h3>
                  <div className="grid gap-3">
                    {activeDay.restaurants.map((rest, idx) => (
                      <div key={idx} className="p-4 clean-card bg-white relative overflow-hidden group">
                        {rest.mealType && (
                          <div className="absolute top-0 right-0 bg-orange-100 text-orange-600 text-[9px] font-black px-2 py-0.5 rounded-bl-xl uppercase tracking-wider">
                            {rest.mealType}
                          </div>
                        )}
                        <div className="flex justify-between items-start mb-1 pr-12">
                          <div className="font-black text-sm text-[var(--text-base)] group-hover:text-[var(--accent)] transition-colors">{rest.name}</div>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1 text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-md border border-orange-100">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            <span className="text-[9px] font-black">{rest.rating}</span>
                          </div>
                          <div className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider">{rest.cuisine} • {rest.reviews} 条评价</div>
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] mb-3 leading-relaxed">{rest.description}</p>
                        <div className="flex items-center gap-1.5 text-[9px] text-[var(--text-muted)] bg-[var(--bg-base)] p-2 rounded-lg border border-[var(--border)]">
                          <MapPin className="w-3 h-3 flex-shrink-0 text-[var(--accent)]" />
                          <span className="truncate">{rest.address}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {activeDay.accommodation && (
                  <div className="space-y-3">
                    <h3 className="font-black text-base text-[var(--text-base)] flex items-center gap-1.5 ml-1">
                      <Car className="w-4 h-4 text-[var(--accent)]" />
                      住宿安排
                    </h3>
                    <div className="p-4 clean-card bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-black text-sm text-[var(--text-base)]">{activeDay.accommodation.name}</div>
                        <div className="text-[9px] font-black text-[var(--accent)] bg-[var(--accent-light)] px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                          {activeDay.accommodation.type}
                        </div>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] mb-3 leading-relaxed">{activeDay.accommodation.description}</p>
                      <div className="flex items-center gap-1.5 text-[9px] text-[var(--text-muted)] font-bold bg-[var(--bg-base)] p-2 rounded-lg border border-[var(--border)]">
                        <MapPin className="w-3 h-3 flex-shrink-0 text-[var(--accent)]" />
                        <span className="truncate">{activeDay.accommodation.address}</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}


            {activeDayIdx === currentItinerary.days.length && (
              <>
                <div className="clean-card p-4 mb-5 bg-white">
                  <div className="flex items-center gap-1.5 text-[var(--accent)] font-bold text-xs mb-1.5">
                    <Star className="w-4 h-4 fill-current" />
                    特色推荐
                  </div>
                  <p className="text-xs text-[var(--text-base)] leading-relaxed font-medium">
                    精选当地饮品与甜点
                  </p>
                </div>

                {currentItinerary.cafesAndTea && currentItinerary.cafesAndTea.length > 0 && (
                  <div className="space-y-3.5 mb-6">
                    <h3 className="font-bold text-lg text-[var(--text-base)] flex items-center gap-1.5">
                      <Coffee className="w-4 h-4 text-[var(--accent)]" />
                      咖啡与茶饮
                    </h3>
                    <div className="grid gap-3">
                      {currentItinerary.cafesAndTea.map((shop, idx) => (
                        <div key={idx} className="p-4 clean-card bg-white">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-bold text-base text-[var(--text-base)]">{shop.name}</div>
                            {shop.rating && (
                              <div className="flex items-center gap-1 text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-md">
                                <Star className="w-3 h-3 fill-current" />
                                <span className="text-[10px] font-bold">{shop.rating}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-[var(--text-muted)] mb-2.5 font-medium leading-relaxed">{shop.description}</p>
                          {shop.address && (
                            <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-medium bg-[var(--surface)] p-1.5 rounded-lg">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{shop.address}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentItinerary.bakeriesAndDesserts && currentItinerary.bakeriesAndDesserts.length > 0 && (
                  <div className="space-y-3.5">
                    <h3 className="font-bold text-lg text-[var(--text-base)] flex items-center gap-1.5">
                      <Croissant className="w-4 h-4 text-[var(--accent)]" />
                      烘焙与甜点
                    </h3>
                    <div className="grid gap-3">
                      {currentItinerary.bakeriesAndDesserts.map((shop, idx) => (
                        <div key={idx} className="p-4 clean-card bg-white">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-bold text-base text-[var(--text-base)]">{shop.name}</div>
                            {shop.rating && (
                              <div className="flex items-center gap-1 text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-md">
                                <Star className="w-3 h-3 fill-current" />
                                <span className="text-[10px] font-bold">{shop.rating}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-[var(--text-muted)] mb-2.5 font-medium leading-relaxed">{shop.description}</p>
                          {shop.address && (
                            <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-medium bg-[var(--surface)] p-1.5 rounded-lg">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{shop.address}</span>
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
        title="保存行程？"
        description="在离开前，您想将此行程保存到收藏夹吗？"
        confirmText="保存并离开"
        cancelText="直接离开"
        confirmColor="bg-[var(--accent)] text-white"
      />

      <Modal 
        isOpen={showSaveNamePrompt}
        onClose={() => setShowSaveNamePrompt(false)}
        onConfirm={handleFinalSave}
        title="行程名称"
        description="给您的旅行计划起个好记的名字吧。"
        confirmText="保存"
        confirmColor="bg-[var(--accent)] text-white"
        isLoading={isSaving}
      >
        <input 
          type="text"
          className="clean-input"
          placeholder="输入行程名称"
          value={itineraryName}
          onChange={(e) => setItineraryName(e.target.value)}
          disabled={isSaving}
        />
      </Modal>
    </div>
  );
};
