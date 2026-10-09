import React, { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { EmergencyCase, Hospital, Ambulance, RoutingCandidate } from '../types';
import { EMERGENCY_CATEGORIES, MYSURU_LANDMARKS } from '../data/mysuruFacilities';
import { GoogleMapView } from './GoogleMapView';
import {
  ShieldAlert,
  Ambulance as AmbulanceIcon,
  Building2,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
  Edit3,
  Send,
  PlusCircle,
  Activity,
  Layers,
} from 'lucide-react';

interface DispatcherPortalProps {
  onOpenAIExplanation: (candidate: RoutingCandidate) => void;
}

export const DispatcherPortal: React.FC<DispatcherPortalProps> = ({
  onOpenAIExplanation,
}) => {
  const {
    cases,
    hospitals,
    ambulances,
    assignAmbulanceAndHospital,
    updateCaseStatus,
    triggerEmergencySOS,
    getHospitalEvaluation,
    simulationState,
    toggleSimulationCongestion,
    toggleSimulationIcuExhaustion,
    toggleSimulationSpecialistCallout,
    toggleSimulationRoadBlockage,
    resetToDefaults,
    auditLogs,
  } = useEmergency();

  // Selected case for triage
  const [selectedCaseId, setSelectedCaseId] = useState<string>(cases[0]?.id || '');
  const selectedCase = cases.find((c) => c.id === selectedCaseId) || cases[0];

  // Manual incident creation state
  const [showCreateWizard, setShowCreateWizard] = useState<boolean>(false);
  const [newCategory, setNewCategory] = useState<string>('cardiac_stemi');
  const [newPatientName, setNewPatientName] = useState<string>('Emergency Patient');
  const [newAddress, setNewAddress] = useState<string>(MYSURU_LANDMARKS[0].name);
  const [newCoords, setNewCoords] = useState(MYSURU_LANDMARKS[0].coordinates);

  // Override controls state
  const [overrideHospitalId, setOverrideHospitalId] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [showOverrideModal, setShowOverrideModal] = useState<boolean>(false);

  // Evaluate candidate hospitals for selected case
  const candidates: RoutingCandidate[] = selectedCase
    ? getHospitalEvaluation(selectedCase)
    : [];
  const bestCandidate = candidates.find((c) => c.isBest) || candidates[0];

  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    const created = triggerEmergencySOS({
      category: newCategory,
      pickupLocation: {
        lat: newCoords.lat,
        lng: newCoords.lng,
        address: newAddress,
      },
      patientName: newPatientName,
      notes: 'Incident created via Dispatcher Triage Board.',
    });
    setSelectedCaseId(created.id);
    setShowCreateWizard(false);
  };

  const handleConfirmOverride = () => {
    if (!selectedCase || !overrideHospitalId) return;
    const ambId = selectedCase.assignedAmbulanceId || ambulances[0].id;
    assignAmbulanceAndHospital(
      selectedCase.id,
      ambId,
      overrideHospitalId,
      true,
      overrideReason || 'Dispatcher clinical judgement override'
    );
    setShowOverrideModal(false);
    setOverrideReason('');
  };

  return (
    <div className="space-y-6">
      {/* 1. DISPATCHER MASTHEAD & SIMULATION CONTROLLER */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
                  MYSURU CENTRAL EMS DISPATCH
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-xs text-slate-400 font-mono">108 / 112 Triage Hub</span>
              </div>
              <h2 className="text-xl font-black text-white">
                Command Room & Deterministic Fleet Router
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateWizard(true)}
              className="py-2 px-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg flex items-center gap-1.5 transition active:scale-98"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Incident</span>
            </button>

            <button
              onClick={resetToDefaults}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              title="Reset application to factory Mysuru demonstration state"
            >
              Reset State
            </button>
          </div>
        </div>

        {/* Dynamic Simulation Mutation Bar */}
        <div className="pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              Simulation Stress Injections (1-Click Real-Time Mutation)
            </span>
            <span className="text-[11px] font-mono text-cyan-400">
              Corridor: {simulationState.activeCorridor}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={toggleSimulationCongestion}
              className={`p-2 rounded-lg text-xs font-bold border text-left transition ${
                simulationState.congestionMultiplier > 1.0
                  ? 'bg-amber-950/40 border-amber-500 text-amber-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="font-semibold truncate">Route Congestion (2.2x)</div>
              <span className="text-[10px] text-slate-500 block truncate">
                {simulationState.congestionMultiplier > 1.0 ? 'Sayyaji Rao Rd Jammed' : 'Normal Traffic'}
              </span>
            </button>

            <button
              onClick={toggleSimulationIcuExhaustion}
              className={`p-2 rounded-lg text-xs font-bold border text-left transition ${
                simulationState.forcedIcuExhaustion
                  ? 'bg-rose-950/40 border-rose-500 text-rose-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="font-semibold truncate">ICU Exhaustion (Apollo)</div>
              <span className="text-[10px] text-slate-500 block truncate">
                {simulationState.forcedIcuExhaustion ? '0 ICU Beds Available' : 'Normal Capacity'}
              </span>
            </button>

            <button
              onClick={toggleSimulationSpecialistCallout}
              className={`p-2 rounded-lg text-xs font-bold border text-left transition ${
                simulationState.forcedSpecialistCallout
                  ? 'bg-purple-950/40 border-purple-500 text-purple-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="font-semibold truncate">Specialist Callout (JSS)</div>
              <span className="text-[10px] text-slate-500 block truncate">
                {simulationState.forcedSpecialistCallout ? 'Cardiologist Off-Duty' : 'Specialist Active'}
              </span>
            </button>

            <button
              onClick={toggleSimulationRoadBlockage}
              className={`p-2 rounded-lg text-xs font-bold border text-left transition ${
                simulationState.roadBlockages.length > 0
                  ? 'bg-rose-950/40 border-rose-500 text-rose-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="font-semibold truncate">Road Blockage (Irwin Rd)</div>
              <span className="text-[10px] text-slate-500 block truncate">
                {simulationState.roadBlockages.length > 0 ? 'Bypass Routing Enforced' : 'All Arteries Clear'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. ACTIVE INCIDENT TRIAGE & MATCHING BOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cases List Sidebar (4 Cols) */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
              <span>Active Incident Queue</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 font-mono">
                {cases.length}
              </span>
            </h3>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
            {cases.length > 0 ? (
              cases.map((c) => {
                const isSelected = c.id === selectedCase?.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCaseId(c.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                      isSelected
                        ? 'bg-slate-950 border-cyan-500/80 shadow-md'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-cyan-400">{c.id}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          c.status === 'PENDING'
                            ? 'bg-rose-500/20 text-rose-300'
                            : c.status === 'DISPATCHED'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>

                    <div className="font-bold text-slate-200 truncate">
                      {c.category.replace('_', ' ').toUpperCase()}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {c.pickupLocation.address}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 rounded-xl bg-slate-950 text-center text-xs text-slate-500">
                No active emergency cases. Click "Create New Incident" above or test Emergency from the Citizen portal.
              </div>
            )}
          </div>
        </div>

        {/* Selected Incident Triage Detail & Evaluation (8 Cols) */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          {selectedCase ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    INCIDENT DETAILS • {selectedCase.id}
                  </span>
                  <h3 className="text-lg font-black text-white">
                    {selectedCase.category.replace('_', ' ').toUpperCase()}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setOverrideHospitalId(selectedCase.assignedHospitalId || hospitals[0].id);
                      setShowOverrideModal(true);
                    }}
                    className="py-1.5 px-3 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Override Destination</span>
                  </button>
                </div>
              </div>

              {/* Patient & Assigned Destination Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <span className="text-slate-400 block mb-0.5">Patient:</span>
                  <strong className="text-slate-100 block truncate">{selectedCase.patientName}</strong>
                  <span className="text-slate-500 text-[11px] block">{selectedCase.patientPhone}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <span className="text-slate-400 block mb-0.5">Pickup Locality:</span>
                  <strong className="text-slate-100 block truncate">{selectedCase.pickupLocation.address}</strong>
                  <span className="text-cyan-400 text-[11px] font-mono block">
                    {selectedCase.pickupLocation.lat.toFixed(4)}, {selectedCase.pickupLocation.lng.toFixed(4)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <span className="text-slate-400 block mb-0.5">Assigned Target:</span>
                  <strong className="text-emerald-400 block truncate">
                    {hospitals.find((h) => h.id === selectedCase.assignedHospitalId)?.name || 'Auto Matched'}
                  </strong>
                  <span className="text-slate-500 text-[11px] block">
                    {selectedCase.dispatcherOverrideReason ? '(Overridden by Dispatcher)' : '(Optimal AI Match)'}
                  </span>
                </div>
              </div>

              {/* DETERMINISTIC EVALUATION CANDIDATE RANKINGS */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider">
                    Deterministic Clinical Ranking for Incident
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Hard Filtering + Road Travel Matrix
                  </span>
                </div>

                <div className="space-y-2">
                  {candidates.slice(0, 4).map((cand) => {
                    return (
                      <div
                        key={cand.hospital.id}
                        className={`p-3 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-3 ${
                          cand.isBest
                            ? 'bg-emerald-950/30 border-emerald-500/60'
                            : cand.eligible
                            ? 'bg-slate-950 border-slate-800'
                            : 'bg-slate-950/50 border-slate-800/80 opacity-70'
                        }`}
                      >
                        <div className="flex-1 min-w-[200px]">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-bold text-slate-100">{cand.hospital.name}</span>
                            {cand.isBest && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                                RECOMMENDED BEST
                              </span>
                            )}
                            {cand.isNearest && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                                NEAREST
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">
                            {cand.explanation}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right font-mono">
                            <div className="font-bold text-slate-200">{cand.distanceKm} km</div>
                            <div className="text-[10px] text-emerald-400">~{cand.etaMinutes} mins</div>
                          </div>

                          <button
                            onClick={() => onOpenAIExplanation(cand)}
                            className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 transition"
                            title="View AI Explanation"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              Select an incident from the left queue to view triage breakdown.
            </div>
          )}
        </div>
      </div>

      {/* 3. MASTER FLEET TRACKER & CITY RADAR */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" /> Live Mysuru EMS City Radar
          </h3>
          <span className="text-xs font-mono text-slate-400">
            Active Ambulances: {ambulances.filter((a) => a.status !== 'OFF_DUTY').length} / {ambulances.length}
          </span>
        </div>

        <GoogleMapView
          userLocation={selectedCase ? selectedCase.pickupLocation : MYSURU_LANDMARKS[0].coordinates}
          userAddress={selectedCase ? selectedCase.pickupLocation.address : 'Mysuru City Center'}
          hospitals={hospitals}
          ambulances={ambulances}
          bestHospitalId={bestCandidate?.hospital.id}
          destinationLocation={bestCandidate?.hospital.coordinates}
          height="400px"
        />
      </div>

      {/* OVERRIDE DESTINATION MODAL */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 space-y-4">
            <h3 className="font-bold text-base text-white">Manual Destination Override</h3>
            <p className="text-xs text-slate-400">
              Per emergency protocols, manual re-routing overrides require an explicit dispatcher note in the audit trail.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Select Destination Hospital
              </label>
              <select
                value={overrideHospitalId}
                onChange={(e) => setOverrideHospitalId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-slate-200"
              >
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Mandatory Clinical / Operational Justification Note
              </label>
              <textarea
                required
                rows={3}
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-slate-200"
                placeholder="e.g. Patient requests family physician referral; or bed crunch reported via direct phone consultation."
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleConfirmOverride}
                disabled={!overrideReason.trim()}
                className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs"
              >
                Confirm Override
              </button>
              <button
                onClick={() => setShowOverrideModal(false)}
                className="py-2 px-3 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW INCIDENT WIZARD */}
      {showCreateWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <form
            onSubmit={handleCreateIncident}
            className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 space-y-4"
          >
            <h3 className="font-bold text-base text-white">Manual Incident Creation Wizard</h3>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Emergency Category
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-slate-200"
              >
                {EMERGENCY_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Patient Name / Identifier
              </label>
              <input
                type="text"
                required
                value={newPatientName}
                onChange={(e) => setNewPatientName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Mysuru Landmark / Locality
              </label>
              <select
                onChange={(e) => {
                  const lm = MYSURU_LANDMARKS.find((l) => l.id === e.target.value);
                  if (lm) {
                    setNewAddress(lm.name);
                    setNewCoords(lm.coordinates);
                  }
                }}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-slate-200 mb-2"
              >
                {MYSURU_LANDMARKS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.zone})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                Create & Triage
              </button>
              <button
                type="button"
                onClick={() => setShowCreateWizard(false)}
                className="py-2 px-3 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
