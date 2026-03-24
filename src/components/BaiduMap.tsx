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
      setMapError("缺少百度地图 AK，请在设置中配置 BAIDU_MAPS_AK。");
      return;
    }

    if ((window as any).BMap) {
      setMapLoaded(true);
      return;
    }

    const existingScript = document.getElementById('baidu-maps-script');
    if (existingScript) {
      const oldCallback = (window as any).initBaiduMap;
      (window as any).initBaiduMap = () => {
        if (oldCallback) oldCallback();
        setMapLoaded(true);
      };
      return;
    }

    const script = document.createElement('script');
    script.id = 'baidu-maps-script';
    script.src = `https://api.map.baidu.com/api?v=2.0&ak=${ak}&s=1&callback=initBaiduMap`;
    script.async = true;
    
    script.onerror = () => {
      setMapError("加载百度地图脚本失败。");
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
    <div className="h-48 bg-[var(--border)] relative overflow-hidden rounded-3xl">
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
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--bg-base)] p-6 text-center">
          <MapPin className="w-8 h-8 text-[var(--accent)] mb-2" />
          <div className="text-sm font-bold text-[var(--text-base)] mb-1">地图加载超时</div>
          <div className="text-xs font-medium text-[var(--text-muted)] mb-4">
            目标：{destination}
          </div>
          <button 
            onClick={() => { setMapTimeout(false); setMapLoaded(false); }}
            className="clean-btn-secondary px-4 py-2 text-xs"
          >
            重试连接
          </button>
        </div>
      )}

      {!mapLoaded && !mapError && !mapTimeout && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-base)] text-[var(--text-muted)] text-xs font-bold">
          <Loader2 className="w-4 h-4 animate-spin mr-2 text-[var(--accent)]" />
          正在初始化地图...
        </div>
      )}
      
      {mapError && (
        <div className="absolute top-2 right-2 bg-[var(--surface)]/90 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-sm border border-[var(--border)] flex items-center gap-2 z-10">
          <Info className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[10px] font-bold text-[var(--text-base)]">
            地图加载失败，已启用备用方案。
          </span>
        </div>
      )}
    </div>
  );
};
