import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Calendar, 
  Car, 
  Bus, 
  Utensils, 
  Camera, 
  ArrowRight, 
  Navigation, 
  Loader2,
  Settings2,
  Sparkles,
  Search,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { generateItinerary } from '../services/geminiService';
import { useTravel } from '../context/TravelContext';
import { chineseCities, allCities } from '../data/cities';

export const PlanPage: React.FC = () => {
  const navigate = useNavigate();
  const { setCurrentItinerary } = useTravel();

  const [destination, setDestination] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter cities based on search
  const filteredCities = useMemo(() => {
    if (!citySearch) return chineseCities;
    return chineseCities.map(province => {
      const matchingCities = province.cities.filter(city => 
        city.toLowerCase().includes(citySearch.toLowerCase()) || 
        province.province.toLowerCase().includes(citySearch.toLowerCase())
      );
      return {
        ...province,
        cities: matchingCities
      };
    }).filter(province => province.cities.length > 0);
  }, [citySearch]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Split arrival and departure into date and time
  const [arrivalDate, setArrivalDate] = useState('');
  const [arrivalTimeStr, setArrivalTimeStr] = useState('10:00');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTimeStr, setDepartureTimeStr] = useState('18:00');

  const [transport, setTransport] = useState<string[]>([]);
  const [foodPrefs, setFoodPrefs] = useState('');
  const [sightseeingPrefs, setSightseeingPrefs] = useState('');
  const [accommodationType, setAccommodationType] = useState<'hotel' | 'homestay' | 'car'>('hotel');
  const [budget, setBudget] = useState<string>('');
  const [pace, setPace] = useState('medium');
  const [flexible, setFlexible] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const today = format(new Date(), "yyyy-MM-dd'T'HH:mm");

  const validateDates = (start: string, end: string) => {
    if (start && end) {
      const startDateObj = new Date(start);
      const endDateObj = new Date(end);
      if (startDateObj > endDateObj) {
        setError("到达时间不能晚于离开时间。");
        return false;
      }
    }
    setError(null);
    return true;
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
      setError("已取消生成。");
    }
  };

  const handleGenerate = async () => {
    const arrivalTime = arrivalDate ? `${arrivalDate}T${arrivalTimeStr}` : '';
    const departureTime = departureDate ? `${departureDate}T${departureTimeStr}` : '';

    if (!destination || !arrivalDate || !departureDate || transport.length === 0) {
      setError("请填写所有必填项（目的地、日期、交通方式）。");
      return;
    }

    if (!validateDates(arrivalTime, departureTime)) return;

    setLoading(true);
    setError(null);
    
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const transportLabels = transport.map(t => {
        if (t === 'public-taxi') return '公共交通/打车';
        if (t === 'rental') return '租车';
        if (t === 'self-driving') return '自驾';
        return t;
      });

      const result = await generateItinerary({
        destination,
        arrivalTime,
        departureTime,
        transport: transportLabels,
        foodPrefs,
        sightseeingPrefs,
        accommodationType,
        budget: budget ? parseInt(budget) : undefined,
        pace,
        flexible
      });
      
      if (controller.signal.aborted) return;

      setCurrentItinerary(result);
      navigate('/detail');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setError(err instanceof Error ? err.message : "发生未知错误。");
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="p-4 space-y-6 animate-reveal pb-24 max-w-2xl mx-auto">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[var(--accent-light)] rounded-2xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-[var(--accent)]" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[var(--text-base)]">
              开启新旅程
            </h1>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Start New Journey</p>
          </div>
        </div>
      </header>

      <div className="space-y-5">
        <div className="clean-card p-5 space-y-5">
          <div className="space-y-2 relative">
            <label className="text-sm font-extrabold text-[var(--text-base)] flex items-center gap-2 ml-1">
              <MapPin className="w-4 h-4 text-[var(--accent)]" />
              目的地 <span className="text-[var(--accent)]">*</span>
            </label>
            <div className="relative" ref={dropdownRef}>
              <input
                type="text"
                disabled={loading}
                placeholder="去哪里？"
                className="clean-input pl-12"
                value={showCityDropdown ? citySearch : destination}
                onChange={(e) => {
                  setCitySearch(e.target.value);
                  setShowCityDropdown(true);
                }}
                onFocus={() => {
                  setCitySearch(destination);
                  setShowCityDropdown(true);
                }}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
              
              {showCityDropdown && (
                <div className="absolute z-50 w-full mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-h-60 overflow-y-auto">
                  {filteredCities.length > 0 ? (
                    filteredCities.map(group => (
                      <div key={group.province}>
                        <div className="px-4 py-2 bg-[var(--bg-base)] text-[10px] font-bold text-[var(--text-muted)] sticky top-0 border-b border-[var(--border)] uppercase tracking-wider">
                          {group.province}
                        </div>
                        {group.cities.map(city => {
                          const fullCityName = `${group.province}-${city}`;
                          return (
                            <div
                              key={fullCityName}
                              className="px-5 py-3 hover:bg-[var(--accent-light)] cursor-pointer text-sm font-bold transition-colors border-b border-[var(--border)] last:border-0"
                              onClick={() => {
                                setDestination(fullCityName);
                                setShowCityDropdown(false);
                                setCitySearch('');
                              }}
                            >
                              {city}
                            </div>
                          );
                        })}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-[var(--text-muted)] text-sm font-bold text-center">未找到匹配城市</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-extrabold text-[var(--text-base)] flex items-center gap-2 ml-1">
                <Calendar className="w-4 h-4 text-[var(--accent)]" />
                到达时间 <span className="text-[var(--accent)]">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input 
                  disabled={loading}
                  type="date" 
                  min={today.split('T')[0]}
                  className="clean-input text-sm"
                  value={arrivalDate}
                  onChange={(e) => {
                    setArrivalDate(e.target.value);
                    const fullArrival = e.target.value ? `${e.target.value}T${arrivalTimeStr}` : '';
                    const fullDeparture = departureDate ? `${departureDate}T${departureTimeStr}` : '';
                    validateDates(fullArrival, fullDeparture);
                  }}
                />
                <input 
                  disabled={loading}
                  type="time" 
                  className="clean-input text-sm"
                  value={arrivalTimeStr}
                  onChange={(e) => {
                    setArrivalTimeStr(e.target.value);
                    const fullArrival = arrivalDate ? `${arrivalDate}T${e.target.value}` : '';
                    const fullDeparture = departureDate ? `${departureDate}T${departureTimeStr}` : '';
                    validateDates(fullArrival, fullDeparture);
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-extrabold text-[var(--text-base)] flex items-center gap-2 ml-1">
                <Calendar className="w-4 h-4 text-[var(--accent)]" />
                离开时间 <span className="text-[var(--accent)]">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input 
                  disabled={loading}
                  type="date" 
                  min={arrivalDate}
                  className="clean-input text-sm"
                  value={departureDate}
                  onChange={(e) => {
                    setDepartureDate(e.target.value);
                    const fullArrival = arrivalDate ? `${arrivalDate}T${arrivalTimeStr}` : '';
                    const fullDeparture = e.target.value ? `${e.target.value}T${departureTimeStr}` : '';
                    validateDates(fullArrival, fullDeparture);
                  }}
                />
                <input 
                  disabled={loading}
                  type="time" 
                  className="clean-input text-sm"
                  value={departureTimeStr}
                  onChange={(e) => {
                    setDepartureTimeStr(e.target.value);
                    const fullArrival = arrivalDate ? `${arrivalDate}T${arrivalTimeStr}` : '';
                    const fullDeparture = departureDate ? `${departureDate}T${e.target.value}` : '';
                    validateDates(fullArrival, fullDeparture);
                  }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-extrabold text-[var(--text-base)] flex items-center gap-2 ml-1">
              <Navigation className="w-4 h-4 text-[var(--accent)]" />
              交通方式 <span className="text-[var(--accent)]">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'public-taxi', label: '公共交通', icon: Bus },
                { id: 'rental', label: '租车', icon: Car },
                { id: 'self-driving', label: '自驾', icon: Car },
              ].map((mode) => (
                <button
                  key={mode.id}
                  disabled={loading}
                  onClick={() => {
                    setTransport(prev => 
                      prev.includes(mode.id) 
                        ? prev.filter(t => t !== mode.id)
                        : [...prev, mode.id]
                    );
                  }}
                  className={clsx(
                    "flex flex-col items-center justify-center p-4 rounded-2xl transition-all gap-2 font-bold text-xs border",
                    transport.includes(mode.id) 
                      ? "bg-[var(--accent)] border-[var(--accent)] text-white" 
                      : "bg-[var(--bg-base)] border-[var(--border)] text-[var(--text-muted)]",
                    "disabled:opacity-50"
                  )}
                >
                  <mode.icon className="w-5 h-5" />
                  <span>{mode.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="clean-card p-5">
          <div className="space-y-3">
            <div className="text-sm font-extrabold text-[var(--text-base)] flex items-center gap-2 ml-1">
              <Settings2 className="w-4 h-4 text-[var(--accent)]" />
              住宿偏好
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'hotel', label: '酒店' },
                { id: 'homestay', label: '民宿' },
                { id: 'car', label: '房车/露营' },
              ].map((type) => (
                <button
                  key={type.id}
                  disabled={loading}
                  onClick={() => setAccommodationType(type.id as any)}
                  className={clsx(
                    "py-3 px-2 text-xs font-bold rounded-xl transition-all border",
                    accommodationType === type.id 
                      ? "bg-[var(--accent)] text-white border-[var(--accent)]" 
                      : "bg-transparent text-[var(--text-muted)] border-[var(--border)]"
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3 pt-2">
            <label className="text-[11px] font-bold text-[var(--text-muted)] ml-1 uppercase tracking-widest">
              预算限制 (可选)
            </label>
            <input 
              disabled={loading}
              type="number"
              placeholder="例如：500"
              className="clean-input"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </div>
        </div>

        <div className="clean-card p-5 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-extrabold text-[var(--text-base)] flex items-center gap-2 ml-1">
              <Utensils className="w-4 h-4 text-[var(--accent)]" />
              饮食偏好
            </label>
            <textarea 
              disabled={loading}
              placeholder="例如：素食、当地小吃..."
              className="clean-input min-h-[100px] resize-none"
              value={foodPrefs}
              onChange={(e) => setFoodPrefs(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-extrabold text-[var(--text-base)] flex items-center gap-2 ml-1">
              <Camera className="w-4 h-4 text-[var(--accent)]" />
              必去景点
            </label>
            <textarea 
              disabled={loading}
              placeholder="例如：博物馆、公园..."
              className="clean-input min-h-[100px] resize-none"
              value={sightseeingPrefs}
              onChange={(e) => setSightseeingPrefs(e.target.value)}
            />
          </div>
        </div>


        <div className="flex items-center justify-between p-4 clean-card">
          <div className="space-y-1">
            <div className="text-sm font-extrabold text-[var(--text-base)]">行程节奏</div>
            <div className="text-[12px] text-[var(--text-muted)] uppercase tracking-wider">
              {pace === 'low' ? '轻松 (10:00 - 21:00)' : 
               pace === 'high' ? '紧凑 (08:00 - 22:00)' : 
               '适中 (常规作息)'}
            </div>
          </div>
          <select 
            disabled={loading}
            className="bg-[var(--surface)] border border-[var(--border)] text-[var(--text-base)] font-bold rounded-xl p-2 text-sm outline-none"
            value={pace}
            onChange={(e) => setPace(e.target.value)}
          >
            <option value="low">轻松</option>
            <option value="medium">适中</option>
            <option value="high">紧凑</option>
          </select>
        </div>

        <div className="flex items-center justify-between p-4 clean-card">
          <div className="space-y-1">
            <div className="text-sm font-extrabold text-[var(--text-base)]">灵活模式</div>
            <div className="text-[12px] text-[var(--text-muted)] uppercase tracking-wider">
              AI 自动优化行程
            </div>
          </div>
          <button 
            onClick={() => setFlexible(!flexible)}
            className={clsx(
              "w-12 h-6 rounded-full transition-all relative flex-shrink-0 border border-[var(--border)]",
              flexible ? "bg-[var(--accent)] border-[var(--accent)]" : "bg-[var(--border)]"
            )}
          >
            <div className={clsx(
              "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all",
              flexible ? "left-6" : "left-1"
            )} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-500 rounded-2xl font-bold text-xs border border-red-100">
          {error}
        </div>
      )}

      <button
        disabled={loading}
        onClick={handleGenerate}
        className="clean-btn-primary h-16 text-lg mt-4 rounded-full"
      >
        {loading ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            生成中...
          </>
        ) : (
          <>
            <Zap className="w-6 h-6" />
            生成行程
          </>
        )}
      </button>

      {loading && (
        <button
          onClick={handleCancel}
          className="clean-btn-secondary h-14 text-sm mt-2 !text-red-500 !border-red-200 hover:!bg-red-50"
        >
          取消
        </button>
      )}
    </div>
  );
};

