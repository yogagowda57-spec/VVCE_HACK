import React, { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { Hospital, BedCategory } from '../types';
import { HospitalIntelligenceProfile } from './HospitalIntelligenceProfile';
import {
  Building2,
  Bed,
  Stethoscope,
  Activity,
  Plus,
  Minus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  LogOut,
  Phone,
  MapPin,
  RefreshCw,
  Power,
  ShieldCheck,
  Brain,
} from 'lucide-react';

export const HospitalHome: React.FC = () => {
  const {
    currentUser,
    logout,
    hospitals,
    updateHospitalBeds,
    toggleHospitalDoctor,
    toggleHospitalEquipment,
    toggleHospitalStatus,
  } = useEmergency();

  // Find admin's assigned hospital or first
  const defaultHospitalId =
    currentUser && 'hospitalId' in currentUser
      ? currentUser.hospitalId
      : hospitals[0]?.id || 'MYS-HOSP-01';

  const [selectedHospId, setSelectedHospId] = useState<string>(defaultHospitalId);
  const [showIntelligenceDossier, setShowIntelligenceDossier] = useState<boolean>(false);

  const currentHospital: Hospital =
    hospitals.find((h) => h.id === selectedHospId) || hospitals[0];

  if (showIntelligenceDossier) {
    return (
      <HospitalIntelligenceProfile
        initialHospitalId={currentHospital.id}
        onBackToMain={() => setShowIntelligenceDossier(false)}
      />
    );
  }

  const handleBedStep = (
    key: 'icuBeds' | 'traumaBays' | 'maternityBeds' | 'generalBeds',
    delta: number
  ) => {
    const currentCategory = currentHospital[key];
    const newAvailable = Math.max(
      0,
      Math.min(currentCategory.total, currentCategory.available + delta)
    );
    const newOccupied = currentCategory.total - newAvailable;

    updateHospitalBeds(currentHospital.id, key, {
      total: currentCategory.total,
      occupied: newOccupied,
      available: newAvailable,
    });
  };

  const handleToggleMasterStatus = () => {
    const nextStatus = currentHospital.status === 'ACCEPTING' ? 'DIVERT' : 'ACCEPTING';
    toggleHospitalStatus(currentHospital.id, nextStatus);
  };

  const doctorList = [
    'Cardiologist',
    'Trauma Surgeon',
    'Obstetrician & Gynecologist',
    'Neurologist',
    'Senior Pediatrician',
    'Emergency Physician',
  ];

  const equipmentList = [
    'Cath Lab',
    'CT Scanner',
    'MRI',
    'Blood Bank 24/7',
    'Ventilator',
    'Trauma OT',
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-mono selection:bg-emerald-500 selection:text-black">
      {/* 1. TOP HEADER */}
      <header className="border-b border-neutral-900 bg-neutral-950/90 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-neutral-900 border border-neutral-700 flex items-center justify-center font-bold text-emerald-400 text-xs">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase text-white">
                {currentHospital.name}
              </span>
              <span className="text-[10px] text-neutral-400 uppercase">
                [{currentHospital.type}]
              </span>
            </div>
            <span className="text-[10px] text-neutral-500 flex items-center gap-1">
              <Phone className="w-2.5 h-2.5 text-cyan-400" />
              Hotline: {currentHospital.emergencyPhone}
            </span>
          </div>
        </div>

        {/* Facility Selector & Logout */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowIntelligenceDossier(true)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/80 text-cyan-300 font-bold text-xs uppercase transition shadow cursor-pointer"
            title="Inspect 12-Layer Infrastructure & AI Risk Profile"
          >
            <Brain className="w-3.5 h-3.5 text-cyan-400" />
            <span>[ 🧠 12-Layer Intel ]</span>
          </button>

          <select
            value={selectedHospId}
            onChange={(e) => setSelectedHospId(e.target.value)}
            className="px-2.5 py-1 text-xs bg-neutral-900 border border-neutral-700 text-neutral-200 uppercase font-mono focus:outline-none"
          >
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} ({h.type})
              </option>
            ))}
          </select>

          <button
            onClick={logout}
            className="flex items-center gap-1 px-3 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white text-xs uppercase transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>[ Exit ]</span>
          </button>
        </div>
      </header>

      {/* 2. MASTER EMERGENCY STATUS TOGGLE */}
      <section className="border-b border-neutral-900 bg-neutral-950 p-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest block">
              Emergency Department Gate Status
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`w-3 h-3 rounded-full ${
                  currentHospital.status === 'ACCEPTING'
                    ? 'bg-emerald-500 animate-ping'
                    : 'bg-rose-500'
                }`}
              />
              <span className="font-black text-sm uppercase text-white">
                {currentHospital.status === 'ACCEPTING'
                  ? 'ACCEPTING ALL 108 AMBULANCES'
                  : 'ED ON DIVERT STATUS (CRITICAL LOCKOUT)'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Updates made here instantly affect the live Hospital Intelligence Dossier and matching engine.
            </p>
          </div>

          <button
            onClick={handleToggleMasterStatus}
            className={`px-5 py-2.5 font-bold text-xs uppercase tracking-wider transition border flex items-center gap-2 cursor-pointer ${
              currentHospital.status === 'ACCEPTING'
                ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>
              {currentHospital.status === 'ACCEPTING'
                ? '[ SWITCH TO ED DIVERT ]'
                : '[ RE-OPEN ACCEPTING STATUS ]'}
            </span>
          </button>
        </div>
      </section>

      {/* 3. INVENTORY CONTROLS (BED STEPPERS + DOCTORS + EQUIPMENT) */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* A. ICON-DRIVEN BED CAPACITY STEPPERS (+ / -) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <h3 className="text-xs font-bold uppercase text-neutral-300 flex items-center gap-1.5">
              <Bed className="w-4 h-4 text-emerald-400" />
              <span>Real-Time Bed Inventory Steppers (+ / -)</span>
            </h3>
            <span className="text-[10px] text-neutral-500 uppercase">
              LIVE MUTATION ENGINE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* ICU Beds */}
            <div className="p-4 bg-neutral-950 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">ICU Beds</span>
                <span className="text-[10px] text-neutral-500">
                  Total: {currentHospital.icuBeds.total}
                </span>
              </div>
              <div className="text-3xl font-black text-emerald-400">
                {currentHospital.icuBeds.available}
                <span className="text-xs font-normal text-neutral-500 ml-1">AVAILABLE</span>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-neutral-900">
                <button
                  onClick={() => handleBedStep('icuBeds', -1)}
                  disabled={currentHospital.icuBeds.available <= 0}
                  className="flex-1 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 border border-neutral-700 flex items-center justify-center text-xs font-bold transition"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleBedStep('icuBeds', 1)}
                  disabled={currentHospital.icuBeds.available >= currentHospital.icuBeds.total}
                  className="flex-1 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 border border-neutral-700 flex items-center justify-center text-xs font-bold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Trauma Bays */}
            <div className="p-4 bg-neutral-950 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">Trauma Bays</span>
                <span className="text-[10px] text-neutral-500">
                  Total: {currentHospital.traumaBays.total}
                </span>
              </div>
              <div className="text-3xl font-black text-cyan-400">
                {currentHospital.traumaBays.available}
                <span className="text-xs font-normal text-neutral-500 ml-1">AVAILABLE</span>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-neutral-900">
                <button
                  onClick={() => handleBedStep('traumaBays', -1)}
                  disabled={currentHospital.traumaBays.available <= 0}
                  className="flex-1 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 border border-neutral-700 flex items-center justify-center text-xs font-bold transition"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleBedStep('traumaBays', 1)}
                  disabled={currentHospital.traumaBays.available >= currentHospital.traumaBays.total}
                  className="flex-1 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 border border-neutral-700 flex items-center justify-center text-xs font-bold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Maternity Beds */}
            <div className="p-4 bg-neutral-950 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">Maternity</span>
                <span className="text-[10px] text-neutral-500">
                  Total: {currentHospital.maternityBeds.total}
                </span>
              </div>
              <div className="text-3xl font-black text-purple-400">
                {currentHospital.maternityBeds.available}
                <span className="text-xs font-normal text-neutral-500 ml-1">AVAILABLE</span>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-neutral-900">
                <button
                  onClick={() => handleBedStep('maternityBeds', -1)}
                  disabled={currentHospital.maternityBeds.available <= 0}
                  className="flex-1 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 border border-neutral-700 flex items-center justify-center text-xs font-bold transition"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleBedStep('maternityBeds', 1)}
                  disabled={currentHospital.maternityBeds.available >= currentHospital.maternityBeds.total}
                  className="flex-1 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 border border-neutral-700 flex items-center justify-center text-xs font-bold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* General Ward */}
            <div className="p-4 bg-neutral-950 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">General Beds</span>
                <span className="text-[10px] text-neutral-500">
                  Total: {currentHospital.generalBeds.total}
                </span>
              </div>
              <div className="text-3xl font-black text-amber-400">
                {currentHospital.generalBeds.available}
                <span className="text-xs font-normal text-neutral-500 ml-1">AVAILABLE</span>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-neutral-900">
                <button
                  onClick={() => handleBedStep('generalBeds', -1)}
                  disabled={currentHospital.generalBeds.available <= 0}
                  className="flex-1 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 border border-neutral-700 flex items-center justify-center text-xs font-bold transition"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleBedStep('generalBeds', 1)}
                  disabled={currentHospital.generalBeds.available >= currentHospital.generalBeds.total}
                  className="flex-1 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 border border-neutral-700 flex items-center justify-center text-xs font-bold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* B. SIMPLE ON/OFF TOGGLE SWITCHES FOR DOCTORS */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <h3 className="text-xs font-bold uppercase text-neutral-300 flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-cyan-400" />
              <span>Specialist Doctors On-Duty Toggles</span>
            </h3>
            <span className="text-[10px] text-neutral-500 uppercase">
              CLICK CARD TO TOGGLE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {doctorList.map((doc) => {
              const isOnDuty = currentHospital.onDutySpecialists.some((s) =>
                s.toLowerCase().includes(doc.toLowerCase().slice(0, 5))
              );
              return (
                <button
                  key={doc}
                  onClick={() => toggleHospitalDoctor(currentHospital.id, doc, !isOnDuty)}
                  className={`p-3 border text-left flex items-center justify-between transition cursor-pointer ${
                    isOnDuty
                      ? 'bg-neutral-950 border-emerald-500 text-white'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        isOnDuty ? 'bg-emerald-400' : 'bg-neutral-700'
                      }`}
                    />
                    <span className="text-xs font-bold uppercase">{doc}</span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 font-bold uppercase border ${
                      isOnDuty
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : 'bg-neutral-900 text-neutral-500 border-neutral-800'
                    }`}
                  >
                    {isOnDuty ? 'ON DUTY' : 'OFF DUTY'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* C. CRITICAL MEDICAL EQUIPMENT STATUS TOGGLES */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <h3 className="text-xs font-bold uppercase text-neutral-300 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Critical Equipment Operational Toggles</span>
            </h3>
            <span className="text-[10px] text-neutral-500 uppercase">
              CLICK CARD TO TOGGLE
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {equipmentList.map((eq) => {
              const isOper = currentHospital.equipment.some((e) =>
                e.toLowerCase().includes(eq.toLowerCase())
              );
              return (
                <button
                  key={eq}
                  onClick={() => toggleHospitalEquipment(currentHospital.id, eq, !isOper)}
                  className={`p-3 border text-left flex items-center justify-between transition cursor-pointer ${
                    isOper
                      ? 'bg-neutral-950 border-cyan-500 text-white'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                  }`}
                >
                  <span className="text-xs font-bold uppercase">{eq}</span>
                  {isOper ? (
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-neutral-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};
