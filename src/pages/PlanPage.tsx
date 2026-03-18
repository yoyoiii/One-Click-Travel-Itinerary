import React, { useState, useRef } from 'react';
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

export const PlanPage: React.FC = () => {
  const navigate = useNavigate();
  const { setCurrentItinerary } = useTravel();

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
    if (!destination || !arrivalTime || !departureTime || !transport) {
      setError("请填写所有必填项（目的地、到达/离开时间、交通方式）");
      return;
    }

    if (!validateDates(arrivalTime, departureTime)) return;

    setLoading(true);
    setError(null);
    
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
              onChange={(e) => {
                setArrivalTime(e.target.value);
                validateDates(e.target.value, departureTime);
              }}
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
              onChange={(e) => {
                setDepartureTime(e.target.value);
                validateDates(arrivalTime, e.target.value);
              }}
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
                className={clsx(
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
