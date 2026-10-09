import React from 'react';
import { useEmergency } from '../context/EmergencyContext';
import {
  X,
  Sliders,
  Activity,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface SimulationControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SimulationControlsModal: React.FC<SimulationControlsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    simulationState,
    toggleSimulationCongestion,
    toggleSimulationIcuExhaustion,
    toggleSimulationSpecialistCallout,
    toggleSimulationRoadBlockage,
    resetToDefaults,
  } = useEmergency();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-100">
                Simulation Stress Injector
              </h3>
              <p className="text-xs text-slate-400">
                Test real-time deterministic re-routing across all browser tabs
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Congestion */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
            <div>
              <strong className="text-xs text-slate-200 block">
                Simulate Central Corridor Congestion (2.2x ETA)
              </strong>
              <p className="text-[11px] text-slate-400">
                Doubles travel time through Sayyaji Rao Road and Mysore Palace axis.
              </p>
            </div>
            <button
              onClick={toggleSimulationCongestion}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                simulationState.congestionMultiplier > 1.0
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {simulationState.congestionMultiplier > 1.0 ? 'ACTIVE (2.2x)' : 'OFF (1.0x)'}
            </button>
          </div>

          {/* ICU Exhaustion */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
            <div>
              <strong className="text-xs text-slate-200 block">
                Simulate Apollo BGS ICU Bed Exhaustion
              </strong>
              <p className="text-[11px] text-slate-400">
                Sets available ICU beds to 0, forcing re-evaluation to JSS or MMCRI.
              </p>
            </div>
            <button
              onClick={toggleSimulationIcuExhaustion}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                simulationState.forcedIcuExhaustion
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {simulationState.forcedIcuExhaustion ? 'EXHAUSTED (0)' : 'NORMAL (4)'}
            </button>
          </div>

          {/* Specialist Callout */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
            <div>
              <strong className="text-xs text-slate-200 block">
                Simulate Specialist Emergency Callout
              </strong>
              <p className="text-[11px] text-slate-400">
                Marks on-duty Cardiologist as unavailable at JSS Hospital.
              </p>
            </div>
            <button
              onClick={toggleSimulationSpecialistCallout}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                simulationState.forcedSpecialistCallout
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {simulationState.forcedSpecialistCallout ? 'CALLOUT' : 'ON DUTY'}
            </button>
          </div>

          {/* Road Blockage */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
            <div>
              <strong className="text-xs text-slate-200 block">
                Simulate Road Blockage / Arterial Closure
              </strong>
              <p className="text-[11px] text-slate-400">
                Blocks Irwin Road junction, enforcing outer ring road bypass.
              </p>
            </div>
            <button
              onClick={toggleSimulationRoadBlockage}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                simulationState.roadBlockages.length > 0
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {simulationState.roadBlockages.length > 0 ? 'BLOCKED' : 'CLEAR'}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
          <button
            onClick={() => {
              resetToDefaults();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All to Default</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
