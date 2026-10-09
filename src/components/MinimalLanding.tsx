import React, { useState, useRef } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { playEmergencySirenAlert, playTapBeep } from '../utils/audioAlert';
import { Shield, MapPin, Radio, CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface MinimalLandingProps {
  onOpenAuth: () => void;
  onOpenHospitalIntel?: () => void;
  onOpenDispatcher?: () => void;
  onOpenCitizenPortal?: () => void;
}

export const MinimalLanding: React.FC<MinimalLandingProps> = ({
  onOpenAuth,
  onOpenHospitalIntel,
  onOpenDispatcher,
  onOpenCitizenPortal,
}) => {
  const { userCoords, triggerEmergencySOS, activeCase, cancelEmergencySOS } = useEmergency();
  const [tapCount, setTapCount] = useState<number>(0);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [dispatchedCaseId, setDispatchedCaseId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const tapResetTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger Anonymous SOS
  const executeAnonymousSOS = () => {
    setIsDispatching(true);
    playEmergencySirenAlert();

    // Check geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            address: `GPS: ${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E (Mysuru)`,
          };
          const createdCase = triggerEmergencySOS({
            category: 'general_emergency',
            pickupLocation: loc,
          });
          setDispatchedCaseId(createdCase.id);
          setStatusMessage('ANONYMOUS EMERGENCY SIGNAL BROADCAST TO LOGGED-IN AMBULANCES');
          setIsDispatching(false);
        },
        () => {
          // Fallback to Mysuru City Center (12.3080, 76.6570)
          const fallbackLoc = {
            lat: 12.3080,
            lng: 76.6570,
            address: 'Mysuru City Center (Suburban Bus Stand / Palace Zone)',
          };
          const createdCase = triggerEmergencySOS({
            category: 'general_emergency',
            pickupLocation: fallbackLoc,
          });
          setDispatchedCaseId(createdCase.id);
          setStatusMessage('ANONYMOUS EMERGENCY SIGNAL BROADCAST (MYSURU CENTER GPS)');
          setIsDispatching(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      const fallbackLoc = {
        lat: 12.3080,
        lng: 76.6570,
        address: 'Mysuru City Center (Suburban Bus Stand / Palace Zone)',
      };
      const createdCase = triggerEmergencySOS({
        category: 'general_emergency',
        pickupLocation: fallbackLoc,
      });
      setDispatchedCaseId(createdCase.id);
      setStatusMessage('ANONYMOUS EMERGENCY SIGNAL BROADCAST');
      setIsDispatching(false);
    }
  };

  const handleSosClick = () => {
    playTapBeep();
    const nextCount = tapCount + 1;
    setTapCount(nextCount);

    if (tapResetTimerRef.current) {
      clearTimeout(tapResetTimerRef.current);
    }

    // Immediate dispatch if tapped 3 times, or single long click
    if (nextCount >= 3) {
      setTapCount(0);
      executeAnonymousSOS();
    } else {
      tapResetTimerRef.current = setTimeout(() => {
        // If user tapped once or twice and stopped, still dispatch after 1.8s
        executeAnonymousSOS();
        setTapCount(0);
      }, 1500);
    }
  };

  const handleCancel = () => {
    if (dispatchedCaseId) {
      cancelEmergencySOS(dispatchedCaseId, 'Cancelled by user from home screen');
    }
    setDispatchedCaseId(null);
    setStatusMessage(null);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between font-mono selection:bg-rose-600 selection:text-white">
      {/* 1. MINIMAL HEADER: App Logo/Name and [ Login / Sign Up ] Button */}
      <header className="w-full border-b border-neutral-900 bg-black/95 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-neutral-950 border border-neutral-800 flex items-center justify-center font-black text-rose-500 text-sm">
            108
          </div>
          <div>
            <span className="font-bold tracking-wider text-xs uppercase text-white block">
              Mysuru Emergency
            </span>
            <span className="text-[10px] text-neutral-500 tracking-tight flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5 text-cyan-400" />
              {userCoords.lat.toFixed(4)}° N, {userCoords.lng.toFixed(4)}° E
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenHospitalIntel && (
            <button
              onClick={onOpenHospitalIntel}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-cyan-400 font-bold text-xs uppercase tracking-wider transition border border-neutral-700"
              title="Inspect 12-Layer Hospital Intelligence & Infrastructure Profiles"
            >
              <span>🧠 Hospital Intel</span>
            </button>
          )}
          {onOpenDispatcher && (
            <button
              onClick={onOpenDispatcher}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-rose-400 font-bold text-xs uppercase tracking-wider transition border border-neutral-700"
              title="Open Dispatcher Control Room"
            >
              <span>📡 Dispatcher</span>
            </button>
          )}
          {onOpenCitizenPortal && (
            <button
              onClick={onOpenCitizenPortal}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-amber-400 font-bold text-xs uppercase tracking-wider transition border border-neutral-700"
              title="Open Public Route Finder"
            >
              <span>🗺️ Route Finder</span>
            </button>
          )}
          <button
            onClick={onOpenAuth}
            className="px-3.5 py-1.5 bg-white hover:bg-neutral-200 text-black font-bold text-xs uppercase tracking-wider transition border border-white active:scale-95 cursor-pointer shadow-lg"
          >
            [ Login / Sign Up ]
          </button>
        </div>
      </header>

      {/* 2. CENTER ACTION: MASSIVE, PULSING SOS BUTTON */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        {/* Pulsing Aura Rings */}
        <div className="relative flex items-center justify-center my-6">
          <span className="animate-ping absolute h-80 w-80 rounded-full bg-rose-600 opacity-20"></span>
          <span className="animate-pulse absolute h-64 w-64 rounded-full bg-white opacity-10"></span>

          {/* Main Huge SOS Action */}
          <button
            onClick={handleSosClick}
            disabled={isDispatching}
            className="relative z-10 w-56 h-56 rounded-full bg-black hover:bg-white text-white hover:text-black border-4 border-white shadow-2xl flex flex-col items-center justify-center transition-all duration-300 active:scale-95 group cursor-pointer"
          >
            <span className="text-3xl font-black tracking-wider text-rose-500 group-hover:text-black transition uppercase">
              Emergency
            </span>
            <span className="text-xs uppercase font-bold tracking-widest mt-2">
              {tapCount > 0 ? `TAP ${tapCount}/3` : '[ TAP FOR EMERGENCY ]'}
            </span>
            <span className="text-[9px] text-neutral-400 group-hover:text-neutral-700 mt-1">
              ANONYMOUS DISPATCH
            </span>
          </button>
        </div>

        {/* Dynamic Multi-Tap / Status Indicator */}
        <div className="mt-4 space-y-2 max-w-sm">
          {tapCount > 0 && !dispatchedCaseId && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-900 border border-neutral-700 text-cyan-400 text-xs font-bold uppercase animate-pulse">
              <Radio className="w-3.5 h-3.5 animate-spin" />
              <span>Tap again to dispatch instantly ({tapCount}/3)...</span>
            </div>
          )}

          {dispatchedCaseId && (
            <div className="p-4 bg-neutral-950 border border-rose-500 text-left space-y-2 text-xs animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-rose-400 font-bold uppercase flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                  BROADCAST ACTIVE: {dispatchedCaseId}
                </span>
                <button
                  onClick={handleCancel}
                  className="text-neutral-500 hover:text-white"
                  title="Cancel Dispatch"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-neutral-300 text-[11px] leading-relaxed">
                Emergency broadcast transmitted to on-duty ambulances. Location captured anonymously via GPS.
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-neutral-900 text-[10px] text-neutral-500">
                <span>Karnataka Emergency Network 108 / 112</span>
                <button
                  onClick={handleCancel}
                  className="px-2 py-0.5 border border-neutral-700 text-rose-400 hover:bg-neutral-900 uppercase"
                >
                  Cancel Call
                </button>
              </div>
            </div>
          )}

          {!dispatchedCaseId && tapCount === 0 && (
            <div className="space-y-4">
              <p className="text-[11px] text-neutral-500 tracking-wider uppercase">
                1-TAP OR MULTI-TAP INSTANT DISPATCH SEQUENCE
              </p>

              {/* Quick Operational Access Links */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px]">
                {onOpenHospitalIntel && (
                  <button
                    onClick={onOpenHospitalIntel}
                    className="px-3 py-1 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-cyan-500/50 text-cyan-400 font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>🧠 Hospital Intelligence (12 Layers)</span>
                  </button>
                )}
                {onOpenDispatcher && (
                  <button
                    onClick={onOpenDispatcher}
                    className="px-3 py-1 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-rose-500/50 text-rose-400 font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>📡 Dispatcher Board</span>
                  </button>
                )}
                {onOpenCitizenPortal && (
                  <button
                    onClick={onOpenCitizenPortal}
                    className="px-3 py-1 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 text-amber-400 font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>🗺️ Route Finder & Map</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 3. ULTRA-MINIMAL FOOTER */}
      <footer className="w-full border-t border-neutral-900 px-6 py-3 flex items-center justify-between text-[10px] text-neutral-600 uppercase">
        <span>Mysuru Emergency Services</span>
        <span className="flex items-center gap-1 text-emerald-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          108 / 112 READY
        </span>
      </footer>
    </div>
  );
};
