import React, { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { Hospital, BedCategory } from '../types';
import {
  Building2,
  Bed,
  Stethoscope,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Phone,
  Clock,
  Shield,
  Ambulance,
  Sliders,
  Save,
  Plus,
  Minus,
  MapPin,
  RefreshCw,
} from 'lucide-react';

export const HospitalAdminPortal: React.FC = () => {
  const {
    currentUser,
    hospitals,
    cases,
    ambulances,
    updateHospitalBeds,
    toggleHospitalDoctor,
    toggleHospitalEquipment,
    toggleHospitalStatus,
    updateHospitalProfile,
    auditLogs,
  } = useEmergency();

  // Selected hospital (default to admin's assigned hospital or KR Hospital)
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(
    currentUser?.role === 'HOSPITAL_ADMIN' ? currentUser.hospitalId : hospitals[0].id
  );

  const currentHospital =
    hospitals.find((h) => h.id === selectedHospitalId) || hospitals[0];

  // Incoming cases approaching this hospital
  const approachingCases = cases.filter(
    (c) =>
      c.assignedHospitalId === currentHospital.id &&
      (c.status === 'DISPATCHED' || c.status === 'IN_TRANSIT')
  );

  // Doctors list for toggle
  const standardSpecialists = [
    'Cardiologist',
    'Interventional Cardiologist',
    'Neurologist',
    'Neurosurgery Specialist',
    'Obstetrician & Gynecologist',
    'Trauma Surgeon',
    'Orthopedic Specialist',
    'Senior Pediatrician',
    'Neonatologist',
    'Emergency Physician',
    'Veterinary Surgeon',
  ];

  // Equipment list for toggle
  const standardEquipment = [
    'Cath Lab',
    'CT Scanner',
    'MRI',
    'Trauma OT',
    'Blood Bank 24/7',
    'Ventilator',
    'Defibrillator',
    'Labor Room',
    'Thrombolysis Unit',
    'Animal Surgical OT',
  ];

  // Helper to adjust beds with validation
  const handleBedDelta = (
    key: 'icuBeds' | 'generalBeds' | 'maternityBeds' | 'traumaBays' | 'pediatricBeds',
    field: 'occupied' | 'total',
    delta: number
  ) => {
    const current = currentHospital[key] || { total: 10, occupied: 5, available: 5 };
    let newTotal = current.total;
    let newOccupied = current.occupied;

    if (field === 'total') {
      newTotal = Math.max(0, current.total + delta);
      newOccupied = Math.min(newTotal, current.occupied);
    } else {
      newOccupied = Math.max(0, Math.min(current.total, current.occupied + delta));
    }

    const newAvailable = Math.max(0, newTotal - newOccupied);

    updateHospitalBeds(currentHospital.id, key, {
      total: newTotal,
      occupied: newOccupied,
      available: newAvailable,
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. FACILITY SELECTOR & MASTER STATUS HEADER */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
                  ADMINISTRATION DESK
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-xs text-slate-400 font-mono">{currentHospital.id}</span>
              </div>
              <h2 className="text-xl font-black text-white">{currentHospital.name}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{currentHospital.address}</p>
            </div>
          </div>

          {/* Switch Hospital Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Switch Facility:</span>
            <select
              value={selectedHospitalId}
              onChange={(e) => setSelectedHospitalId(e.target.value)}
              className="py-1.5 px-3 text-xs rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Master Triage Status Controller */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-bold">Emergency Department Status:</span>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                currentHospital.status === 'ACCEPTING'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {currentHospital.status === 'ACCEPTING'
                ? '● OPEN / ACCEPTING INCOMING EMS'
                : '✕ DIVERT / AT CAPACITY'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleHospitalStatus(currentHospital.id, 'ACCEPTING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                currentHospital.status === 'ACCEPTING'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Set OPEN
            </button>

            <button
              onClick={() => toggleHospitalStatus(currentHospital.id, 'DIVERT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                currentHospital.status === 'DIVERT'
                  ? 'bg-rose-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Set DIVERT
            </button>
          </div>
        </div>
      </div>

      {/* 2. INCOMING PATIENT TRIAGE QUEUE (En Route Ambulances) */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Ambulance className="w-4 h-4 text-amber-400" />
            Approaching Patient Queue & ETA Radar
          </h3>
          <span className="text-xs font-mono text-cyan-400">
            {approachingCases.length} En Route Inbound
          </span>
        </div>

        {approachingCases.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {approachingCases.map((c) => {
              const amb = ambulances.find((a) => a.id === c.assignedAmbulanceId);
              return (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/40 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400 uppercase tracking-wide">
                      {c.category.replace('_', ' ')}
                    </span>
                    <span className="font-mono text-slate-400">{c.timestamp}</span>
                  </div>

                  <div className="text-slate-200 font-semibold truncate">
                    Patient: {c.patientName} ({c.bloodGroup || 'Blood Type N/A'})
                  </div>

                  <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-900">
                    <span>
                      Ambulance: <strong className="text-slate-200">{amb?.vehiclePlate}</strong>
                    </span>
                    <span className="text-emerald-400 font-bold">~5-8 mins ETA</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-center text-xs text-slate-500">
            No incoming ambulance transports currently en route to this facility.
          </div>
        )}
      </div>

      {/* 3. BED INVENTORY & LIVE CAPACITY COUNTERS (With strict validation) */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Bed className="w-4 h-4 text-emerald-400" />
              Emergency Bed & Bay Capacity Management
            </h3>
            <p className="text-xs text-slate-400">
              Live updates automatically recalibrate the deterministic routing engine across Mysuru.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">Validated Real-Time</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* ICU BEDS */}
          <BedCounterCard
            title="Intensive Care Unit (ICU)"
            beds={currentHospital.icuBeds}
            onOccupiedDelta={(d) => handleBedDelta('icuBeds', 'occupied', d)}
            onTotalDelta={(d) => handleBedDelta('icuBeds', 'total', d)}
            colorClass="emerald"
          />

          {/* MATERNITY / LABOR BEDS */}
          <BedCounterCard
            title="Maternity & Labor Bays"
            beds={currentHospital.maternityBeds || { total: 0, occupied: 0, available: 0 }}
            onOccupiedDelta={(d) => handleBedDelta('maternityBeds', 'occupied', d)}
            onTotalDelta={(d) => handleBedDelta('maternityBeds', 'total', d)}
            colorClass="purple"
          />

          {/* TRAUMA BAYS */}
          <BedCounterCard
            title="Acute Trauma Bays"
            beds={currentHospital.traumaBays || { total: 0, occupied: 0, available: 0 }}
            onOccupiedDelta={(d) => handleBedDelta('traumaBays', 'occupied', d)}
            onTotalDelta={(d) => handleBedDelta('traumaBays', 'total', d)}
            colorClass="rose"
          />

          {/* PEDIATRIC / NICU */}
          <BedCounterCard
            title="Pediatric / NICU Beds"
            beds={currentHospital.pediatricBeds || { total: 0, occupied: 0, available: 0 }}
            onOccupiedDelta={(d) => handleBedDelta('pediatricBeds', 'occupied', d)}
            onTotalDelta={(d) => handleBedDelta('pediatricBeds', 'total', d)}
            colorClass="blue"
          />

          {/* GENERAL EMERGENCY BEDS */}
          <BedCounterCard
            title="General Emergency Beds"
            beds={currentHospital.generalBeds}
            onOccupiedDelta={(d) => handleBedDelta('generalBeds', 'occupied', d)}
            onTotalDelta={(d) => handleBedDelta('generalBeds', 'total', d)}
            colorClass="cyan"
          />
        </div>
      </div>

      {/* 4. ON-DUTY SPECIALISTS & CRITICAL EQUIPMENT TOGGLES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Doctor Switches */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-cyan-400" />
              Specialist On-Duty Toggles
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Real-Time Shift Registry</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {standardSpecialists.map((doc) => {
              const isOnDuty = currentHospital.onDutySpecialists.some((s) =>
                s.toLowerCase().includes(doc.toLowerCase().slice(0, 7))
              );

              return (
                <button
                  key={doc}
                  onClick={() => toggleHospitalDoctor(currentHospital.id, doc, !isOnDuty)}
                  className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                    isOnDuty
                      ? 'bg-slate-950 border-cyan-500/60 text-slate-100 shadow-sm'
                      : 'bg-slate-950/40 border-slate-800 text-slate-500'
                  }`}
                >
                  <span className="text-xs font-semibold truncate">{doc}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isOnDuty
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isOnDuty ? 'ON DUTY' : 'OFF'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Equipment Switches */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Critical Equipment Operability
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Biomedical Status</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {standardEquipment.map((eq) => {
              const isAvailable = currentHospital.equipment.includes(eq);

              return (
                <button
                  key={eq}
                  onClick={() => toggleHospitalEquipment(currentHospital.id, eq, !isAvailable)}
                  className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                    isAvailable
                      ? 'bg-slate-950 border-emerald-500/60 text-slate-100 shadow-sm'
                      : 'bg-slate-950/40 border-slate-800 text-slate-500'
                  }`}
                >
                  <span className="text-xs font-semibold truncate">{eq}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isAvailable
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isAvailable ? 'READY' : 'DOWN'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. AUDIT TRAIL LOG VIEWER */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" /> Administrator Audit Trail
          </h3>
          <span className="text-xs text-slate-500 font-mono">Immutable Event Log</span>
        </div>

        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-2 font-mono text-[11px]">
          {auditLogs.slice(0, 8).map((log) => (
            <div
              key={log.id}
              className="p-2 rounded bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-3 text-slate-300"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="text-slate-500">{log.timestamp}</span>
                <span className="text-cyan-400 font-bold">[{log.actor}]</span>
                <span className="text-slate-200 truncate">{log.note}</span>
              </div>
              <span className="text-[10px] text-slate-500 uppercase shrink-0">{log.action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Reusable Bed Counter Card with strict increment / decrement validation
const BedCounterCard: React.FC<{
  title: string;
  beds: BedCategory;
  onOccupiedDelta: (d: number) => void;
  onTotalDelta: (d: number) => void;
  colorClass: string;
}> = ({ title, beds, onOccupiedDelta, onTotalDelta, colorClass }) => {
  return (
    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-xs text-slate-200 truncate">{title}</h4>
        <span
          className={`font-mono text-sm font-black ${
            beds.available > 0 ? 'text-emerald-400' : 'text-rose-500'
          }`}
        >
          {beds.available} FREE
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-900">
        {/* Occupied controls */}
        <div>
          <span className="text-[10px] text-slate-400 block mb-1">Occupied: {beds.occupied}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onOccupiedDelta(-1)}
              disabled={beds.occupied <= 0}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              onClick={() => onOccupiedDelta(1)}
              disabled={beds.occupied >= beds.total}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Total controls */}
        <div>
          <span className="text-[10px] text-slate-400 block mb-1">Total: {beds.total}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onTotalDelta(-1)}
              disabled={beds.total <= 0}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              onClick={() => onTotalDelta(1)}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
