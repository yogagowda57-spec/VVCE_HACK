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
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  ShieldAlert,
  Clock,
  ArrowRight,
  Radio,
  Check,
  Building2,
  User,
  HeartPulse,
} from 'lucide-react';

export const DriverPortal: React.FC = () => {
  const {
    currentUser,
    ambulances,
    cases,
    hospitals,
    incomingAlert,
    dismissIncomingAlert,
    updateCaseStatus,
    updateAmbulanceStatus,
    simulationState,
    toggleSimulationRoadBlockage,
  } = useEmergency();

  // Find this driver's ambulance
  const myAmbulance =
    currentUser?.role === 'DRIVER'
      ? ambulances.find((a) => a.id === currentUser.ambulanceId) || ambulances[0]
      : ambulances[0];

  const [isOnline, setIsOnline] = useState<boolean>(myAmbulance?.status !== 'OFF_DUTY');

  // Find active case for this ambulance
  const activeCase = cases.find(
    (c) =>
      c.assignedAmbulanceId === myAmbulance?.id &&
      c.status !== 'RESOLVED' &&
      c.status !== 'CANCELLED'
  );

  // Target hospital for active case
  const targetHospital = activeCase?.assignedHospitalId
    ? hospitals.find((h) => h.id === activeCase.assignedHospitalId)
    : hospitals[0];

  // Online / Offline toggle
  const toggleOnlineStatus = () => {
    const nextOnline = !isOnline;
    setIsOnline(nextOnline);
    updateAmbulanceStatus(
      myAmbulance.id,
      nextOnline ? 'AVAILABLE' : 'OFF_DUTY'
    );
  };

  // Step names for stepper
  // Step 1: Dispatched / Accepted
  // Step 2: En Route to Patient Pickup
  // Step 3: Patient Boarded / Loaded
  // Step 4: En Route to Hospital
  // Step 5: Handover Complete / Resolved
  const currentStep = activeCase ? activeCase.statusStep || 1 : 0;

  const handleNextStep = () => {
    if (!activeCase) return;
    playSuccessChime();

    if (currentStep === 1) {
      // Advance to En Route to Pickup
      updateCaseStatus(activeCase.id, 'DISPATCHED', 2, myAmbulance.driverName, 'Ambulance en route to patient pickup location.');
      updateAmbulanceStatus(myAmbulance.id, 'EN_ROUTE_PICKUP');
    } else if (currentStep === 2) {
      // Advance to Patient Loaded
      updateCaseStatus(activeCase.id, 'IN_TRANSIT', 3, myAmbulance.driverName, 'Patient boarded. Paramedic vitals assessment underway.');
      updateAmbulanceStatus(myAmbulance.id, 'PATIENT_LOADED');
    } else if (currentStep === 3) {
      // Advance to En Route to Hospital
      updateCaseStatus(activeCase.id, 'IN_TRANSIT', 4, myAmbulance.driverName, `En route to ${targetHospital?.name || 'hospital'}.`);
      updateAmbulanceStatus(myAmbulance.id, 'EN_ROUTE_HOSPITAL');
    } else if (currentStep === 4) {
      // Handover complete!
      updateCaseStatus(activeCase.id, 'RESOLVED', 5, myAmbulance.driverName, 'Patient safely handed over to Emergency Department triage team.');
      updateAmbulanceStatus(myAmbulance.id, 'AVAILABLE');
    }
  };

  // Turn-by-Turn deep links
  const pickupMapsUrl = activeCase
    ? `https://www.google.com/maps/dir/?api=1&origin=${myAmbulance.currentLocation.lat},${myAmbulance.currentLocation.lng}&destination=${activeCase.pickupLocation.lat},${activeCase.pickupLocation.lng}`
    : '#';

  const hospitalMapsUrl = activeCase && targetHospital
    ? `https://www.google.com/maps/dir/?api=1&origin=${activeCase.pickupLocation.lat},${activeCase.pickupLocation.lng}&destination=${targetHospital.coordinates.lat},${targetHospital.coordinates.lng}`
    : '#';

  return (
    <div className="space-y-6">
      {/* 1. INCOMING EMERGENCY BROADCAST MODAL ALERT */}
      {incomingAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in zoom-in-95 duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border-2 border-rose-500 shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-rose-900/60 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600"></span>
                </span>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-rose-400 block font-bold">
                    108 PRIORITY BROADCAST
                  </span>
                  <h3 className="text-lg font-black text-white">
                    Emergency Dispatch Alert: {incomingAlert.id}
                  </h3>
                </div>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {incomingAlert.timestamp}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Category:</span>
                <span className="font-bold text-rose-400 uppercase tracking-wide">
                  {incomingAlert.category.replace('_', ' ')}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Patient:</span>
                <span className="font-semibold text-slate-200">
                  {incomingAlert.patientName || 'Citizen User'} ({incomingAlert.bloodGroup || 'Blood Group N/A'})
                </span>
              </div>

              <div className="pt-2 border-t border-slate-900 text-xs">
                <span className="text-slate-400 block mb-0.5">Pickup Address:</span>
                <span className="font-semibold text-slate-100 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  {incomingAlert.pickupLocation.address}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  dismissIncomingAlert();
                  playSuccessChime();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 transition active:scale-98"
              >
                <Check className="w-4 h-4" />
                <span>Accept Incident Dispatch</span>
              </button>

              <button
                onClick={dismissIncomingAlert}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition"
              >
                Dismiss Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. DRIVER STATUS & TELEMATICS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <AmbulanceIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">{myAmbulance.vehiclePlate}</h2>
              <span className="text-xs text-slate-400 font-medium">({myAmbulance.driverName})</span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-cyan-400" />
              <span>Base Station: {myAmbulance.baseStation}</span>
            </p>
          </div>
        </div>

        {/* Online Toggle & Status Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            <span className="text-slate-400">Fleet Status:</span>
            <span
              className={`font-bold font-mono ${
                myAmbulance.status === 'AVAILABLE'
                  ? 'text-emerald-400'
                  : myAmbulance.status === 'OFF_DUTY'
                  ? 'text-slate-500'
                  : 'text-amber-400'
              }`}
            >
              {myAmbulance.status}
            </span>
          </div>

          <button
            onClick={toggleOnlineStatus}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow ${
              isOnline
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isOnline ? 'animate-pulse' : ''}`} />
            <span>{isOnline ? 'ONLINE ON PATROL' : 'OFF DUTY'}</span>
          </button>
        </div>
      </div>

      {/* 3. ACTIVE CASE COCKPIT HUD (If Case in Progress) */}
      {activeCase ? (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/50 shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 animate-pulse text-rose-500" /> ACTIVE DISPATCH HUD • {activeCase.id}
              </span>
              <h3 className="text-xl font-black text-white mt-0.5">
                {activeCase.category.replace('_', ' ').toUpperCase()} EMERGENCY
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {/* Report Route Blocked toggle */}
              <button
                onClick={toggleSimulationRoadBlockage}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                  simulationState.roadBlockages.length > 0
                    ? 'bg-rose-900/60 border-rose-500 text-rose-200'
                    : 'bg-slate-800 hover:bg-rose-950/40 border-slate-700 text-slate-300'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {simulationState.roadBlockages.length > 0
                    ? 'Route Blockage Reported (Active Bypass)'
                    : 'Report Route Blocked'}
                </span>
              </button>
            </div>
          </div>

          {/* DUAL-LEG NAVIGATION CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Leg 1: Ambulance -> Patient Pickup */}
            <div
              className={`p-4 rounded-xl border transition ${
                currentStep <= 2
                  ? 'bg-rose-950/20 border-rose-500/70 shadow-lg'
                  : 'bg-slate-950/40 border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> LEG 1: TO PATIENT PICKUP
                </span>
                <span className="font-mono text-slate-400">
                  {currentStep > 2 ? 'COMPLETED' : 'IN PROGRESS'}
                </span>
              </div>

              <div className="text-sm font-bold text-slate-100 mb-1">
                {activeCase.pickupLocation.address}
              </div>
              <div className="text-xs text-slate-400 mb-3 flex items-center gap-2">
                <span>Patient: {activeCase.patientName}</span>
                <span>•</span>
                <span>Blood: {activeCase.bloodGroup}</span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`tel:${activeCase.patientPhone}`}
                  className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold text-center flex items-center justify-center gap-1 transition"
                >
                  <Phone className="w-3.5 h-3.5 text-rose-400" /> Call Patient
                </a>

                <a
                  href={pickupMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold text-center flex items-center justify-center gap-1 transition shadow"
                >
                  <Navigation className="w-3.5 h-3.5" /> Navigate via Maps
                </a>
              </div>
            </div>

            {/* Leg 2: Patient -> Matched Hospital */}
            <div
              className={`p-4 rounded-xl border transition ${
                currentStep >= 3
                  ? 'bg-emerald-950/20 border-emerald-500/70 shadow-lg'
                  : 'bg-slate-950/40 border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" /> LEG 2: TO DESTINATION HOSPITAL
                </span>
                <span className="font-mono text-slate-400">
                  {currentStep >= 4 ? 'EN ROUTE' : 'QUEUED'}
                </span>
              </div>

              <div className="text-sm font-bold text-slate-100 mb-1 truncate">
                {targetHospital?.name}
              </div>
              <div className="text-xs text-slate-400 mb-3 truncate">
                {targetHospital?.address}
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`tel:${targetHospital?.emergencyPhone}`}
                  className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold text-center flex items-center justify-center gap-1 transition"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" /> Call Hospital Bay
                </a>

                <a
                  href={hospitalMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold text-center flex items-center justify-center gap-1 transition shadow"
                >
                  <Navigation className="w-3.5 h-3.5" /> Launch Hospital Route
                </a>
              </div>
            </div>
          </div>

          {/* ACTIONABLE STATUS STEPPER */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-xs font-bold text-slate-300 mb-3 flex items-center justify-between">
              <span>Mission Phase Progress:</span>
              <span className="font-mono text-cyan-400">Step {currentStep} of 4</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              <div
                className={`p-2 rounded-lg border text-xs text-center ${
                  currentStep >= 1
                    ? 'bg-slate-900 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-600'
                }`}
              >
                1. Accepted & Dispatched
              </div>
              <div
                className={`p-2 rounded-lg border text-xs text-center ${
                  currentStep >= 2
                    ? 'bg-slate-900 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-600'
                }`}
              >
                2. En Route to Patient
              </div>
              <div
                className={`p-2 rounded-lg border text-xs text-center ${
                  currentStep >= 3
                    ? 'bg-slate-900 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-600'
                }`}
              >
                3. Patient Picked Up
              </div>
              <div
                className={`p-2 rounded-lg border text-xs text-center ${
                  currentStep >= 4
                    ? 'bg-slate-900 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-600'
                }`}
              >
                4. En Route to Hospital
              </div>
            </div>

            {/* Next Action Button */}
            <button
              onClick={handleNextStep}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 transition active:scale-98"
            >
              <span>
                {currentStep === 1 && 'Advance: Depart & Go En Route to Patient'}
                {currentStep === 2 && 'Advance: Arrived at Scene (Patient Boarded)'}
                {currentStep === 3 && 'Advance: Depart for Destination Hospital'}
                {currentStep === 4 && 'Complete Handover: Transfer Patient to Emergency Dept'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Standby Cockpit View */
        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-base font-bold text-slate-100">Ambulance On Active Standby</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Vehicle <strong className="text-slate-200">{myAmbulance.vehiclePlate}</strong> is registered and listening on the Mysuru 108 Emergency channel. Any incoming emergency broadcast will appear here with an instant audio-visual siren.
          </p>
        </div>
      )}

      {/* 4. DRIVER LIVE MAP VIEW */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Navigation className="w-4 h-4 text-amber-400" /> Tactical Dispatch Radar
          </h3>
          <span className="text-xs font-mono text-slate-400">Station: {myAmbulance.baseStation}</span>
        </div>

        <GoogleMapView
          userLocation={activeCase ? activeCase.pickupLocation : myAmbulance.currentLocation}
          userAddress={activeCase ? activeCase.pickupLocation.address : 'Base Station'}
          hospitals={hospitals}
          ambulances={[myAmbulance]}
          bestHospitalId={targetHospital?.id}
          destinationLocation={targetHospital?.coordinates}
          ambulanceLocation={myAmbulance.currentLocation}
          height="380px"
        />
      </div>
    </div>
  );
};
