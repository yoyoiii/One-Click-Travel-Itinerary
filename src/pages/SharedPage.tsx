import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Loader2, 
  Star, 
  Info, 
  Cloud, 
  Navigation,
  Utensils,
  Camera,
  Car,
  MapPin,
  Coffee,
  Croissant
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { TravelItinerary } from '../types';

export const SharedPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [itinerary, setItinerary] = useState<TravelItinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDayIdx, setActiveDayIdx] = useState(0);

  useEffect(() => {
    const fetchItinerary = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'itineraries', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setItinerary({ ...docSnap.data(), id: docSnap.id } as TravelItinerary);
        } else {
          setError('找不到该行程');
        }
      } catch (err) {
        console.error("Error fetching itinerary:", err);
        setError('加载行程失败');
      } finally {
        setLoading(false);
      }
    };

    fetchItinerary();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <Loader2 className="w-12 h-12 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (error || !itinerary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <div className="text-center">
          <p className="text-[var(--text-muted)] mb-4">{error || '找不到该行程'}</p>
        </div>
      </div>
    );
  }

  const activeDay = itinerary.days[activeDayIdx];

  return (
    <div className="flex flex-col min-h-full bg-[var(--bg-base)] pb-24">
      {/* Top Navigation Bar - Simplified for Shared View */}
      <div className="p-4 bg-white/80 backdrop-blur-md flex items-center justify-center sticky top-0 z-30 border-b border-[var(--border)]">
        <h2 className="text-lg font-bold text-[var(--text-base)] truncate max-w-[250px]">
          {itinerary.name || `${itinerary.destination} 行程`}
        </h2>
      </div>

      {/* Itinerary Details */}
      <div className="flex-1 p-4 space-y-4 animate-reveal">
        {/* Pace Warning */}
        {itinerary.paceWarning && (
          <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl gap-2.5">
            <div className="flex items-center flex-start gap-2">
              <span className="font-extrabold uppercase tracking-wider block mb-0.5 text-xs text-orange-800">温馨提示</span>
              <Info className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
            </div>
            <div className="text-xs text-orange-800 leading-relaxed">
              {itinerary.paceWarning}
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
                <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">{activeDay.weather.condition} • {activeDay.weather.description}</div>
              </div>
            </div>
          </div>
        )}

        {/* Day Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {itinerary.days.map((day, idx) => (
            <button
              key={day.day}
              onClick={() => setActiveDayIdx(idx)}
              className={clsx(
                "px-5 py-2.5 text-xs font-black whitespace-nowrap transition-all rounded-full border-1",
                activeDayIdx === idx 
                  ? "bg-[var(--accent)] text-white border-[var(--accent)]" 
                  : "bg-white text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              )}
            >
              第 {day.day} 天
            </button>
          ))}
          {((itinerary.cafesAndTea && itinerary.cafesAndTea.length > 0) || 
            (itinerary.bakeriesAndDesserts && itinerary.bakeriesAndDesserts.length > 0)) && (
            <button
              onClick={() => setActiveDayIdx(itinerary.days.length)}
              className={clsx(
                "px-5 py-2.5 text-xs font-black whitespace-nowrap transition-all rounded-full border-1",
                activeDayIdx === itinerary.days.length 
                  ? "bg-[var(--accent)] text-white border-[var(--accent)]" 
                  : "bg-white text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
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
            {activeDayIdx < itinerary.days.length && activeDay && (
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
                        <div className="flex items-start justify-between gap-2 mb-0.5">
                          <div className="font-black text-sm text-[var(--text-base)]">{activity.location}</div>
                          {activity.cost && (
                            <div className="text-[10px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100 whitespace-nowrap">
                              {activity.cost}
                            </div>
                          )}
                        </div>
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
                          <div className="absolute top-0 right-0 bg-orange-100 text-orange-600 text-[10px] font-black px-2 py-0.5 rounded-bl-xl uppercase tracking-wider">
                            {rest.mealType}
                          </div>
                        )}
                        <div className="flex justify-between items-start mb-1 pr-12">
                          <div className="font-black text-sm text-[var(--text-base)] group-hover:text-[var(--accent)] transition-colors">{rest.name}</div>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1 text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-md border border-orange-100">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            <span className="text-[10px] font-black">{rest.rating}</span>
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">{rest.cuisine} • {rest.reviews} 条评价</div>
                        </div>
                        <p className="text-[12px] text-[var(--text-muted)] mb-3 leading-relaxed">{rest.description}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] bg-[var(--bg-base)] p-2 rounded-lg border border-[var(--border)]">
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
                        <div className="text-[10px] font-black text-[var(--accent)] bg-[var(--accent-light)] px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                          {activeDay.accommodation.type}
                        </div>
                      </div>
                      <p className="text-[12px] text-[var(--text-muted)] mb-3 leading-relaxed">{activeDay.accommodation.description}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] bg-[var(--bg-base)] p-2 rounded-lg border border-[var(--border)]">
                        <MapPin className="w-3 h-3 flex-shrink-0 text-[var(--accent)]" />
                        <span className="truncate">{activeDay.accommodation.address}</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}


            {activeDayIdx === itinerary.days.length && (
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

                {itinerary.cafesAndTea && itinerary.cafesAndTea.length > 0 && (
                  <div className="space-y-3.5 mb-6">
                    <h3 className="font-bold text-lg text-[var(--text-base)] flex items-center gap-1.5">
                      <Coffee className="w-4 h-4 text-[var(--accent)]" />
                      咖啡与茶饮
                    </h3>
                    <div className="grid gap-3">
                      {itinerary.cafesAndTea.map((shop, idx) => (
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

                {itinerary.bakeriesAndDesserts && itinerary.bakeriesAndDesserts.length > 0 && (
                  <div className="space-y-3.5">
                    <h3 className="font-bold text-lg text-[var(--text-base)] flex items-center gap-1.5">
                      <Croissant className="w-4 h-4 text-[var(--accent)]" />
                      烘焙与甜点
                    </h3>
                    <div className="grid gap-3">
                      {itinerary.bakeriesAndDesserts.map((shop, idx) => (
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
    </div>
  );
};
