import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Info } from 'lucide-react';
import { clsx } from 'clsx';

interface BaiduMapProps {
  destination: string;
  mapQuery?: string;
}

export const BaiduMap: React.FC<BaiduMapProps> = ({ destination, mapQuery }) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapTimeout, setMapTimeout] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const MAP_INIT_TIMEOUT = 10000;

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let timeoutTimer: NodeJS.Timeout;

    if (mapLoaded && mapContainerRef.current) {
      timeoutTimer = setTimeout(() => {
        if (!mapInstanceRef.current) {
          console.warn("Map initialization timed out, using fallback.");
          setMapTimeout(true);
        }
      }, MAP_INIT_TIMEOUT);

      timer = setTimeout(() => {
        try {
          const BMap = (window as any).BMap;
          if (!BMap || !BMap.Map) return;

          if (!mapInstanceRef.current) {
            mapInstanceRef.current = new BMap.Map(mapContainerRef.current);
            setMapTimeout(false);
            clearTimeout(timeoutTimer);
          }
          
          const map = mapInstanceRef.current;
          const query = mapQuery || destination;
          
          map.clearOverlays();
          
          const local = new BMap.LocalSearch(map, {
            renderOptions: { map: map, autoViewport: true }
          });
          
          local.search(query);
        } catch (err) {
          console.error("Error initializing Baidu Map instance:", err);
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
  }, [mapLoaded, destination, mapQuery]);

  return (
    <div className="h-48 bg-slate-200 relative overflow-hidden">
      <div ref={mapContainerRef} className={clsx("w-full h-full", mapTimeout && "hidden")} />
      
      {mapTimeout && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 p-6 text-center">
          <MapPin className="w-8 h-8 text-slate-400 mb-2" />
          <div className="text-sm font-bold text-slate-700 mb-1">地图加载超时</div>
          <div className="text-xs text-slate-500 mb-4">
            当前目的地：{destination}
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
  );
};
