import React, { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { Hospital } from '../types';
import { EMERGENCY_PHARMACIES } from '../data/mysuruFacilities';
import { GoogleMapView } from './GoogleMapView';
import { HospitalIntelligenceProfile } from './HospitalIntelligenceProfile';
import {
  User,
  LogOut,
  MapPin,
  Phone,
  Bed,
  Stethoscope,
  Activity,
  CheckCircle2,
  XCircle,
  Radio,
  ExternalLink,
  Pill,
  Search,
  Filter,
  Navigation,
  X,
  AlertCircle,
  Building2,
  Sparkles,
  Map as MapIcon,
  Brain,
} from 'lucide-react';
import { playEmergencySirenAlert, playTapBeep } from '../utils/audioAlert';

export const CitizenHome: React.FC = () => {
  const {
    currentUser,
    logout,
    hospitals,
    userCoords,
    triggerEmergencySOS,
    activeCase,
    cancelEmergencySOS,
  } = useEmergency();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [selectedHospitalIntelId, setSelectedHospitalIntelId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'MAP' | 'HOSPITALS' | 'PHARMACIES'>('HOSPITALS');
  const [dispatchedCaseId, setDispatchedCaseId] = useState<string | null>(null);

  // If user selected full 12-layer Hospital Intelligence Profile
  if (selectedHospitalIntelId) {
    return (
      <HospitalIntelligenceProfile
        initialHospitalId={selectedHospitalIntelId}
        onBackToMain={() => setSelectedHospitalIntelId(null)}
      />
    );
  }

  // Trigger Logged-In SOS with user's Name, Phone, and GPS Location
  const handleTriggerSOS = () => {
    playEmergencySirenAlert();
    const createdCase = triggerEmergencySOS({
      category: 'general_emergency',
      pickupLocation: userCoords,
      patientName: currentUser && 'fullName' in currentUser ? currentUser.fullName : 'Citizen User',
      patientPhone: currentUser && 'phone' in currentUser ? currentUser.phone : '+91 98450 12345',
      bloodGroup: currentUser && 'bloodGroup' in currentUser ? currentUser.bloodGroup : 'O+',
      notes: `Verified Emergency from ${currentUser && 'fullName' in currentUser ? currentUser.fullName : 'Citizen'} (${currentUser && 'phone' in currentUser ? currentUser.phone : ''})`,
    });
    setDispatchedCaseId(createdCase.id);
  };

  const handleCancel = () => {
    if (dispatchedCaseId) {
      cancelEmergencySOS(dispatchedCaseId, 'Cancelled by citizen');
    }
    setDispatchedCaseId(null);
  };

  const filteredHospitals = hospitals.filter(
    (h) =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.specialties.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      h.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-mono selection:bg-rose-600 selection:text-white">
      {/* 1. TOP HEADER: CITIZEN HUD */}
      <header className="border-b border-neutral-900 bg-neutral-950/80 backdrop-blur px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-neutral-900 border border-neutral-700 flex items-center justify-center font-bold text-cyan-400 text-xs">
            <User className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase text-white">
                {currentUser && 'fullName' in currentUser ? currentUser.fullName : 'Citizen User'}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase">
                {currentUser && 'bloodGroup' in currentUser ? currentUser.bloodGroup : 'O+'}
              </span>
            </div>
            <span className="text-[10px] text-neutral-500 flex items-center gap-1">
              <Phone className="w-2.5 h-2.5 text-neutral-400" />
              {currentUser && 'phone' in currentUser ? currentUser.phone : '+91 98450 12345'}
              <span className="text-neutral-700">|</span>
              <MapPin className="w-2.5 h-2.5 text-cyan-400" />
              {userCoords.address}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-1 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white text-xs uppercase transition"
          title="Logout to Minimal Landing"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>[ Exit ]</span>
        </button>
      </header>

      {/* 2. PERSISTENT LOGGED-IN SOS BANNER */}
      <section className="bg-gradient-to-r from-rose-950/40 via-black to-rose-950/40 border-b border-rose-900/60 p-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-600/20 border border-rose-500 flex items-center justify-center text-rose-500 shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Emergency Dispatch Line (Logged In)
              </h2>
              <p className="text-[11px] text-neutral-400">
                Transmits verified Caller ID ({currentUser && 'fullName' in currentUser ? currentUser.fullName : 'Citizen'}), Phone & live GPS to Mysuru 108 drivers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {dispatchedCaseId ? (
              <div className="flex items-center gap-2 bg-neutral-900 border border-rose-500 px-3 py-1.5 text-xs">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                <span className="text-rose-400 font-bold uppercase">SIGNAL ACTIVE</span>
                <button
                  onClick={handleCancel}
                  className="ml-2 text-neutral-400 hover:text-white uppercase text-[10px] underline"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={handleTriggerSOS}
                className="w-full sm:w-auto px-6 py-2.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs uppercase tracking-widest transition shadow-lg border border-rose-400 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                <span>[ TRIGGER LOGGED-IN EMERGENCY ]</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 3. DIRECTORY SECTION: HOSPITALS & 24/7 PHARMACIES */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-4">
        {/* Tab & Search Strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <button
              onClick={() => setActiveTab('MAP')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase font-bold border transition ${
                activeTab === 'MAP'
                  ? 'bg-white text-black border-white'
                  : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>Live Traffic & GPS Map</span>
            </button>

            <button
              onClick={() => setActiveTab('HOSPITALS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase font-bold border transition ${
                activeTab === 'HOSPITALS'
                  ? 'bg-white text-black border-white'
                  : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Hospitals ({hospitals.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('PHARMACIES')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase font-bold border transition ${
                activeTab === 'PHARMACIES'
                  ? 'bg-white text-black border-white'
                  : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
              }`}
            >
              <Pill className="w-3.5 h-3.5" />
              <span>24/7 Pharmacies ({EMERGENCY_PHARMACIES.length})</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by specialty or area..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-white"
            />
          </div>
        </div>

        {/* 1. LIVE RADAR & TRAFFIC MAP */}
        {activeTab === 'MAP' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-neutral-400 bg-neutral-950 p-3 border border-neutral-800 gap-2">
              <span className="flex items-center gap-2 text-white font-bold uppercase">
                <MapPin className="w-4 h-4 text-rose-500" />
                Live Mysuru Emergency Map with Real-time Congestion Hotspots
              </span>
              <span className="text-[11px] text-cyan-400">
                Click any hospital marker to inspect its 12-Layer Intelligence Dossier
              </span>
            </div>
            <div className="h-[480px] w-full rounded-xl overflow-hidden border border-neutral-800">
              <GoogleMapView
                userLocation={userCoords}
                hospitals={hospitals}
                height="100%"
                onSelectHospital={(h) => setSelectedHospitalIntelId(h.id)}
              />
            </div>
          </div>
        )}

        {/* HOSPITALS DIRECTORY LIST */}
        {activeTab === 'HOSPITALS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredHospitals.map((hospital) => (
              <div
                key={hospital.id}
                onClick={() => setSelectedHospitalIntelId(hospital.id)}
                className="p-4 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-500 transition cursor-pointer space-y-3 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-cyan-400 font-bold">{hospital.id}</span>
                      <span className="text-neutral-600">|</span>
                      <span className="text-[10px] text-neutral-400 uppercase">{hospital.type}</span>
                    </div>
                    <h3 className="font-bold text-sm text-white group-hover:text-cyan-400 transition mt-0.5">
                      {hospital.name}
                    </h3>
                    <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                      {hospital.address}
                    </p>
                  </div>

                  <span
                    className={`text-[9px] px-2 py-0.5 font-bold uppercase shrink-0 border ${
                      hospital.status === 'ACCEPTING'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : 'bg-rose-950 text-rose-300 border-rose-800'
                    }`}
                  >
                    {hospital.status}
                  </span>
                </div>

                {/* Quick Icon-Driven Metrics */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-900 text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-neutral-300">
                    <Bed className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      ICU: <strong>{hospital.icuBeds.available}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-neutral-300">
                    <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
                    <span>
                      DOCS: <strong>{hospital.onDutySpecialists.length}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-neutral-300">
                    <Activity className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      EQUIP: <strong>{hospital.equipment.length}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[10px] text-neutral-500">
                  <span className="flex items-center gap-1">
                    <Phone className="w-2.5 h-2.5" />
                    {hospital.emergencyPhone}
                  </span>
                  <span className="text-cyan-400 font-bold group-hover:underline">
                    [ 🧠 Inspect 12-Layer Intelligence → ]
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 24/7 PHARMACIES DIRECTORY */}
        {activeTab === 'PHARMACIES' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {EMERGENCY_PHARMACIES.map((pharmacy) => (
              <div
                key={pharmacy.id}
                className="p-4 bg-neutral-950 border border-neutral-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm flex items-center gap-2">
                    <Pill className="w-4 h-4 text-rose-400" />
                    {pharmacy.name}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase font-bold">
                    24/7 OPEN
                  </span>
                </div>
                <p className="text-neutral-400 text-[11px]">{pharmacy.address}</p>
                <div className="flex items-center justify-between pt-2 border-t border-neutral-900 text-neutral-300">
                  <span className="flex items-center gap-1 font-bold">
                    <Phone className="w-3 h-3 text-cyan-400" />
                    {pharmacy.phone}
                  </span>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${pharmacy.coordinates.lat},${pharmacy.coordinates.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-white flex items-center gap-1 text-[11px]"
                  >
                    <span>Directions</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 4. HOSPITAL INTELLIGENCE DRAWER / MODAL */}
      {selectedHospital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-black border-2 border-neutral-700 shadow-2xl p-6 space-y-5 text-white max-h-[90vh] overflow-y-auto font-mono">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-neutral-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-cyan-400 uppercase font-bold">
                    HOSPITAL INTELLIGENCE DOSSIER
                  </span>
                  <span className="text-neutral-600">|</span>
                  <span className="text-[10px] text-neutral-400">{selectedHospital.id}</span>
                </div>
                <h2 className="text-lg font-bold uppercase text-white mt-0.5">
                  {selectedHospital.name}
                </h2>
                <p className="text-xs text-neutral-400">{selectedHospital.address}</p>
              </div>

              <button
                onClick={() => setSelectedHospital(null)}
                className="p-1 text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* A. REAL-TIME BED AVAILABILITY (ICU, MATERNITY, GENERAL, TRAUMA) */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-neutral-300 flex items-center gap-1.5">
                <Bed className="w-4 h-4 text-emerald-400" />
                <span>Real-Time Bed Availability</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-3 bg-neutral-950 border border-neutral-800">
                  <span className="text-[10px] text-neutral-500 uppercase block">ICU Beds</span>
                  <div className="text-xl font-bold text-white">
                    {selectedHospital.icuBeds.available}{' '}
                    <span className="text-xs font-normal text-neutral-500">
                      / {selectedHospital.icuBeds.total}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-800 h-1.5 mt-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all"
                      style={{
                        width: `${(selectedHospital.icuBeds.available / Math.max(1, selectedHospital.icuBeds.total)) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="p-3 bg-neutral-950 border border-neutral-800">
                  <span className="text-[10px] text-neutral-500 uppercase block">Trauma Bays</span>
                  <div className="text-xl font-bold text-white">
                    {selectedHospital.traumaBays.available}{' '}
                    <span className="text-xs font-normal text-neutral-500">
                      / {selectedHospital.traumaBays.total}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-800 h-1.5 mt-2 overflow-hidden">
                    <div
                      className="bg-cyan-500 h-full transition-all"
                      style={{
                        width: `${(selectedHospital.traumaBays.available / Math.max(1, selectedHospital.traumaBays.total)) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="p-3 bg-neutral-950 border border-neutral-800">
                  <span className="text-[10px] text-neutral-500 uppercase block">Maternity</span>
                  <div className="text-xl font-bold text-white">
                    {selectedHospital.maternityBeds.available}{' '}
                    <span className="text-xs font-normal text-neutral-500">
                      / {selectedHospital.maternityBeds.total}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-800 h-1.5 mt-2 overflow-hidden">
                    <div
                      className="bg-purple-500 h-full transition-all"
                      style={{
                        width: `${(selectedHospital.maternityBeds.available / Math.max(1, selectedHospital.maternityBeds.total)) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="p-3 bg-neutral-950 border border-neutral-800">
                  <span className="text-[10px] text-neutral-500 uppercase block">General Ward</span>
                  <div className="text-xl font-bold text-white">
                    {selectedHospital.generalBeds.available}{' '}
                    <span className="text-xs font-normal text-neutral-500">
                      / {selectedHospital.generalBeds.total}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-800 h-1.5 mt-2 overflow-hidden">
                    <div
                      className="bg-amber-500 h-full transition-all"
                      style={{
                        width: `${(selectedHospital.generalBeds.available / Math.max(1, selectedHospital.generalBeds.total)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* B. LIVE DOCTOR AVAILABILITY */}
            <div className="space-y-2 pt-2 border-t border-neutral-800">
              <h3 className="text-xs font-bold uppercase text-neutral-300 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-cyan-400" />
                <span>Live Doctor Availability On-Duty</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {['Cardiologist', 'Obstetrician', 'Trauma Surgeon', 'Neurologist', 'Emergency Physician', 'Senior Pediatrician'].map((spec) => {
                  const isOnDuty = selectedHospital.onDutySpecialists.some((s) =>
                    s.toLowerCase().includes(spec.toLowerCase().slice(0, 5))
                  );
                  return (
                    <div
                      key={spec}
                      className="p-2.5 bg-neutral-950 border border-neutral-800 flex items-center justify-between"
                    >
                      <span className="text-neutral-200">{spec}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 font-bold uppercase border ${
                          isOnDuty
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : 'bg-neutral-900 text-neutral-500 border-neutral-800'
                        }`}
                      >
                        {isOnDuty ? 'ON DUTY' : 'OFF DUTY / CALLOUT'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* C. EQUIPMENT & FACILITY STATUS */}
            <div className="space-y-2 pt-2 border-t border-neutral-800">
              <h3 className="text-xs font-bold uppercase text-neutral-300 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-amber-400" />
                <span>Critical Medical Equipment Status</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {['Cath Lab', 'CT Scanner', 'MRI', 'Blood Bank 24/7', 'Ventilator', 'Trauma OT'].map((eq) => {
                  const hasEq = selectedHospital.equipment.some((e) =>
                    e.toLowerCase().includes(eq.toLowerCase())
                  );
                  return (
                    <div
                      key={eq}
                      className="p-2 bg-neutral-950 border border-neutral-800 flex items-center gap-2"
                    >
                      {hasEq ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                      )}
                      <span className={hasEq ? 'text-white' : 'text-neutral-500'}>{eq}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="pt-3 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <a
                href={`tel:${selectedHospital.emergencyPhone}`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-bold uppercase"
              >
                <Phone className="w-3.5 h-3.5 text-rose-500" />
                <span>Call ED ({selectedHospital.emergencyPhone})</span>
              </a>

              <a
                href={`https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${selectedHospital.coordinates.lat},${selectedHospital.coordinates.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-1.5 bg-white hover:bg-neutral-200 text-black font-bold uppercase transition"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>[ Navigate In Google Maps ]</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
