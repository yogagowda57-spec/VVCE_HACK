import React from 'react';
import { Hospital } from '../types';
import {
  X,
  Building2,
  Phone,
  MapPin,
  Bed,
  Stethoscope,
  Activity,
  CheckCircle2,
  XCircle,
  Navigation,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

interface HospitalDetailModalProps {
  hospital: Hospital | null;
  onClose: () => void;
  userCoords?: { lat: number; lng: number };
  onInspectIntelligence?: (hospital: Hospital) => void;
}

export const HospitalDetailModal: React.FC<HospitalDetailModalProps> = ({
  hospital,
  onClose,
  userCoords,
  onInspectIntelligence,
}) => {
  if (!hospital) return null;

  const isOperational = hospital.edOperational && hospital.status !== 'DIVERT';

  const mapsUrl = userCoords
    ? `https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${hospital.coordinates.lat},${hospital.coordinates.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${hospital.coordinates.lat},${hospital.coordinates.lng}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {hospital.type}
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-[10px] font-mono text-cyan-400">{hospital.id}</span>
              </div>
              <h3 className="font-extrabold text-base text-slate-100 truncate">
                {hospital.name}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body (Scrollable) */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Status Alert Banner */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
              isOperational
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {isOperational ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>
                <strong>Triage Readiness:</strong>{' '}
                {isOperational
                  ? 'Emergency Resuscitation & Trauma bays are OPEN 24/7.'
                  : 'Hospital is currently on DIVERT status due to capacity.'}
              </span>
            </div>
            <span className="text-[10px] font-mono opacity-80 font-bold uppercase">
              {hospital.verifiedStatus}
            </span>
          </div>

          {/* Description & Address */}
          <div>
            <p className="text-xs text-slate-300 leading-relaxed">{hospital.description}</p>
            <div className="mt-2 text-xs text-slate-400 flex items-start gap-1.5">
              <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>
                {hospital.address}{' '}
                {hospital.landmark && (
                  <span className="text-slate-500 font-medium">({hospital.landmark})</span>
                )}
              </span>
            </div>
          </div>

          {/* Real-time Bed Inventory */}
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Bed className="w-4 h-4 text-emerald-400" /> Bed & Capacity Breakdown
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 block">ICU Beds</span>
                <strong className="text-sm font-mono text-emerald-400">
                  {hospital.icuBeds.available} / {hospital.icuBeds.total}
                </strong>
                <span className="text-[9px] text-slate-500 block">Available</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 block">General Ward</span>
                <strong className="text-sm font-mono text-slate-200">
                  {hospital.generalBeds.available} / {hospital.generalBeds.total}
                </strong>
                <span className="text-[9px] text-slate-500 block">Available</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 block">Trauma Bays</span>
                <strong className="text-sm font-mono text-cyan-400">
                  {hospital.traumaBays.available} / {hospital.traumaBays.total}
                </strong>
                <span className="text-[9px] text-slate-500 block">Available</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 block">Maternity Beds</span>
                <strong className="text-sm font-mono text-purple-400">
                  {hospital.maternityBeds?.available || 0} / {hospital.maternityBeds?.total || 0}
                </strong>
                <span className="text-[9px] text-slate-500 block">Available</span>
              </div>
            </div>
          </div>

          {/* On-Duty Specialists & Equipment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <h5 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-cyan-400" /> Active On-Duty Specialists
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {hospital.onDutySpecialists.length > 0 ? (
                  hospital.onDutySpecialists.map((doc, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-[11px] text-cyan-300"
                    >
                      {doc}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-500 italic">
                    Emergency Medical Officers on active shift.
                  </span>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <h5 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" /> Operational Critical Equipment
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {hospital.equipment.map((eq, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-[11px] text-emerald-300"
                  >
                    {eq}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Numbers */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Emergency Triage Desk:</span>
              <strong className="text-slate-100">{hospital.emergencyPhone}</strong>
            </div>

            {hospital.ambulanceBayPhone && (
              <div>
                <span className="text-slate-400 block text-[10px]">Ambulance Bay Direct:</span>
                <strong className="text-slate-100">{hospital.ambulanceBayPhone}</strong>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {onInspectIntelligence && (
                <button
                  onClick={() => {
                    onInspectIntelligence(hospital);
                    onClose();
                  }}
                  className="py-1.5 px-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-cyan-300 font-mono font-bold text-xs flex items-center gap-1 transition"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>[ 12-LAYER INTELLIGENCE ]</span>
                </button>
              )}

              <a
                href={`tel:${hospital.emergencyPhone}`}
                className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition"
              >
                <Phone className="w-3.5 h-3.5" /> Call Hotline
              </a>

              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 transition shadow"
              >
                <Navigation className="w-3.5 h-3.5" /> Open in Google Maps
                <ExternalLink className="w-3 h-3 opacity-80" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
