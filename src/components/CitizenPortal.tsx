import React, { useState, useEffect, useRef } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { EMERGENCY_CATEGORIES, MYSURU_LANDMARKS, EMERGENCY_PHARMACIES } from '../data/mysuruFacilities';
import { Hospital, EmergencyCategory, RoutingCandidate } from '../types';
import { GoogleMapView } from './GoogleMapView';
import { playTapBeep } from '../utils/audioAlert';
import {
  AlertCircle,
  HeartPulse,
  Brain,
  Baby,
  Car,
  ShieldAlert,
  Footprints,
  Activity,
  Ambulance,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle,
  XCircle,
  Navigation,
  Search,
  Building2,
  Bed,
  Stethoscope,
  Info,
  ExternalLink,
  ChevronRight,
  Flame,
} from 'lucide-react';

interface CitizenPortalProps {
  onOpenHospitalDetail: (hospital: Hospital) => void;
  onOpenAIExplanation: (candidate: RoutingCandidate) => void;
  onInspectIntelligence?: (hospital: Hospital) => void;
}

export const CitizenPortal: React.FC<CitizenPortalProps> = ({
  onOpenHospitalDetail,
  onOpenAIExplanation,
  onInspectIntelligence,
}) => {
  const {
    currentUser,
    userCoords,
    setUserCoords,
    triggerEmergencySOS,
    cancelEmergencySOS,
    activeCase,
    hospitals,
    ambulances,
    getHospitalEvaluation,
  } = useEmergency();

  // Selected emergency category (default to General / Polytrauma)
  const [selectedCategory, setSelectedCategory] = useState<string>('cardiac_stemi');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Multi-tap SOS engine state
  const [tapCount, setTapCount] = useState<number>(0);
  const [isCountingDown, setIsCountingDown] = useState<boolean>(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(3);
  const tapResetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Manual pickup address edit
  const [isEditingAddress, setIsEditingAddress] = useState<boolean>(false);
  const [customAddress, setCustomAddress] = useState<string>(userCoords.address);

  // Evaluate candidate hospitals based on current category & userCoords
  const mockCase = {
    id: 'preview_case',
    timestamp: new Date().toLocaleTimeString(),
    category: selectedCategory,
    urgency: 'CRITICAL' as const,
    pickupLocation: userCoords,
    status: 'PENDING' as const,
    auditLog: [],
  };

  const evaluationCandidates = getHospitalEvaluation(mockCase);
  const bestCandidate = evaluationCandidates.find((c) => c.isBest) || evaluationCandidates[0];
  const nearestCandidate = evaluationCandidates.find((c) => c.isNearest) || evaluationCandidates[0];

  // Handle Multi-Tap Rapid SOS Dispatch (3-4 rapid taps)
  const handleSosButtonClick = () => {
    // Play pitch-scaled beep
    const newCount = tapCount + 1;
    playTapBeep(600 + newCount * 120);
    setTapCount(newCount);

    if (tapResetTimerRef.current) {
      clearTimeout(tapResetTimerRef.current);
    }

    if (newCount >= 3) {
      // Trigger countdown sequence
      setTapCount(3);
      startDispatchCountdown();
    } else {
      // Reset tap counter after 1.8 seconds of inactivity
      tapResetTimerRef.current = setTimeout(() => {
        setTapCount(0);
      }, 1800);
    }
  };

  const startDispatchCountdown = () => {
    setIsCountingDown(true);
    setCountdownSeconds(3);

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    countdownIntervalRef.current = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current!);
          executeInstantDispatch();
          setIsCountingDown(false);
          setTapCount(0);
          return 0;
        }
        playTapBeep(850);
        return prev - 1;
      });
    }, 1000);
  };

  const cancelCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    setIsCountingDown(false);
    setTapCount(0);
  };

  const executeInstantDispatch = () => {
    triggerEmergencySOS({
      category: selectedCategory,
      pickupLocation: {
        lat: userCoords.lat,
        lng: userCoords.lng,
        address: userCoords.address,
      },
      patientName: currentUser?.role === 'CITIZEN' ? currentUser.fullName : 'Mysuru Citizen',
      patientPhone: currentUser?.role === 'CITIZEN' ? currentUser.phone : '+91 98450 12345',
      bloodGroup: currentUser?.role === 'CITIZEN' ? currentUser.bloodGroup : 'O+',
      notes: `Multi-tap Emergency triggered for ${selectedCategory}.`,
    });
  };

  // Find assigned ambulance & hospital if case is active
  const assignedAmbulance = activeCase?.assignedAmbulanceId
    ? ambulances.find((a) => a.id === activeCase.assignedAmbulanceId)
    : null;

  const assignedHospital = activeCase?.assignedHospitalId
    ? hospitals.find((h) => h.id === activeCase.assignedHospitalId)
    : bestCandidate?.hospital;

  // Filter hospitals for directory
  const filteredHospitals = hospitals.filter((h) => {
    const matchesSearch =
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.specialties.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'ALL' || h.type.toUpperCase() === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* 1. DISCLAIMER BANNER */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs shadow-sm">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Simulated Emergency System:</strong> In real emergencies across Mysuru & Karnataka, dial{' '}
            <strong className="text-white underline font-bold">108 (Ambulance)</strong> or{' '}
            <strong className="text-white underline font-bold">112 (National Emergency)</strong> immediately.
          </span>
        </div>
        <div className="hidden md:flex items-center gap-1 font-mono text-[11px] text-amber-400">
          <span>Mysuru Health Grid Connected</span>
        </div>
      </div>

      {/* 2. ACTIVE EMERGENCY CASE TRACKING BANNER (If SOS in progress) */}
      {activeCase && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-950/80 via-slate-900 to-slate-900 border-2 border-rose-600/80 p-5 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rose-900/50 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600"></span>
              </span>
              <div>
                <span className="text-xs font-mono font-bold text-rose-400">
                  INCIDENT {activeCase.id} • {activeCase.status}
                </span>
                <h3 className="text-lg font-extrabold text-white">
                  Active Emergency Sequence In Progress
                </h3>
              </div>
            </div>

            <button
              onClick={() => cancelEmergencySOS(activeCase.id, 'Citizen cancelled via dashboard')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 border border-slate-700 text-rose-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel Emergency Dispatch</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Assigned Ambulance */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <span className="flex items-center gap-1">
                  <Ambulance className="w-4 h-4 text-amber-400" /> Assigned Vehicle
                </span>
                <span className="font-mono text-amber-300 font-bold">
                  {assignedAmbulance ? assignedAmbulance.vehiclePlate : 'Dispatched'}
                </span>
              </div>
              <div className="text-sm font-bold text-slate-100">
                {assignedAmbulance ? assignedAmbulance.driverName : 'Mahesh K. (Paramedic Team)'}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Base: {assignedAmbulance?.baseStation || 'Suburban Bus Stand Post'}
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <a
                  href={`tel:${assignedAmbulance?.phone || '+919845012345'}`}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-xs font-bold text-center flex items-center justify-center gap-1 transition"
                >
                  <Phone className="w-3.5 h-3.5" /> Call Driver
                </a>
              </div>
            </div>

            {/* Target Destination Hospital */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <span className="flex items-center gap-1">
                  <Building2 className="w-4 h-4 text-emerald-400" /> Target Destination
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  CONFIRMED BED
                </span>
              </div>
              <div className="text-sm font-bold text-slate-100 truncate">
                {assignedHospital?.name}
              </div>
              <div className="text-xs text-slate-400 mt-0.5 truncate">
                {assignedHospital?.address}
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <a
                  href={`tel:${assignedHospital?.emergencyPhone}`}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-1 transition"
                >
                  <Phone className="w-3.5 h-3.5" /> Call ED Desk
                </a>
              </div>
            </div>

            {/* Pickup & Status Stepper */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" /> Incident Location
                </div>
                <div className="text-xs font-medium text-slate-200 line-clamp-2">
                  {activeCase.pickupLocation.address}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 mt-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Current Step:</span>
                  <span className="font-bold text-rose-300 font-mono">
                    {activeCase.statusStep === 1
                      ? '1/4 Ambulance En Route'
                      : activeCase.statusStep === 2
                      ? '2/4 Patient Boarding'
                      : activeCase.statusStep === 3
                      ? '3/4 In Transit to Hospital'
                      : 'Dispatch Initiated'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. HERO SOS ACTION CENTER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Multi-Tap SOS Button & Category Selection (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-6">
          {/* Header & Location bar */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-rose-400 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-500" /> Instant Emergency Dispatch
              </span>
              <span className="text-xs text-slate-400 font-mono">Mysuru Metro Grid</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Rapid Emergency Dispatch & Hospital Match
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Tap the Emergency button <strong className="text-rose-400">3 times rapidly</strong> for instant automated ambulance dispatch, or select an emergency category below.
            </p>
          </div>

          {/* Current Incident Location bar */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 text-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="truncate">
                <span className="text-[10px] text-slate-400 block">Incident Coordinates:</span>
                {isEditingAddress ? (
                  <input
                    type="text"
                    value={customAddress}
                    onChange={(e) => setCustomAddress(e.target.value)}
                    className="bg-slate-900 text-slate-100 text-xs px-2 py-0.5 rounded border border-slate-700 w-full"
                  />
                ) : (
                  <span className="font-semibold text-slate-200 truncate block">
                    {userCoords.address}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isEditingAddress ? (
                <button
                  onClick={() => {
                    setUserCoords({ ...userCoords, address: customAddress });
                    setIsEditingAddress(false);
                  }}
                  className="px-2 py-1 rounded bg-rose-600 text-white text-[11px] font-bold"
                >
                  Save
                </button>
              ) : (
                <button
                  onClick={() => setIsEditingAddress(true)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium"
                >
                  Edit Locality
                </button>
              )}

              {/* Landmark quick select */}
              <select
                onChange={(e) => {
                  const lm = MYSURU_LANDMARKS.find((l) => l.id === e.target.value);
                  if (lm) {
                    setUserCoords({
                      lat: lm.coordinates.lat,
                      lng: lm.coordinates.lng,
                      address: `${lm.name}, ${lm.address}`,
                    });
                    setCustomAddress(`${lm.name}, ${lm.address}`);
                  }
                }}
                className="bg-slate-900 border border-slate-700 text-slate-300 text-[11px] py-1 px-2 rounded"
              >
                <option value="">Mysuru Landmark Preset...</option>
                {MYSURU_LANDMARKS.map((lm) => (
                  <option key={lm.id} value={lm.id}>
                    {lm.name} ({lm.zone})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* PULSATING EMERGENCY SOS BUTTON & TAP COUNTER */}
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative flex items-center justify-center">
              {/* Outer Pulsing Waves */}
              <span className="animate-ping absolute h-48 w-48 rounded-full bg-rose-600 opacity-20"></span>
              <span className="animate-pulse absolute h-40 w-40 rounded-full bg-rose-500 opacity-30"></span>

              {/* Primary Interactive Button */}
              <button
                onClick={handleSosButtonClick}
                disabled={isCountingDown}
                className="relative z-10 flex flex-col items-center justify-center w-36 h-36 rounded-full bg-gradient-to-tr from-rose-700 via-rose-600 to-red-500 text-white shadow-2xl shadow-rose-900/80 border-4 border-rose-400/80 active:scale-95 transition-transform hover:shadow-rose-600/50 cursor-pointer"
              >
                <span className="text-xl font-black tracking-wider uppercase">Emergency</span>
                <span className="text-[10px] font-bold tracking-widest uppercase opacity-90 mt-0.5">
                  TAP RAPIDLY
                </span>
                <span className="text-[9px] font-mono text-rose-200 mt-1">
                  108 DISPATCH
                </span>
              </button>
            </div>

            {/* Tap Sequence Progress Indicator */}
            <div className="mt-4 flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`h-2.5 w-7 rounded-full transition-all duration-200 ${
                      tapCount >= step
                        ? 'bg-rose-500 shadow-md shadow-rose-500/50'
                        : 'bg-slate-800'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-slate-300">
                {tapCount === 0 && 'Tap Emergency 3 times rapidly for automatic dispatch'}
                {tapCount === 1 && 'Tap 2 more times to trigger auto-dispatch...'}
                {tapCount === 2 && 'Tap 1 more time now!'}
                {tapCount >= 3 && 'Multi-tap sequence confirmed!'}
              </span>
            </div>

            {/* Countdown Modal Overlay if countdown active */}
            {isCountingDown && (
              <div className="mt-3 p-3 rounded-xl bg-rose-950/90 border border-rose-500 text-center animate-in zoom-in-95 duration-150">
                <div className="text-xs font-bold text-rose-300 mb-1">
                  DISPATCHING IN {countdownSeconds} SECONDS...
                </div>
                <button
                  onClick={cancelCountdown}
                  className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
                >
                  Cancel Countdown
                </button>
              </div>
            )}
          </div>

          {/* EMERGENCY CATEGORY SELECTOR */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300">
                Select Medical Emergency Specialty:
              </span>
              <span className="text-[11px] text-cyan-400 font-mono">
                Determines Clinical Matching
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EMERGENCY_CATEGORIES.map((cat) => {
                const isSelected = cat.id === selectedCategory;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-rose-950/40 border-rose-500 text-white shadow-md'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs truncate">{cat.name}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{cat.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Deterministic Match Breakdown (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Clinical Readiness Engine
              </span>
              <span className="text-xs font-mono text-slate-400">Mysuru Triage</span>
            </div>
            <h3 className="text-lg font-extrabold text-white">
              Recommended vs. Nearest Evaluation
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Filters for on-duty specialists, active Cath Lab/OT, and available ICU beds.
            </p>
          </div>

          {/* Best Hospital Card */}
          {bestCandidate && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/40 to-slate-950 border border-emerald-500/50 shadow-lg">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  ★ RECOMMENDED BEST DESTINATION
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  Score: {bestCandidate.score} pts
                </span>
              </div>

              <h4 className="text-base font-bold text-slate-100 truncate">
                {bestCandidate.hospital.name}
              </h4>
              <p className="text-xs text-slate-400 line-clamp-1 mb-2">
                {bestCandidate.hospital.address}
              </p>

              <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-lg bg-slate-950/70 border border-slate-800/80 text-center mb-3">
                <div>
                  <span className="text-[10px] text-slate-500 block">Road Distance</span>
                  <strong className="text-xs font-mono text-slate-200">
                    {bestCandidate.distanceKm} km
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Estimated ETA</span>
                  <strong className="text-xs font-mono text-emerald-400">
                    ~{bestCandidate.etaMinutes} mins
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">ICU Beds</span>
                  <strong className="text-xs font-mono text-cyan-400">
                    {bestCandidate.hospital.icuBeds.available} free
                  </strong>
                </div>
              </div>

              <p className="text-xs text-slate-300 italic bg-emerald-950/30 p-2 rounded border border-emerald-900/50 mb-3">
                "{bestCandidate.explanation}"
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAIExplanation(bestCandidate)}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/40 border border-indigo-500/50 text-indigo-200 text-xs font-bold text-center flex items-center justify-center gap-1 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Clinical Rationale</span>
                </button>

                <button
                  onClick={() => onOpenHospitalDetail(bestCandidate.hospital)}
                  className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
                >
                  View Profile
                </button>
              </div>
            </div>
          )}

          {/* Nearest Hospital Alternative (If Different) */}
          {nearestCandidate && nearestCandidate.hospital.id !== bestCandidate?.hospital.id && (
            <div className="p-3 rounded-xl bg-slate-950/70 border border-amber-500/40 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-amber-400">
                  ⚠️ NEAREST ALTERNATIVE ({nearestCandidate.distanceKm} km)
                </span>
                <span className="text-slate-400">~{nearestCandidate.etaMinutes} mins</span>
              </div>
              <div className="font-semibold text-slate-200 truncate">
                {nearestCandidate.hospital.name}
              </div>
              <div className="text-[11px] text-rose-300">
                {nearestCandidate.ineligibilityReasons.length > 0 ? (
                  <span>
                    <strong>Why Bypassed:</strong> {nearestCandidate.ineligibilityReasons.join('; ')}
                  </span>
                ) : (
                  <span>Lower staff capacity score than optimal recommendation.</span>
                )}
              </div>
            </div>
          )}

          {/* Manual Immediate Dispatch Trigger */}
          <button
            onClick={() => {
              triggerEmergencySOS({
                category: selectedCategory,
                pickupLocation: userCoords,
                patientName: currentUser?.role === 'CITIZEN' ? currentUser.fullName : 'Mysuru Citizen',
              });
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 transition active:scale-98"
          >
            <Ambulance className="w-4 h-4" />
            <span>Confirm & Dispatch Ambulance Now</span>
          </button>
        </div>
      </div>

      {/* 4. LIVE INTERACTIVE GOOGLE MAP */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Navigation className="w-4 h-4 text-cyan-400" /> Live Interactive Radar & Google Map
            </h3>
            <p className="text-xs text-slate-400">
              Visualizes real-time ambulance positions, incident marker, and hospital readiness.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Center: Mysuru City</span>
        </div>

        <GoogleMapView
          userLocation={userCoords}
          userAddress={userCoords.address}
          hospitals={hospitals}
          ambulances={ambulances}
          bestHospitalId={bestCandidate?.hospital.id}
          nearestHospitalId={nearestCandidate?.hospital.id}
          onSelectHospital={(hosp) => onOpenHospitalDetail(hosp)}
          destinationLocation={bestCandidate?.hospital.coordinates}
          height="420px"
        />
      </div>

      {/* 5. SEARCHABLE DIRECTORY OF NEARBY HOSPITALS & 24/7 PHARMACIES */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              Mysuru Emergency Facilities & Bed Availability
            </h3>
            <p className="text-xs text-slate-400">
              Live seat counts, on-duty doctors, and direct telephone hotlines.
            </p>
          </div>

          {/* Search bar & Type filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search hospital or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-48 sm:w-64"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="py-1.5 px-2.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Ownership</option>
              <option value="GOVERNMENT">Government</option>
              <option value="PRIVATE">Private</option>
              <option value="TRUST">Trust / NGO</option>
            </select>
          </div>
        </div>

        {/* Hospital Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHospitals.map((hosp) => {
            const isBest = hosp.id === bestCandidate?.hospital.id;
            const isOperational = hosp.edOperational && hosp.status !== 'DIVERT';

            return (
              <div
                key={hosp.id}
                className={`flex flex-col justify-between p-4 rounded-xl border transition-all ${
                  isBest
                    ? 'bg-slate-950/90 border-emerald-500/60 shadow-lg shadow-emerald-950/20'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                        hosp.type === 'Government'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : hosp.type === 'Private'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {hosp.type}
                    </span>

                    <span
                      className={`text-[10px] font-bold flex items-center gap-1 ${
                        isOperational ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isOperational ? (
                        <>
                          <CheckCircle className="w-3 h-3" /> OPEN 24/7
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" /> DIVERT
                        </>
                      )}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-100 truncate mb-1">
                    {hosp.name}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-1 mb-3">
                    {hosp.address}
                  </p>

                  {/* Bed stats */}
                  <div className="grid grid-cols-3 gap-1.5 p-2 rounded-lg bg-slate-900 border border-slate-800/80 text-center mb-3">
                    <div>
                      <span className="text-[9px] text-slate-500 block">ICU</span>
                      <strong className="text-xs font-mono text-emerald-400">
                        {hosp.icuBeds.available}/{hosp.icuBeds.total}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block">General</span>
                      <strong className="text-xs font-mono text-slate-200">
                        {hosp.generalBeds.available}/{hosp.generalBeds.total}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block">Trauma</span>
                      <strong className="text-xs font-mono text-cyan-400">
                        {hosp.traumaBays.available}/{hosp.traumaBays.total}
                      </strong>
                    </div>
                  </div>

                  {/* Specialties snippet */}
                  <div className="text-[11px] text-slate-300 mb-3 space-y-1">
                    <div className="flex items-center gap-1 text-slate-400 text-[10px]">
                      <Stethoscope className="w-3 h-3 text-cyan-400" /> On-Duty Specialists:
                    </div>
                    <div className="text-slate-300 truncate">
                      {hosp.onDutySpecialists.length > 0
                        ? hosp.onDutySpecialists.join(', ')
                        : 'Emergency Residents on Duty'}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80">
                  <a
                    href={`tel:${hosp.emergencyPhone}`}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold text-center flex items-center justify-center gap-1 transition"
                  >
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>Call ED</span>
                  </a>

                  <button
                    onClick={() => onOpenHospitalDetail(hosp)}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold text-center flex items-center justify-center gap-1 transition"
                  >
                    <Info className="w-3 h-3" />
                    <span>Details</span>
                  </button>

                  {onInspectIntelligence && (
                    <button
                      onClick={() => onInspectIntelligence(hosp)}
                      className="w-full py-1 px-2 rounded bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/80 text-cyan-300 font-mono text-[10px] font-bold uppercase transition text-center"
                    >
                      [ INSPECT 12-LAYER INTELLIGENCE ]
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 24/7 PHARMACIES DIRECTORY */}
        <div className="pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" /> Verified 24/7 Emergency Pharmacies in Mysuru
            </h4>
            <span className="text-[11px] text-slate-400 font-mono">Night Open Guaranteed</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {EMERGENCY_PHARMACIES.map((ph) => (
              <div
                key={ph.id}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs flex items-center justify-between gap-2"
              >
                <div>
                  <strong className="text-slate-200 block truncate">{ph.name}</strong>
                  <span className="text-slate-400 text-[11px] block truncate">{ph.address}</span>
                </div>
                <a
                  href={`tel:${ph.phone}`}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 shrink-0"
                  title="Call Pharmacy"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
