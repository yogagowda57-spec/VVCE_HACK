import React, { useState, useEffect } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import { Hospital, Ambulance, Coordinates } from '../types';
import {
  Hospital as HospitalIcon,
  Navigation,
  Compass,
  AlertTriangle,
  ExternalLink,
  Layers,
  MapPin,
  Ambulance as AmbulanceIcon,
  CheckCircle2,
  XCircle,
  Activity,
  Car,
} from 'lucide-react';

declare const google: any;

// Google Maps TrafficLayer controller component
const TrafficLayerController: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || typeof google === 'undefined' || !google.maps || !google.maps.TrafficLayer) return;

    const trafficLayer = new google.maps.TrafficLayer();
    if (enabled) {
      trafficLayer.setMap(map);
    } else {
      trafficLayer.setMap(null);
    }

    return () => {
      trafficLayer.setMap(null);
    };
  }, [map, enabled]);

  return null;
};

interface GoogleMapViewProps {
  userLocation: Coordinates;
  userAddress?: string;
  hospitals: Hospital[];
  ambulances?: Ambulance[];
  selectedHospitalId?: string;
  bestHospitalId?: string;
  nearestHospitalId?: string;
  onSelectHospital?: (hospital: Hospital) => void;
  destinationLocation?: Coordinates;
  ambulanceLocation?: Coordinates;
  height?: string;
  interactive?: boolean;
}

const GOOGLE_MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ||
  'AIzaSyAvzC01eJ7LQPcrabHINeIz1967eEPjvHo';

