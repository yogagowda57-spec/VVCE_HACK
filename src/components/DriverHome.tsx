import React, { useState, useEffect } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { Ambulance, EmergencyCase, Hospital } from '../types';
import { GoogleMapView } from './GoogleMapView';
import { playSuccessChime, playEmergencySirenAlert } from '../utils/audioAlert';
import {
  Ambulance as AmbulanceIcon,
  Navigation,
  Phone,
  MapPin,
  Clock,
  Shield,
  Radio,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  LogOut,
  User,
  Power,
  Hospital as HospitalIcon,
  ArrowRight,
  Activity,
  X,
} from 'lucide-react';

export const DriverHome: React.FC = () => {
  const {
    currentUser,
    logout,
    ambulances,
    updateAmbulanceStatus,
    incomingAlert,
    dismissIncomingAlert,
    cases,
    updateCaseStatus,
    hospitals,
    userCoords,
    getHospitalEvaluation,
  } = useEmergency();

  // Find logged-in driver's ambulance or default
  const myAmbulance: Ambulance =
    ambulances.find(
      (a) =>
        currentUser &&
        'vehiclePlate' in currentUser &&
        a.vehiclePlate === currentUser.vehiclePlate
    ) || ambulances[0];

  const [isOnline, setIsOnline] = useState<boolean>(myAmbulance?.status !== 'OFF_DUTY');
  const [activeIncident, setActiveIncident] = useState<EmergencyCase | null>(null);
  const [showInvasiveAlert, setShowInvasiveAlert] = useState<boolean>(false);
  const [recommendedHospital, setRecommendedHospital] = useState<Hospital | null>(null);

  // Sync with incoming broadcast alerts
  useEffect(() => {
    if (incomingAlert) {
      setActiveIncident(incomingAlert);
      setShowInvasiveAlert(true);
      playEmergencySirenAlert();

      // Find recommended hospital for this case
      const candidates = getHospitalEvaluation(incomingAlert);
      const best = candidates.find((c) => c.isBest) || candidates[0];
      if (best) {
        setRecommendedHospital(best.hospital);
      }
    }
  }, [incomingAlert, getHospitalEvaluation]);

  // Also check existing active cases assigned to this ambulance
  useEffect(() => {
    const assigned = cases.find(
      (c) =>
        c.assignedAmbulanceId === myAmbulance.id &&
        (c.status === 'DISPATCHED' || c.status === 'IN_TRANSIT')
    );
    if (assigned && !activeIncident) {
      setActiveIncident(assigned);
      const candidates = getHospitalEvaluation(assigned);
      const best = candidates.find((c) => c.isBest) || candidates[0];
      if (best) setRecommendedHospital(best.hospital);
    }
  }, [cases, myAmbulance.id, activeIncident, getHospitalEvaluation]);

  // Toggle Online/Offline duty
  const handleToggleDuty = () => {
    const nextStatus: Ambulance['status'] = isOnline ? 'OFF_DUTY' : 'AVAILABLE';
    setIsOnline(!isOnline);
    updateAmbulanceStatus(myAmbulance.id, nextStatus);
  };

  // Step Status Flow
  const handleAdvanceStep = () => {
    if (!activeIncident) return;
    const currentStep = activeIncident.statusStep || 1;
    const nextStep = currentStep + 1;

    let nextCaseStatus: EmergencyCase['status'] = 'IN_TRANSIT';
    let nextAmbStatus: Ambulance['status'] = 'EN_ROUTE_PICKUP';

    if (nextStep === 2) {
      nextAmbStatus = 'EN_ROUTE_PICKUP';
    } else if (nextStep === 3) {
      nextAmbStatus = 'PATIENT_LOADED';
    } else if (nextStep === 4) {
      nextAmbStatus = 'EN_ROUTE_HOSPITAL';
    } else if (nextStep >= 5) {
      nextCaseStatus = 'RESOLVED';
      nextAmbStatus = 'AVAILABLE';
      playSuccessChime();
      setActiveIncident(null);
      setShowInvasiveAlert(false);
    }

    updateCaseStatus(activeIncident.id, nextCaseStatus, nextStep, myAmbulance.driverName);
    updateAmbulanceStatus(myAmbulance.id, nextAmbStatus);
  };

  // Google Maps Deep-Link Direction URL
  const getGoogleMapsRouteUrl = (destLat: number, destLng: number) => {
    return `https://www.google.com/maps/dir/?api=1&origin=${myAmbulance.currentLocation.lat},${myAmbulance.currentLocation.lng}&destination=${destLat},${destLng}`;
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-mono selection:bg-amber-500 selection:text-black">
      {/* 1. DRIVER HUD HEADER */}
      <header className="border-b border-neutral-900 bg-neutral-950/90 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-neutral-900 border border-neutral-700 flex items-center justify-center font-bold text-amber-400 text-xs">
            <AmbulanceIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase text-white">
                {myAmbulance.vehiclePlate}
              </span>
              <span className="text-[10px] text-neutral-400">
                ({myAmbulance.driverName})
              </span>
            </div>
            <span className="text-[10px] text-neutral-500 flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5 text-cyan-400" />
              Base: {myAmbulance.baseStation}
            </span>
          </div>
        </div>

        {/* Duty Toggle & Logout */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleDuty}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs uppercase font-bold border transition cursor-pointer ${
              isOnline
                ? 'bg-emerald-950 text-emerald-300 border-emerald-700 hover:bg-emerald-900'
                : 'bg-neutral-900 text-neutral-500 border-neutral-800 hover:text-white'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{isOnline ? 'ONLINE: READY' : 'OFF DUTY'}</span>
          </button>

          <button
            onClick={logout}
            className="flex items-center gap-1 px-3 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white text-xs uppercase transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>[ Exit ]</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN MAP-CENTRIC HUD */}
      <main className="flex-1 flex flex-col md:flex-row relative">
        {/* Map View Area */}
        <div className="flex-1 h-[55vh] md:h-auto relative">
          <GoogleMapView
            userLocation={myAmbulance.currentLocation}
            userAddress={myAmbulance.baseStation}
            hospitals={hospitals}
            ambulances={ambulances}
            destinationLocation={
              activeIncident
                ? {
                    lat: activeIncident.pickupLocation.lat,
                    lng: activeIncident.pickupLocation.lng,
                  }
                : undefined
            }
            height="100%"
          />
        </div>

        {/* 3. SIDE PANEL: ACTIVE MISSION CONTROLLER */}
        <div className="w-full md:w-96 border-t md:border-t-0 md:border-l border-neutral-800 bg-neutral-950 p-5 space-y-4 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <span className="text-xs font-bold uppercase text-neutral-300 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Mission Control HUD</span>
            </span>
            <span
              className={`text-[9px] px-2 py-0.5 font-bold uppercase border ${
                myAmbulance.status === 'AVAILABLE'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  : 'bg-amber-950 text-amber-300 border-amber-800 animate-pulse'
              }`}
            >
              {myAmbulance.status}
            </span>
          </div>

          {activeIncident ? (
            <div className="space-y-4 text-xs">
              {/* Patient Identity Block (Strict dynamic logic: Name+Phone if logged in, only Address if anonymous) */}
              <div className="p-3 bg-black border border-neutral-800 space-y-2">
                <span className="text-[10px] text-neutral-500 uppercase block font-bold">
                  Patient Caller Dossier:
                </span>

                {activeIncident.patientName ? (
                  /* Logged-In Patient */
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">
                        {activeIncident.patientName}
                      </span>
                      {activeIncident.bloodGroup && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-rose-950 text-rose-300 border border-rose-800">
                          {activeIncident.bloodGroup}
                        </span>
                      )}
                    </div>
                    {activeIncident.patientPhone && (
                      <a
                        href={`tel:${activeIncident.patientPhone}`}
                        className="flex items-center gap-1.5 text-cyan-400 hover:underline pt-0.5"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{activeIncident.patientPhone}</span>
                      </a>
                    )}
                  </div>
                ) : (
                  /* Anonymous Emergency */
                  <div className="space-y-1">
                    <span className="font-bold text-amber-400 block uppercase">
                      [ Anonymous Citizen Emergency ]
                    </span>
                    <p className="text-[11px] text-neutral-400">
                      Dispatched without user account. Identity withheld.
                    </p>
                  </div>
                )}

                {/* Pickup Location */}
                <div className="pt-2 border-t border-neutral-900 text-neutral-300">
                  <span className="text-[10px] text-neutral-500 block">Incident Location:</span>
                  <div className="font-bold text-white flex items-start gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span>{activeIncident.pickupLocation.address}</span>
                  </div>
                </div>

                <div className="text-[10px] text-neutral-500">
                  Timestamp: {activeIncident.timestamp} • Priority: {activeIncident.urgency}
                </div>
              </div>

              {/* Recommended Hospital Destination */}
              {recommendedHospital && (
                <div className="p-3 bg-neutral-900 border border-neutral-800 space-y-1">
                  <span className="text-[10px] text-neutral-500 uppercase block">
                    Recommended Triage Hospital:
                  </span>
                  <div className="font-bold text-white text-sm flex items-center gap-1.5">
                    <HospitalIcon className="w-4 h-4 text-emerald-400" />
                    <span>{recommendedHospital.name}</span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    {recommendedHospital.address}
                  </p>
                  <div className="pt-1 flex items-center gap-3 text-[10px] text-neutral-400">
                    <span>ICU Free: {recommendedHospital.icuBeds.available}</span>
                    <span>ED: {recommendedHospital.status}</span>
                  </div>
                </div>
              )}

              {/* Status Action Stepper */}
              <div className="space-y-2 pt-2 border-t border-neutral-800">
                <span className="text-[10px] text-neutral-500 uppercase block">
                  Actionable Mission Stepper:
                </span>

                <div className="grid grid-cols-4 gap-1 text-[9px] text-center uppercase font-bold">
                  {['DISPATCHED', 'EN ROUTE', 'LOADED', 'DELIVERED'].map((st, i) => (
                    <div
                      key={st}
                      className={`p-1 border ${
                        (activeIncident.statusStep || 1) >= i + 1
                          ? 'bg-amber-400 text-black border-amber-400'
                          : 'bg-neutral-900 text-neutral-600 border-neutral-800'
                      }`}
                    >
                      {st}
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleAdvanceStep}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition border border-amber-400 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Advance Status (Step {(activeIncident.statusStep || 1) + 1})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Get Directions Native Button */}
              <a
                href={getGoogleMapsRouteUrl(
                  activeIncident.pickupLocation.lat,
                  activeIncident.pickupLocation.lng
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-bold text-xs uppercase flex items-center justify-center gap-2 transition"
              >
                <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                <span>[ Launch Turn-By-Turn Navigation ]</span>
                <ExternalLink className="w-3 h-3 text-neutral-500" />
              </a>
            </div>
          ) : (
            <div className="p-8 text-center text-neutral-500 space-y-2 border border-neutral-900">
              <Radio className="w-6 h-6 mx-auto text-neutral-600 animate-pulse" />
              <p className="text-xs uppercase font-bold">Awaiting Dispatch Call</p>
              <p className="text-[11px] text-neutral-600">
                Ambulance is standby online. Real-time emergency triggers across Mysuru will ring here instantly.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* 4. INVASIVE ALERT NOTIFICATION POPUP (Triggered via BroadcastChannel SOS) */}
      {showInvasiveAlert && activeIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-neutral-950 border-4 border-rose-600 shadow-2xl p-6 space-y-5 text-white font-mono animate-bounce-once">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-rose-900 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping"></span>
                <h2 className="text-sm font-black uppercase tracking-widest text-rose-500">
                  INCOMING EMERGENCY BROADCAST
                </h2>
              </div>
              <span className="text-xs bg-rose-950 border border-rose-800 px-2 py-0.5 text-rose-300 font-bold">
                {activeIncident.timestamp}
              </span>
            </div>

            {/* Dynamic Patient Info */}
            <div className="p-4 bg-black border border-neutral-800 space-y-3 text-xs">
              {activeIncident.patientName ? (
                /* Logged-In Citizen */
                <div className="space-y-1">
                  <span className="text-[10px] text-neutral-400 uppercase block font-bold">
                    Caller Name:
                  </span>
                  <div className="text-base font-bold text-white flex items-center justify-between">
                    <span>{activeIncident.patientName}</span>
                    {activeIncident.bloodGroup && (
                      <span className="text-xs px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-800">
                        Blood: {activeIncident.bloodGroup}
                      </span>
                    )}
                  </div>
                  {activeIncident.patientPhone && (
                    <div className="text-cyan-400 font-bold flex items-center gap-1.5 pt-1">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{activeIncident.patientPhone}</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Anonymous Emergency */
                <div className="space-y-1">
                  <span className="text-[10px] text-neutral-400 uppercase block font-bold">
                    Caller Identity:
                  </span>
                  <div className="text-base font-bold text-amber-400 uppercase">
                    ANONYMOUS CALLER (NO ACCOUNT)
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Location captured via GPS coordinates only.
                  </p>
                </div>
              )}

              {/* Location */}
              <div className="pt-2 border-t border-neutral-900">
                <span className="text-[10px] text-neutral-400 uppercase block">
                  Incident Pickup Address:
                </span>
                <p className="text-xs font-bold text-white mt-0.5">
                  {activeIncident.pickupLocation.address}
                </p>
              </div>
            </div>

            {/* Prominent [ Get Directions ] Action */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <a
                href={getGoogleMapsRouteUrl(
                  activeIncident.pickupLocation.lat,
                  activeIncident.pickupLocation.lng
                )}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  setShowInvasiveAlert(false);
                  dismissIncomingAlert();
                  updateCaseStatus(activeIncident.id, 'DISPATCHED', 1, myAmbulance.driverName);
                  updateAmbulanceStatus(myAmbulance.id, 'EN_ROUTE_PICKUP');
                }}
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition border border-emerald-400 shadow-xl"
              >
                <Navigation className="w-4 h-4" />
                <span>[ Get Directions ]</span>
              </a>

              <button
                onClick={() => {
                  setShowInvasiveAlert(false);
                  dismissIncomingAlert();
                }}
                className="py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold text-xs uppercase transition border border-neutral-700"
              >
                Dismiss Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
