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
  Settings2
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
        setError("到达时间不能晚于离开时间");
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
      setError("已取消生成");
    }
  };

  const handleGenerate = async () => {
    const arrivalTime = arrivalDate ? `${arrivalDate}T${arrivalTimeStr}` : '';
    const departureTime = departureDate ? `${departureDate}T${departureTimeStr}` : '';

    if (!destination || !arrivalDate || !departureDate || transport.length === 0) {
      setError("请填写所有必填项（目的地、到达/离开日期、交通方式）");
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
      setError(err instanceof Error ? err.message : "发生未知错误");
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <header className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">智能旅行助手</h1>
          <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold">
            一键生成攻略
          </div>
        </div>
        <p className="text-slate-500 text-sm">秒级规划您的完美旅程</p>
      </header>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            目的地 <span className="text-rose-500">*</span>
          </label>
          <div className="relative" ref={dropdownRef}>
            <input
              type="text"
              disabled={loading}
              placeholder="请选择此次旅行目的地"
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-800 outline-none bg-white text-sm disabled:bg-slate-50 disabled:text-slate-400"
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
            {showCityDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {filteredCities.length > 0 ? (
                  filteredCities.map(group => (
                    <div key={group.province}>
                      <div className="px-3 py-1 bg-slate-50 text-xs font-bold text-slate-500 sticky top-0">
                        {group.province}
                      </div>
                      {group.cities.map(city => {
                        const fullCityName = `${group.province}-${city}`;
                        return (
                          <div
                            key={fullCityName}
                            className="p-3 hover:bg-slate-100 cursor-pointer text-sm pl-4"
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
                  <div className="p-3 text-slate-400 text-sm text-center">未找到匹配的城市</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-3">
            <label className="text-sm font-bold flex items-center gap-2 text-slate-700">
              <Calendar className="w-4 h-4 text-emerald-500" />
              到达目的地
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input 
                disabled={loading}
                type="date" 
                min={today.split('T')[0]}
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-800 outline-none bg-white text-sm cursor-pointer"
                value={arrivalDate}
                onClick={(e) => 'showPicker' in e.target && (e.target as HTMLInputElement).showPicker()}
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
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-800 outline-none bg-white text-sm cursor-pointer"
                value={arrivalTimeStr}
                onClick={(e) => 'showPicker' in e.target && (e.target as HTMLInputElement).showPicker()}
                onChange={(e) => {
                  setArrivalTimeStr(e.target.value);
                  const fullArrival = arrivalDate ? `${arrivalDate}T${e.target.value}` : '';
                  const fullDeparture = departureDate ? `${departureDate}T${departureTimeStr}` : '';
                  validateDates(fullArrival, fullDeparture);
                }}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold flex items-center gap-2 text-slate-700">
              <Calendar className="w-4 h-4 text-rose-500" />
              离开目的地
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input 
                disabled={loading}
                type="date" 
                min={arrivalDate}
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-800 outline-none bg-white text-sm cursor-pointer"
                value={departureDate}
                onClick={(e) => 'showPicker' in e.target && (e.target as HTMLInputElement).showPicker()}
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
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-800 outline-none bg-white text-sm cursor-pointer"
                value={departureTimeStr}
                onClick={(e) => 'showPicker' in e.target && (e.target as HTMLInputElement).showPicker()}
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

        <div className="space-y-2">
          <label className="text-sm font-semibold flex items-center gap-2">
            <Navigation className="w-4 h-4 text-slate-400" />
            交通方式 <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'public-taxi', label: '公共交通/打车', icon: Bus },
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
                  "flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-1",
                  transport.includes(mode.id) 
                    ? "bg-slate-800 border-slate-800 text-white shadow-md" 
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
                className={clsx(
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

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
          <div className="space-y-1">
            <div className="text-sm font-semibold">灵活生成</div>
            <div className="text-[10px] text-slate-500">
              开启后 AI 将根据您的偏好自动优化行程，增减内容以确保行程更合理
            </div>
          </div>
          <button 
            onClick={() => setFlexible(!flexible)}
            className={clsx(
              "w-12 h-6 rounded-full transition-all relative flex-shrink-0",
              flexible ? "bg-emerald-500" : "bg-slate-300"
            )}
          >
            <div className={clsx(
              "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
              flexible ? "left-7" : "left-1"
            )} />
          </button>
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
  );
};
