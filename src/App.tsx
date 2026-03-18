import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Calendar, 
  Car, 
  Bus, 
  Utensils, 
  Camera, 
  ArrowRight, 
  Cloud, 
  Star, 
  Navigation, 
  ChevronRight,
  Loader2,
  Check,
  Search,
  Settings2,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, differenceInDays, parseISO } from 'date-fns';
import { generateItinerary } from './services/geminiService';
import { TravelItinerary, ItineraryDay } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const CHINA_REGIONS = [
    '北京市', '上海市', '天津市', '重庆市',
    '广东省-广州市', '广东省-深圳市', '广东省-珠海市',
    '浙江省-杭州市', '浙江省-宁波市', '浙江省-温州市',
    '江苏省-南京市', '江苏省-苏州市', '江苏省-无锡市',
    '四川省-成都市', '湖北省-武汉市', '陕西省-西安市',
    '湖南省-长沙市', '福建省-福州市', '福建省-厦门市',
    '云南省-昆明市', '云南省-大理市', '云南省-丽江市',
    '山东省-济南市', '山东省-青岛市', '河南省-郑州市',
    '辽宁省-沈阳市', '辽宁省-大连市', '黑龙江省-哈尔滨市',
    '吉林省-长春市', '安徽省-合肥市', '江西南昌市',
    '广西南宁市', '广西桂林市', '海南省-海口市', '海南省-三亚市',
    '贵州省-贵阳市', '甘肃省-兰州市', '青海省-西宁市',
    '宁夏-银川市', '新疆-乌鲁木齐市', '西藏-拉萨市', '内蒙古-呼和浩特市'
  ];

  const [destination, setDestination] = useState(CHINA_REGIONS[0]);
  const [arrivalTime, setArrivalTime] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [transport, setTransport] = useState('public');
  const [foodPrefs, setFoodPrefs] = useState('');
  const [sightseeingPrefs, setSightseeingPrefs] = useState('');
  const [accommodationType, setAccommodationType] = useState<'hotel' | 'homestay' | 'car'>('hotel');
  const [budget, setBudget] = useState<string>('');
  const [pace, setPace] = useState('medium');
  const [flexible, setFlexible] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'plan' | 'collection'>('plan');
  const [savedItineraries, setSavedItineraries] = useState<TravelItinerary[]>([]);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itineraryToDelete, setItineraryToDelete] = useState<string | null>(null);
  const [showSaveNamePrompt, setShowSaveNamePrompt] = useState(false);
  const [itineraryName, setItineraryName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [itinerary, setItinerary] = useState<TravelItinerary | null>(null);
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  useEffect(() => {
    fetchItineraries();
  }, []);

  const fetchItineraries = async () => {
    try {
      const response = await fetch('/api/itineraries');
      if (response.ok) {
        const data = await response.json();
        setSavedItineraries(data);
      }
    } catch (e) {
      console.error("Failed to load saved itineraries", e);
    }
  };

  const resetForm = () => {
    setDestination(CHINA_REGIONS[0]);
    setArrivalTime('');
    setDepartureTime('');
    setTransport('public');
    setFoodPrefs('');
    setSightseeingPrefs('');
    setAccommodationType('hotel');
    setBudget('');
    setPace('medium');
    setFlexible(true);
    setError(null);
  };

  const saveItinerary = async (item: TravelItinerary, shouldRedirect: boolean = false) => {
    setIsSaving(true);
    const newItinerary = { 
      ...item, 
      id: item.id || Date.now().toString(),
      name: itineraryName || `${item.destination}之旅 (${(item.arrivalTime || (item as any).startDate || '').split('T')[0]})`
    };
    try {
      const response = await fetch('/api/itineraries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItinerary)
      });
      if (response.ok) {
        const saved = await response.json();
        setSavedItineraries(prev => [saved, ...prev.filter(i => i.id !== saved.id)]);
        setItinerary(saved);
        
        if (shouldRedirect) {
          setItinerary(null);
          resetForm();
          setActiveTab('collection');
        }
      }
    } catch (e) {
      console.error("Failed to save itinerary", e);
    } finally {
      setIsSaving(false);
      setShowSaveNamePrompt(false);
    }
  };

  const handleSaveClick = () => {
    if (itinerary) {
      setItineraryName(`${itinerary.destination}之旅 (${(itinerary.arrivalTime || (itinerary as any).startDate || '').split('T')[0]})`);
      setShowSaveNamePrompt(true);
    }
  };

  const deleteItinerary = async (id: string) => {
    try {
      const response = await fetch(`/api/itineraries/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setSavedItineraries(prev => prev.filter(i => i.id !== id));
      }
    } catch (e) {
      console.error("Failed to delete itinerary", e);
    }
  };

  const handleBack = () => {
    if (itinerary && !itinerary.id) {
      setShowSaveConfirm(true);
    } else {
      setItinerary(null);
    }
  };

  const confirmSave = async (shouldSave: boolean) => {
    if (shouldSave && itinerary) {
      setItineraryName(`${itinerary.destination}之旅 (${(itinerary.arrivalTime || (itinerary as any).startDate || '').split('T')[0]})`);
      setShowSaveNamePrompt(true);
    } else {
      setItinerary(null);
    }
    setShowSaveConfirm(false);
  };

  const confirmDelete = async () => {
    if (itineraryToDelete) {
      await deleteItinerary(itineraryToDelete);
      setItineraryToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  const today = format(new Date(), "yyyy-MM-dd'T'HH:mm");

  const validateDates = (start: string, end: string) => {
    if (start && end) {
      const startDateObj = new Date(start);
      const endDateObj = new Date(end);
      if (startDateObj > endDateObj) {
        setError("到达时间不能晚于离开时间");
        return false;
      }
    }
    setError(null);
    return true;
  };

  const handleArrivalTimeChange = (val: string) => {
    setArrivalTime(val);
    validateDates(val, departureTime);
  };

  const handleDepartureTimeChange = (val: string) => {
    setDepartureTime(val);
    validateDates(arrivalTime, val);
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
      setError("已取消生成");
    }
  };

  const handleGenerate = async () => {
    if (!destination || !arrivalTime || !departureTime || !transport) {
      setError("请填写所有必填项（目的地、到达/离开时间、交通方式）");
      return;
    }

    if (!validateDates(arrivalTime, departureTime)) return;

    setLoading(true);
    setError(null);
    
    // Create new abort controller for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const result = await generateItinerary({
        destination,
        arrivalTime,
        departureTime,
        transport,
        foodPrefs,
        sightseeingPrefs,
        accommodationType,
        budget: budget ? parseInt(budget) : undefined,
        pace,
        flexible
      });
      
      // Check if request was aborted
      if (controller.signal.aborted) return;

      setItinerary(result);
      setActiveDayIdx(0);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setError(err instanceof Error ? err.message : "发生未知错误");
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  const navigateItinerary = (direction: 'prev' | 'next') => {
    if (!itinerary || !itinerary.id) return;
    const currentIndex = savedItineraries.findIndex(i => i.id === itinerary.id);
    if (currentIndex === -1) return;

    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < savedItineraries.length) {
      setItinerary(savedItineraries[nextIndex]);
      setActiveDayIdx(0);
    }
  };

  const activeDay = itinerary?.days[activeDayIdx];

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapTimeout, setMapTimeout] = useState(false);
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<any>(null);

  const MAP_INIT_TIMEOUT = 10000; // 10 seconds timeout

  useEffect(() => {
    if (itinerary && !mapLoaded && !mapError) {
      const ak = process.env.BAIDU_MAPS_AK || '';
      if (!ak) {
        setMapError("Baidu Maps AK is missing. Please set BAIDU_MAPS_AK in settings.");
        return;
      }

      if ((window as any).BMap) {
        setMapLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.id = 'baidu-maps-script';
      script.src = `https://api.map.baidu.com/api?v=3.0&ak=${ak}&callback=initBaiduMap`;
      script.async = true;
      
      script.onerror = () => {
        setMapError("Failed to load Baidu Maps script.");
      };

      (window as any).initBaiduMap = () => {
        setMapLoaded(true);
      };

      document.head.appendChild(script);
    }
  }, [itinerary, mapLoaded, mapError]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let timeoutTimer: NodeJS.Timeout;

    if (mapLoaded && activeDay && itinerary && mapContainerRef.current) {
      // Start timeout timer
      timeoutTimer = setTimeout(() => {
        if (!mapInstanceRef.current) {
          console.warn("Map initialization timed out, using fallback.");
          setMapTimeout(true);
        }
      }, MAP_INIT_TIMEOUT);

      // 使用 setTimeout 确保 DOM 元素已完全渲染并具有尺寸
      timer = setTimeout(() => {
        try {
          const BMap = (window as any).BMap;
          if (!BMap || !BMap.Map) return;

          // 初始化或复用地图实例
          if (!mapInstanceRef.current) {
            mapInstanceRef.current = new BMap.Map(mapContainerRef.current);
            setMapTimeout(false); // Successfully initialized
            clearTimeout(timeoutTimer);
          }
          
          const map = mapInstanceRef.current;
          const query = activeDay.mapQuery || itinerary.destination;
          
          // 清除之前的覆盖物
          map.clearOverlays();
          
          const local = new BMap.LocalSearch(map, {
            renderOptions: { map: map, autoViewport: true }
          });
          
          local.search(query);
        } catch (err) {
          console.error("Error initializing Baidu Map instance:", err);
          // 忽略特定的 coordType 报错，这通常是由于地图容器尚未准备好
          if (err instanceof Error && !err.message.includes('coordType')) {
            setMapError("Error initializing map view.");
          }
        }
      }, 200);
    }
    return () => {
      if (timer) clearTimeout(timer);
      if (timeoutTimer) clearTimeout(timeoutTimer);
    };
  }, [mapLoaded, activeDay, itinerary]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl relative flex flex-col">
        
        {/* Header - Only show on planning home page */}
        {!itinerary && activeTab === 'plan' && (
          <header className="p-6 border-b border-slate-100 bg-white sticky top-0 z-20">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">智能旅行助手</h1>
              <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold">
                一键生成攻略
              </div>
            </div>
            <p className="text-slate-500 text-sm">秒级规划您的完美旅程</p>
          </header>
        )}

        {/* Header - Only show on collection page */}
        {!itinerary && activeTab === 'collection' && (
          <header className="p-6 border-b border-slate-100 bg-white sticky top-0 z-20">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">我的旅行集</h1>
              <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold">
                {savedItineraries.length} 个行程
              </div>
            </div>
            <p className="text-slate-500 text-sm">回顾并管理您的所有旅行计划</p>
          </header>
        )}

        <main className="flex-1 overflow-y-auto pb-24">
          {!itinerary ? (
            activeTab === 'plan' ? (
              <div className="p-6 space-y-6">
                {/* Input Form */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      目的地 <span className="text-rose-500">*</span>
                    </label>
                    <select 
                      disabled={loading}
                      className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-white appearance-none cursor-pointer disabled:bg-slate-50 disabled:text-slate-400"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                    >
                      {CHINA_REGIONS.map(region => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        到达目的地时间 <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        disabled={loading}
                        type="datetime-local" 
                        min={today}
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-slate-50 disabled:text-slate-400 text-xs"
                        value={arrivalTime}
                        onChange={(e) => handleArrivalTimeChange(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        离开目的地时间 <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        disabled={loading}
                        type="datetime-local" 
                        min={arrivalTime || today}
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-slate-50 disabled:text-slate-400 text-xs"
                        value={departureTime}
                        onChange={(e) => handleDepartureTimeChange(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-slate-400" />
                      交通方式 <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'self-driving', label: '自驾', icon: Car },
                        { id: 'public', label: '公共交通', icon: Bus },
                        { id: 'rental', label: '租车/打车', icon: Car },
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          disabled={loading}
                          onClick={() => setTransport(mode.id)}
                          className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-1",
                            transport === mode.id 
                              ? "bg-emerald-50 border-emerald-500 text-emerald-700" 
                              : "bg-white border-slate-200 text-slate-500 hover:border-slate-300",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                          )}
                        >
                          <mode.icon className="w-5 h-5" />
                          <span className="text-[10px] font-medium">{mode.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-sm font-bold flex items-center gap-2">
                      <Settings2 className="w-4 h-4 text-slate-400" />
                      住宿偏好
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'hotel', label: '酒店' },
                        { id: 'homestay', label: '民宿' },
                        { id: 'car', label: '住在车里' },
                      ].map((type) => (
                        <button
                          key={type.id}
                          disabled={loading}
                          onClick={() => setAccommodationType(type.id as any)}
                          className={cn(
                            "py-2 px-1 rounded-xl border text-[10px] font-bold transition-all",
                            accommodationType === type.id 
                              ? "bg-white border-emerald-500 text-emerald-700 shadow-sm" 
                              : "bg-transparent border-slate-200 text-slate-500"
                          )}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        价格预算 (RMB)
                      </label>
                      <input 
                        disabled={loading}
                        type="number"
                        placeholder="例如：500"
                        className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-slate-400" />
                      饮食偏好
                    </label>
                    <textarea 
                      disabled={loading}
                      placeholder="例如：火锅、川菜、素食..."
                      className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[60px] disabled:bg-slate-50 disabled:text-slate-400"
                      value={foodPrefs}
                      onChange={(e) => setFoodPrefs(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold flex items-center gap-2">
                      <Camera className="w-4 h-4 text-slate-400" />
                      必去景点
                    </label>
                    <textarea 
                      disabled={loading}
                      placeholder="例如：故宫、长城、西湖..."
                      className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[60px] disabled:bg-slate-50 disabled:text-slate-400"
                      value={sightseeingPrefs}
                      onChange={(e) => setSightseeingPrefs(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div className="space-y-1">
                      <div className="text-sm font-semibold">旅行节奏</div>
                      <div className="text-[10px] text-slate-500">
                        {pace === 'low' ? '10:00出发, 21:00回酒店' : 
                         pace === 'high' ? '08:00出发, 22:00回酒店' : 
                         '适中的行程安排'}
                      </div>
                    </div>
                    <select 
                      disabled={loading}
                      className="bg-white border border-slate-200 rounded-lg p-2 text-sm outline-none disabled:opacity-50"
                      value={pace}
                      onChange={(e) => setPace(e.target.value)}
                    >
                      <option value="low">悠闲</option>
                      <option value="medium">适中</option>
                      <option value="high">紧凑</option>
                    </select>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-rose-50 text-rose-600 text-sm rounded-xl border border-rose-100">
                    {error}
                  </div>
                )}

                <button
                  disabled={loading}
                  onClick={handleGenerate}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      正在为您规划行程...
                    </>
                  ) : (
                    <>
                      生成旅行攻略
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                {loading && (
                  <button
                    onClick={handleCancel}
                    className="w-full py-3 bg-white text-rose-500 border border-rose-200 rounded-2xl font-semibold text-sm hover:bg-rose-50 transition-colors"
                  >
                    取消生成
                  </button>
                )}
              </div>
            ) : (
              <div className="p-6 space-y-6">
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
                          setItinerary(item);
                          setActiveDayIdx(0);
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
                              onClick={(e) => {
                                e.stopPropagation();
                                if (item.id) {
                                  setItineraryToDelete(item.id);
                                  setShowDeleteConfirm(true);
                                }
                              }}
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
              </div>
            )
          ) : (
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
                <h2 className="text-sm font-bold truncate max-w-[120px]">{itinerary.name || `${itinerary.destination}攻略`}</h2>
                <div className="flex items-center gap-2">
                  {itinerary.id ? (
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => navigateItinerary('prev')}
                        disabled={savedItineraries.findIndex(i => i.id === itinerary.id) <= 0}
                        className="p-1.5 bg-slate-100 text-slate-600 rounded-lg disabled:opacity-30"
                      >
                        <ChevronRight className="w-4 h-4 rotate-180" />
                      </button>
                      <button 
                        onClick={() => navigateItinerary('next')}
                        disabled={savedItineraries.findIndex(i => i.id === itinerary.id) >= savedItineraries.length - 1}
                        className="p-1.5 bg-slate-100 text-slate-600 rounded-lg disabled:opacity-30"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={handleSaveClick}
                      disabled={isSaving}
                      className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm shadow-emerald-100 hover:bg-emerald-600 transition-colors flex items-center gap-1 disabled:opacity-50"
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

              {/* Map Section */}
              <div className="h-48 bg-slate-200 relative overflow-hidden">
                <div ref={mapContainerRef} className={cn("w-full h-full", mapTimeout && "hidden")} />
                
                {mapTimeout && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 p-6 text-center">
                    <MapPin className="w-8 h-8 text-slate-400 mb-2" />
                    <div className="text-sm font-bold text-slate-700 mb-1">地图加载超时</div>
                    <div className="text-xs text-slate-500 mb-4">
                      当前目的地：{itinerary.destination}
                    </div>
                    <button 
                      onClick={() => { setMapTimeout(false); setMapLoaded(false); }}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm"
                    >
                      再次尝试加载
                    </button>
                  </div>
                )}

                {!mapLoaded && !mapError && !mapTimeout && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-400 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    正在加载百度地图...
                  </div>
                )}
                {mapError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 p-6 text-center">
                    <Info className="w-8 h-8 text-slate-400 mb-2" />
                    <div className="text-xs text-slate-500 mb-2">{mapError}</div>
                    <button 
                      onClick={() => { setMapError(null); setMapLoaded(false); }}
                      className="text-[10px] font-bold text-emerald-600 underline"
                    >
                      重试
                    </button>
                  </div>
                )}
              </div>

              {/* Itinerary Details */}
              <div className="flex-1 bg-white rounded-t-3xl -mt-6 relative z-10 p-6 space-y-6">
                {/* Pace Warning */}
                {itinerary.paceWarning && (
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 items-start">
                    <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800 leading-relaxed">
                      <span className="font-bold">行程小贴士：</span>{itinerary.paceWarning}
                    </div>
                  </div>
                )}

                {/* Weather Info - Moved here */}
                {activeDay && (
                  <div className="flex items-center justify-between p-4 bg-sky-50 rounded-2xl border border-sky-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <Cloud className="w-6 h-6 text-sky-500" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-sky-900">{activeDay.weather.temp}</div>
                        <div className="text-[10px] text-sky-700 font-medium">{activeDay.weather.condition} • {activeDay.weather.description}</div>
                      </div>
                    </div>
                    <div className="text-[10px] font-bold text-sky-600 bg-white/50 px-2 py-1 rounded-md">
                      今日天气
                    </div>
                  </div>
                )}

                {/* Day Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {itinerary.days.map((day, idx) => (
                          <button
                            key={day.day}
                            onClick={() => setActiveDayIdx(idx)}
                            className={cn(
                              "px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all",
                              activeDayIdx === idx 
                                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" 
                                : "bg-slate-100 text-slate-500"
                            )}
                          >
                            第 {day.day} 天
                          </button>
                        ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeDayIdx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                        <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-1">
                            <Navigation className="w-4 h-4" />
                            今日路线
                          </div>
                          <p className="text-xs text-emerald-800 leading-relaxed">
                            {activeDay?.routeDescription}
                          </p>
                        </div>

                        {/* Accommodation */}
                        {activeDay?.accommodation && (
                          <div className="space-y-4">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                              <MapPin className="w-5 h-5 text-sky-500" />
                              住宿推荐
                            </h3>
                            <div className="p-4 rounded-2xl border border-slate-100 bg-sky-50/30 flex gap-4">
                              <div className="w-16 h-16 rounded-xl bg-white shadow-sm flex-shrink-0 flex items-center justify-center">
                                <MapPin className="w-8 h-8 text-sky-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-bold text-sm truncate">{activeDay.accommodation.name}</h4>
                                  <div className="text-[10px] font-bold text-sky-600 bg-sky-100 px-2 py-0.5 rounded">
                                    {activeDay.accommodation.type === 'hotel' ? '酒店' : 
                                     activeDay.accommodation.type === 'homestay' ? '民宿' : '露营地'}
                                  </div>
                                </div>
                                <p className="text-[10px] text-slate-500 mb-2">{activeDay.accommodation.address}</p>
                                <p className="text-xs text-slate-600 leading-relaxed">{activeDay.accommodation.description}</p>
                                {activeDay.accommodation.priceRange && (
                                  <div className="mt-2 text-[10px] font-bold text-slate-400">
                                    价格参考：{activeDay.accommodation.priceRange}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Timeline */}
                        <div className="space-y-6">
                          <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-emerald-500" />
                            行程安排
                          </h3>
                      <div className="space-y-8 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                        {activeDay?.activities.map((activity, idx) => (
                          <div key={idx} className="relative pl-8">
                            <div className={cn(
                              "absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm z-10",
                              activity.type === 'sightseeing' ? 'bg-emerald-500' :
                              activity.type === 'food' ? 'bg-orange-500' :
                              activity.type === 'transport' ? 'bg-blue-500' : 'bg-slate-400'
                            )} />
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                              {activity.time}
                            </div>
                            <div className="font-bold text-slate-900 mb-1">{activity.location}</div>
                            <p className="text-sm text-slate-500 leading-relaxed">
                              {activity.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                        {/* Restaurants */}
                        <div className="space-y-4">
                          <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <Utensils className="w-5 h-5 text-orange-500" />
                            精选美食
                          </h3>
                      <div className="space-y-3">
                        {activeDay?.restaurants.map((rest, idx) => (
                          <div key={idx} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex gap-4">
                            <div className="w-16 h-16 rounded-xl bg-slate-200 flex-shrink-0 flex items-center justify-center">
                              <Utensils className="w-8 h-8 text-slate-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-bold text-sm truncate">{rest.name}</h4>
                                <div className="flex items-center gap-1 text-xs font-bold text-orange-600">
                                  <Star className="w-3 h-3 fill-current" />
                                  {rest.rating}
                                </div>
                              </div>
                              <p className="text-[10px] text-slate-500 mb-2">{rest.cuisine} • {rest.address}</p>
                              <p className="text-xs text-slate-600 line-clamp-2">{rest.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          )}
        </main>

        {/* Bottom Nav */}
        {!itinerary && (
          <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-md border-t border-slate-100 p-4 flex justify-around items-center z-30">
            <button 
              onClick={() => setActiveTab('plan')}
              className={cn(
                "p-2 flex flex-col items-center gap-1 transition-colors",
                activeTab === 'plan' ? "text-emerald-600" : "text-slate-400"
              )}
            >
              <Search className="w-6 h-6" />
              <span className="text-[10px] font-bold">规划</span>
            </button>
            <button 
              onClick={() => setActiveTab('collection')}
              className={cn(
                "p-2 flex flex-col items-center gap-1 transition-colors",
                activeTab === 'collection' ? "text-emerald-600" : "text-slate-400"
              )}
            >
              <MapPin className="w-6 h-6" />
              <span className="text-[10px] font-bold">旅行集</span>
            </button>
          </div>
        )}

        {/* Modals */}
        <AnimatePresence>
          {/* Save Confirmation Modal */}
          {showSaveConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl space-y-6"
              >
                <div className="space-y-2 text-center">
                  <h3 className="text-lg font-bold text-slate-900">保存攻略？</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    是否将此次规划的行程保存到您的旅行集中？
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => confirmSave(true)}
                    className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-200"
                  >
                    保存并返回
                  </button>
                  <button 
                    onClick={() => confirmSave(false)}
                    className="w-full py-3 bg-slate-100 text-slate-500 rounded-xl font-bold"
                  >
                    不保存
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Save Name Prompt Modal */}
          {showSaveNamePrompt && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl space-y-6"
              >
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-900 text-center">攻略名称</h3>
                  <p className="text-xs text-slate-500 text-center">为您的旅行计划起一个好听的名字吧</p>
                </div>
                <input 
                  type="text"
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  placeholder="输入攻略名称"
                  value={itineraryName}
                  onChange={(e) => setItineraryName(e.target.value)}
                />
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowSaveNamePrompt(false)}
                    className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold"
                  >
                    取消
                  </button>
                  <button 
                    onClick={() => itinerary && saveItinerary(itinerary, true)}
                    className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-200"
                  >
                    保存
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl space-y-6"
              >
                <div className="space-y-2 text-center">
                  <h3 className="text-lg font-bold text-slate-900">删除攻略？</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    确定要删除这条攻略吗？删除后将无法恢复。
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold"
                  >
                    取消
                  </button>
                  <button 
                    onClick={confirmDelete}
                    className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold shadow-lg shadow-rose-200"
                  >
                    确定删除
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
