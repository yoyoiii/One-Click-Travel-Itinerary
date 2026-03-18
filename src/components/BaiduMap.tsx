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

    const existingScript = document.getElementById('baidu-maps-script');
    if (existingScript) {
      // If script exists but BMap is not yet ready, wait for the callback
      const oldCallback = (window as any).initBaiduMap;
      (window as any).initBaiduMap = () => {
        if (oldCallback) oldCallback();
        setMapLoaded(true);
      };
      return;
    }

    const script = document.createElement('script');
    script.id = 'baidu-maps-script';
    // Switch to v2.0 for better stability in iframe/React environments
    // Add &s=1 to force HTTPS for all resources
    script.src = `https://api.map.baidu.com/api?v=2.0&ak=${ak}&s=1&callback=initBaiduMap`;
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
    let retryCount = 0;
    const MAX_RETRIES = 5;

    const initMap = () => {
      try {
        const BMap = (window as any).BMap;
        // Ensure BMap and its core classes are available
        if (!BMap || !BMap.Map || !BMap.LocalSearch) {
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            timer = setTimeout(initMap, 500);
          }
          return;
        }

        if (!mapContainerRef.current || mapContainerRef.current.offsetWidth === 0) {
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            timer = setTimeout(initMap, 500);
          }
          return;
        }

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
        // The 'coordType' error almost always means the AK is invalid or domain is not whitelisted
        if (err instanceof Error && err.message.includes('coordType')) {
          setMapError("地图鉴权失败：请检查 BAIDU_MAPS_AK 是否有效，或当前域名是否已加入百度地图白名单。");
        } else {
          setMapError("地图初始化失败，请稍后重试。");
        }
      }
    };

    if (mapLoaded && mapContainerRef.current) {
      timeoutTimer = setTimeout(() => {
        if (!mapInstanceRef.current && !mapError) {
          console.warn("Map initialization timed out, using fallback.");
          setMapTimeout(true);
        }
      }, MAP_INIT_TIMEOUT);

      timer = setTimeout(initMap, 200);
    }
    return () => {
      if (timer) clearTimeout(timer);
      if (timeoutTimer) clearTimeout(timeoutTimer);
    };
  }, [mapLoaded, destination, mapQuery]);

  return (
    <div className="h-48 bg-slate-200 relative overflow-hidden">
      {!mapError ? (
        <div ref={mapContainerRef} className={clsx("w-full h-full", mapTimeout && "hidden")} />
      ) : (
        <iframe
          title="Map Fallback"
          width="100%"
          height="100%"
          frameBorder="0"
          style={{ border: 0 }}
          src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery || destination)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
          allowFullScreen
        />
      )}
      
      {mapTimeout && !mapError && (
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
          正在加载地图...
        </div>
      )}
      
      {mapError && (
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm border border-rose-100 flex items-center gap-2 z-10">
          <Info className="w-3.5 h-3.5 text-rose-500" />
          <span className="text-[10px] text-slate-600 font-medium">
            百度地图加载失败，已切换至备用地图
          </span>
        </div>
      )}
    </div>
  );
};