export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  userLocation,
  userAddress = 'Incident Location',
  hospitals,
  ambulances = [],
  selectedHospitalId,
  bestHospitalId,
  nearestHospitalId,
  onSelectHospital,
  destinationLocation,
  ambulanceLocation,
  height = '100%',
}) => {
  const [mapMode, setMapMode] = useState<'google' | 'radar'>('google');
  const [showTraffic, setShowTraffic] = useState<boolean>(true);
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [center, setCenter] = useState<Coordinates>(userLocation);
  const [zoom, setZoom] = useState<number>(13);

  // Update center when userLocation changes
  useEffect(() => {
    if (userLocation) {
      setCenter(userLocation);
    }
  }, [userLocation]);

  const activeHospital = hospitals.find((h) => h.id === activeMarkerId);

  // Native Google Maps deep-link navigation URL
  const getGoogleMapsDirUrl = (dest: Coordinates) => {
    return `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${dest.lat},${dest.lng}`;
  };

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900 shadow-xl" style={{ height }}>
      {/* Top Map Controller HUD */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 shadow-md">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <span className="text-xs font-semibold text-slate-200">Mysuru GPS Grid</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-[11px] font-mono text-cyan-400">
            {userLocation.lat.toFixed(4)}° N, {userLocation.lng.toFixed(4)}° E
          </span>
        </div>

        {/* Mode Switcher, Traffic Layer Toggle & Deep Navigation Link */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* TrafficLayer Toggle */}
          <button
            onClick={() => setShowTraffic(!showTraffic)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg border backdrop-blur transition-all shadow ${
              showTraffic
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                : 'bg-slate-800/90 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Toggle Live Google Maps Traffic Layer / Congestion Hotspots"
          >
            <Car className={`w-3.5 h-3.5 ${showTraffic ? 'text-amber-400' : 'text-slate-500'}`} />
            <span>{showTraffic ? 'TRAFFIC: ON' : 'TRAFFIC: OFF'}</span>
          </button>

          <button
            onClick={() => setMapMode(mapMode === 'google' ? 'radar' : 'google')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-600/60 text-slate-200 backdrop-blur transition-all shadow"
            title="Toggle between Google Satellite/Vector Map and Radar Vector Canvas"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>{mapMode === 'google' ? 'Radar Canvas' : 'Google Map'}</span>
          </button>

          {destinationLocation && (
            <a
              href={getGoogleMapsDirUrl(destinationLocation)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-transform active:scale-95"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Launch Turn-by-Turn</span>
              <ExternalLink className="w-3 h-3 opacity-80" />
            </a>
          )}
        </div>
      </div>

      {/* Map Content: Google Maps or Radar Canvas */}
      {mapMode === 'google' ? (
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY} solutionChannel="GMP_aistudio_build">
          <div className="w-full h-full min-h-[350px]">
            <Map
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              center={center}
              zoom={zoom}
              onCenterChanged={(e) => setCenter(e.detail.center)}
              onZoomChanged={(e) => setZoom(e.detail.zoom)}
              gestureHandling="greedy"
              disableDefaultUI={false}
              className="w-full h-full"
            >
              {/* Traffic Layer Real-time Congestion Hotspots */}
              <TrafficLayerController enabled={showTraffic} />

              {/* User Incident Location Marker */}
              <AdvancedMarker position={userLocation} zIndex={100} title={`Incident: ${userAddress}`}>
                <div className="relative group cursor-pointer">
                  <span className="animate-ping absolute -top-1 -left-1 h-8 w-8 rounded-full bg-rose-500 opacity-60"></span>
                  <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-rose-600 border-2 border-white shadow-xl text-white">
                    <MapPin className="w-4 h-4 fill-white" />
                  </div>
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/95 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-500/40 shadow">
                    INCIDENT LOCATION
                  </div>
                </div>
              </AdvancedMarker>

              {/* Ambulance Markers */}
              {ambulances.map((amb) => {
                const isSelectedAmbulance = amb.currentLocation.lat === ambulanceLocation?.lat;
                return (
                  <AdvancedMarker
                    key={amb.id}
                    position={amb.currentLocation}
                    zIndex={90}
                    title={`${amb.vehiclePlate} (${amb.driverName})`}
                  >
                    <div className="relative group cursor-pointer">
                      <div
                        className={`flex items-center justify-center w-7 h-7 rounded-full border-2 shadow-xl ${
                          amb.status === 'AVAILABLE'
                            ? 'bg-amber-500 border-white text-slate-950'
                            : 'bg-emerald-500 border-white text-slate-950'
                        }`}
                      >
                        <AmbulanceIcon className="w-4 h-4" />
                      </div>
                      <div className="absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/95 text-amber-300 text-[10px] font-mono px-1.5 py-0.5 rounded border border-amber-500/40 shadow">
                        {amb.vehiclePlate}
                      </div>
                    </div>
                  </AdvancedMarker>
                );
              })}

              {/* Hospital Markers */}
              {hospitals.map((hosp) => {
                const isBest = hosp.id === bestHospitalId;
                const isNearest = hosp.id === nearestHospitalId;
                const isSelected = hosp.id === selectedHospitalId;
                const isAvailable = hosp.edOperational && hosp.status !== 'DIVERT';

                let pinColor = '#0284c7'; // cyan
                let glyphColor = '#ffffff';

                if (isBest) {
                  pinColor = '#10b981'; // emerald
                } else if (!isAvailable) {
                  pinColor = '#64748b'; // slate/ineligible
                } else if (isNearest) {
                  pinColor = '#f59e0b'; // amber
                }

                return (
                  <AdvancedMarker
                    key={hosp.id}
                    position={hosp.coordinates}
                    zIndex={isBest ? 95 : 80}
                    onClick={() => {
                      setActiveMarkerId(hosp.id);
                      if (onSelectHospital) onSelectHospital(hosp);
                    }}
                  >
                    <div className="relative group cursor-pointer">
                      {isBest && (
                        <span className="animate-ping absolute -top-1 -left-1 h-9 w-9 rounded-full bg-emerald-400 opacity-70"></span>
                      )}
                      <Pin
                        background={pinColor}
                        borderColor="#ffffff"
                        glyphColor={glyphColor}
                        scale={isBest || isSelected ? 1.25 : 1.0}
                      />
                      <div className="absolute top-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/95 text-slate-200 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-700 shadow pointer-events-none">
                        {isBest ? '★ RECOMMENDED BEST' : hosp.name.split('-')[0].trim()}
                      </div>
                    </div>
                  </AdvancedMarker>
                );
              })}

              {/* InfoWindow for Active Hospital */}
              {activeHospital && (
                <InfoWindow
                  position={activeHospital.coordinates}
                  onCloseClick={() => setActiveMarkerId(null)}
                >
                  <div className="p-2 max-w-xs text-slate-900">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1 mb-1.5">
                      <h4 className="font-bold text-xs text-slate-900 truncate">
                        {activeHospital.name}
                      </h4>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          activeHospital.id === bestHospitalId
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {activeHospital.id === bestHospitalId ? 'BEST MATCH' : activeHospital.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 mb-2">
                      {activeHospital.address}
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px] mb-2 bg-slate-50 p-1.5 rounded border border-slate-200">
                      <div>
                        <span className="text-slate-500">ICU Beds:</span>{' '}
                        <strong className="text-emerald-700">
                          {activeHospital.icuBeds.available} / {activeHospital.icuBeds.total}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Status:</span>{' '}
                        <strong className={activeHospital.edOperational ? 'text-emerald-700' : 'text-rose-600'}>
                          {activeHospital.edOperational ? 'OPEN 24/7' : 'DIVERT'}
                        </strong>
                      </div>
                    </div>
                    <a
                      href={getGoogleMapsDirUrl(activeHospital.coordinates)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-full gap-1 py-1 px-2 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded transition"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Navigate Here via Google Maps</span>
                    </a>
                  </div>
                </InfoWindow>
              )}
            </Map>
          </div>
        </APIProvider>
      ) : (
        /* Radar SVG Canvas Fallback/Alternative Visualization */
        <InteractiveRadarCanvas
          userLocation={userLocation}
          hospitals={hospitals}
          ambulances={ambulances}
          bestHospitalId={bestHospitalId}
          selectedHospitalId={selectedHospitalId}
          onSelectHospital={onSelectHospital}
          getGoogleMapsDirUrl={getGoogleMapsDirUrl}
        />
      )}

      {/* Map Legend Footer Bar */}
      <div className="absolute bottom-2 left-2 right-2 z-10 flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 backdrop-blur-md border border-slate-800 text-[11px] text-slate-300 pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
            <span>Incident</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>Recommended Best</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            <span>Nearest Alt</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block"></span>
            <span>Ambulance</span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-slate-400 font-mono text-[10px]">
          <span>Mysuru Smart City Emergency Corridor</span>
        </div>
      </div>
    </div>
  );
};

// Radar SVG Canvas Component for Instant Offline Visualization & Live Simulation
const InteractiveRadarCanvas: React.FC<{
  userLocation: Coordinates;
  hospitals: Hospital[];
  ambulances: Ambulance[];
  bestHospitalId?: string;
  selectedHospitalId?: string;
  onSelectHospital?: (hospital: Hospital) => void;
  getGoogleMapsDirUrl: (dest: Coordinates) => string;
}> = ({
  userLocation,
  hospitals,
  ambulances,
  bestHospitalId,
  selectedHospitalId,
  onSelectHospital,
  getGoogleMapsDirUrl,
}) => {
  // Map Mysuru bounding box to SVG coordinates:
  // Lat: 12.280 to 12.370 (~10km) -> Y: 460 to 40
  // Lng: 76.590 to 76.690 (~11km) -> X: 40 to 660
  const latMin = 12.280;
  const latMax = 12.370;
  const lngMin = 76.590;
  const lngMax = 76.690;

  const toSvgX = (lng: number) => {
    return 40 + ((lng - lngMin) / (lngMax - lngMin)) * 620;
  };

  const toSvgY = (lat: number) => {
    return 460 - ((lat - latMin) / (latMax - latMin)) * 420;
  };

  const userSvgX = toSvgX(userLocation.lng);
  const userSvgY = toSvgY(userLocation.lat);

  const bestHospital = hospitals.find((h) => h.id === bestHospitalId);
  const bestSvgX = bestHospital ? toSvgX(bestHospital.coordinates.lng) : 0;
  const bestSvgY = bestHospital ? toSvgY(bestHospital.coordinates.lat) : 0;

  return (
    <div className="w-full h-full min-h-[350px] bg-slate-950 relative overflow-hidden select-none">
      {/* Background Radar Grid */}
      <svg className="w-full h-full" viewBox="0 0 700 500">
        <defs>
          <radialGradient id="radarPulse" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
          </radialGradient>
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        <line x1="40" y1="250" x2="660" y2="250" stroke="#1e293b" strokeDasharray="4 4" />
        <line x1="350" y1="40" x2="350" y2="460" stroke="#1e293b" strokeDasharray="4 4" />
        <circle cx={userSvgX} cy={userSvgY} r="60" fill="none" stroke="#334155" strokeWidth="0.8" />
        <circle cx={userSvgX} cy={userSvgY} r="120" fill="none" stroke="#1e293b" strokeWidth="0.8" />
        <circle cx={userSvgX} cy={userSvgY} r="180" fill="none" stroke="#1e293b" strokeWidth="0.5" />

        {/* Mysuru City simulated arterial roads */}
        {/* Ring Road outer loop */}
        <ellipse cx="350" cy="250" rx="270" ry="190" fill="none" stroke="#1e293b" strokeWidth="3" />
        <text x="500" y="70" fill="#475569" fontSize="10" fontFamily="sans-serif">Outer Ring Road (ORR)</text>

        {/* Sayyaji Rao Rd & Irwin Rd axis */}
        <line x1="350" y1="120" x2="350" y2="380" stroke="#334155" strokeWidth="2.5" />
        <line x1="200" y1="240" x2="520" y2="240" stroke="#334155" strokeWidth="2.5" />
        <text x="355" y="150" fill="#64748b" fontSize="9" fontFamily="sans-serif">Sayyaji Rao Rd Corridor</text>

        {/* Route Polyline from Incident to Best Hospital */}
        {bestHospital && (
          <g>
            <line
              x1={userSvgX}
              y1={userSvgY}
              x2={bestSvgX}
              y2={bestSvgY}
              stroke="url(#routeGradient)"
              strokeWidth="4"
              strokeDasharray="6 4"
              className="animate-pulse"
            />
            <circle cx={(userSvgX + bestSvgX) / 2} cy={(userSvgY + bestSvgY) / 2} r="14" fill="#0f172a" stroke="#10b981" strokeWidth="1.5" />
            <text x={(userSvgX + bestSvgX) / 2} y={(userSvgY + bestSvgY) / 2 + 3} fill="#34d399" fontSize="9" fontWeight="bold" textAnchor="middle">
              ETA
            </text>
          </g>
        )}

        {/* Hospitals */}
        {hospitals.map((hosp) => {
          const x = toSvgX(hosp.coordinates.lng);
          const y = toSvgY(hosp.coordinates.lat);
          const isBest = hosp.id === bestHospitalId;
          const isSelected = hosp.id === selectedHospitalId;
          const isOperational = hosp.edOperational && hosp.status !== 'DIVERT';

          return (
            <g
              key={hosp.id}
              className="cursor-pointer transition-transform hover:scale-110"
              onClick={() => onSelectHospital && onSelectHospital(hosp)}
            >
              {isBest && (
                <circle cx={x} cy={y} r="22" fill="#10b981" opacity="0.25" className="animate-ping" />
              )}
              <circle
                cx={x}
                cy={y}
                r={isBest ? "14" : "10"}
                fill={isBest ? "#10b981" : isOperational ? "#0284c7" : "#475569"}
                stroke="#ffffff"
                strokeWidth="2"
              />
              <text x={x} y={y + 3.5} fill="#ffffff" fontSize={isBest ? "11" : "9"} fontWeight="bold" textAnchor="middle">
                H
              </text>
              <text
                x={x}
                y={y + 24}
                fill={isBest ? "#34d399" : "#cbd5e1"}
                fontSize="9"
                fontWeight={isBest ? "bold" : "normal"}
                textAnchor="middle"
              >
                {hosp.name.split('-')[0].trim().slice(0, 18)}
              </text>
            </g>
          );
        })}

        {/* Ambulances */}
        {ambulances.map((amb) => {
          const ax = toSvgX(amb.currentLocation.lng);
          const ay = toSvgY(amb.currentLocation.lat);
          return (
            <g key={amb.id}>
              <circle cx={ax} cy={ay} r="11" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
              <text x={ax} y={ay + 3} fill="#0f172a" fontSize="8" fontWeight="bold" textAnchor="middle">
                🚑
              </text>
              <text x={ax} y={ay - 14} fill="#fbbf24" fontSize="8" fontFamily="monospace" textAnchor="middle">
                {amb.vehiclePlate}
              </text>
            </g>
          );
        })}

        {/* User Incident Location */}
        <g>
          <circle cx={userSvgX} cy={userSvgY} r="18" fill="#f43f5e" opacity="0.4" className="animate-ping" />
          <circle cx={userSvgX} cy={userSvgY} r="11" fill="#e11d48" stroke="#ffffff" strokeWidth="2.5" />
          <text x={userSvgX} y={userSvgY + 3.5} fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
            📍
          </text>
          <text x={userSvgX} y={userSvgY - 16} fill="#fb7185" fontSize="10" fontWeight="bold" textAnchor="middle">
            PATIENT INCIDENT
          </text>
        </g>
      </svg>
    </div>
  );
};
