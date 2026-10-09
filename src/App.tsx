import React, { useState, useEffect } from 'react';
import { EmergencyProvider, useEmergency } from './context/EmergencyContext';
import { MinimalLanding } from './components/MinimalLanding';
import { AuthGateway } from './components/AuthGateway';
import { CitizenHome } from './components/CitizenHome';
import { DriverHome } from './components/DriverHome';
import { HospitalHome } from './components/HospitalHome';
import { DispatcherPortal } from './components/DispatcherPortal';
import { HospitalIntelligenceProfile } from './components/HospitalIntelligenceProfile';
import { AIExplanationModal } from './components/AIExplanationModal';
import { SimulationControlsModal } from './components/SimulationControlsModal';
import { UserRole, RoutingCandidate } from './types';
import {
  Sliders,
  Radio,
  Ambulance,
  Building2,
  User,
  Brain,
  LogOut,
  MapPin,
  Flame,
  Shield,
  Activity,
} from 'lucide-react';

type PortalView =
  | 'LANDING'
  | 'CITIZEN'
  | 'DRIVER'
  | 'HOSPITAL_ADMIN'
  | 'DISPATCHER'
  | 'HOSPITAL_INTELLIGENCE';

const MainAppRouter: React.FC = () => {
  const { currentUser, activeRole, switchRole, logout, userCoords } = useEmergency();
  const [activeView, setActiveView] = useState<PortalView>('LANDING');
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showSimModal, setShowSimModal] = useState<boolean>(false);
  const [showQuotaWarning, setShowQuotaWarning] = useState<boolean>(false);
  const [aiModalCandidate, setAiModalCandidate] = useState<RoutingCandidate | null>(null);

  // Sync active view with user login role, or keep on landing if not logged in
  useEffect(() => {
    if (!currentUser) {
      setActiveView('LANDING');
    } else {
      if (currentUser.role === 'CITIZEN') setActiveView('CITIZEN');
      else if (currentUser.role === 'DRIVER') setActiveView('DRIVER');
      else if (currentUser.role === 'HOSPITAL_ADMIN') setActiveView('HOSPITAL_ADMIN');
      else if (currentUser.role === 'DISPATCHER') setActiveView('DISPATCHER');
    }
  }, [currentUser]);

  // Google Maps Platform Quota Exceeded Event Listener (Tier 2 in-app handling)
  useEffect(() => {
    const handleQuotaExceeded = () => {
      setShowQuotaWarning(true);
    };
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  const handleRoleSuccess = (role: UserRole) => {
    switchRole(role);
    if (role === 'CITIZEN') setActiveView('CITIZEN');
    else if (role === 'DRIVER') setActiveView('DRIVER');
    else if (role === 'HOSPITAL_ADMIN') setActiveView('HOSPITAL_ADMIN');
    else if (role === 'DISPATCHER') setActiveView('DISPATCHER');
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono selection:bg-rose-600 selection:text-white flex flex-col">
      {/* Google Maps Platform Quota Warning Banner */}
      {showQuotaWarning && (
        <div className="bg-amber-950 border-b border-amber-600 text-amber-200 px-4 py-2 text-xs text-center sticky top-0 z-50 font-mono">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-bold text-amber-100 hover:text-white"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* TOP COMMAND NAVIGATION BAR (Visible when in portal views or logged in) */}
      {activeView !== 'LANDING' && (
        <nav className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur border-b border-neutral-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveView('LANDING')}
              className="flex items-center gap-2 group cursor-pointer"
              title="Return to Anonymous Emergency Landing"
            >
              <div className="w-7 h-7 bg-rose-600 text-white font-black text-xs flex items-center justify-center rounded">
                108
              </div>
              <span className="font-bold text-xs uppercase tracking-wider text-white group-hover:text-rose-400 transition">
                Mysuru Emergency
              </span>
            </button>

            <span className="text-neutral-700 hidden sm:inline">|</span>

            {/* Portal Switcher Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
              <button
                onClick={() => setActiveView('CITIZEN')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded transition border ${
                  activeView === 'CITIZEN'
                    ? 'bg-neutral-800 text-cyan-300 border-cyan-500/60 font-bold'
                    : 'bg-transparent text-neutral-400 hover:text-white border-transparent'
                }`}
              >
                <User className="w-3 h-3 text-cyan-400" />
                <span className="hidden md:inline">Citizen</span> Route
              </button>

              <button
                onClick={() => setActiveView('DRIVER')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded transition border ${
                  activeView === 'DRIVER'
                    ? 'bg-neutral-800 text-amber-300 border-amber-500/60 font-bold'
                    : 'bg-transparent text-neutral-400 hover:text-white border-transparent'
                }`}
              >
                <Ambulance className="w-3 h-3 text-amber-400" />
                <span>Driver HUD</span>
              </button>

              <button
                onClick={() => setActiveView('HOSPITAL_ADMIN')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded transition border ${
                  activeView === 'HOSPITAL_ADMIN'
                    ? 'bg-neutral-800 text-emerald-300 border-emerald-500/60 font-bold'
                    : 'bg-transparent text-neutral-400 hover:text-white border-transparent'
                }`}
              >
                <Building2 className="w-3 h-3 text-emerald-400" />
                <span className="hidden md:inline">Hospital</span> Admin
              </button>

              <button
                onClick={() => setActiveView('DISPATCHER')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded transition border ${
                  activeView === 'DISPATCHER'
                    ? 'bg-neutral-800 text-rose-300 border-rose-500/60 font-bold'
                    : 'bg-transparent text-neutral-400 hover:text-white border-transparent'
                }`}
              >
                <Radio className="w-3 h-3 text-rose-400" />
                <span>Dispatcher</span>
              </button>

              <button
                onClick={() => setActiveView('HOSPITAL_INTELLIGENCE')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded transition border ${
                  activeView === 'HOSPITAL_INTELLIGENCE'
                    ? 'bg-neutral-800 text-violet-300 border-violet-500/60 font-bold'
                    : 'bg-transparent text-neutral-400 hover:text-white border-transparent'
                }`}
                title="12-Layer Hospital Intelligence & AI Risk Reasoner"
              >
                <Brain className="w-3 h-3 text-violet-400" />
                <span className="hidden sm:inline">12-Layer</span> Intel
              </button>
            </div>
          </div>

          {/* Right Status / Auth Info */}
          <div className="flex items-center gap-2">
            {currentUser ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="hidden lg:inline text-[10px] text-neutral-400">
                  {currentUser.role === 'CITIZEN' && (currentUser as any).fullName}
                  {currentUser.role === 'DRIVER' && (currentUser as any).driverName}
                  {currentUser.role === 'HOSPITAL_ADMIN' && (currentUser as any).adminName}
                  {currentUser.role === 'DISPATCHER' && (currentUser as any).officerName}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 bg-neutral-900 border border-neutral-700 text-neutral-300 uppercase">
                  {currentUser.role}
                </span>
                <button
                  onClick={logout}
                  className="flex items-center gap-1 px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white text-xs transition"
                  title="Logout to Anonymous Emergency"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Exit</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-3 py-1 bg-white hover:bg-neutral-200 text-black font-bold text-xs uppercase transition border border-white"
              >
                [ Sign In ]
              </button>
            )}
          </div>
        </nav>
      )}

      {/* PORTAL CONTENT ROUTING */}
      <div className="flex-1">
        {activeView === 'LANDING' && (
          <MinimalLanding
            onOpenAuth={() => setShowAuthModal(true)}
            onOpenHospitalIntel={() => setActiveView('HOSPITAL_INTELLIGENCE')}
            onOpenDispatcher={() => setActiveView('DISPATCHER')}
            onOpenCitizenPortal={() => setActiveView('CITIZEN')}
          />
        )}

        {activeView === 'CITIZEN' && <CitizenHome />}

        {activeView === 'DRIVER' && <DriverHome />}

        {activeView === 'HOSPITAL_ADMIN' && <HospitalHome />}

        {activeView === 'DISPATCHER' && (
          <DispatcherPortal
            onOpenAIExplanation={(candidate) => setAiModalCandidate(candidate)}
          />
        )}

        {activeView === 'HOSPITAL_INTELLIGENCE' && (
          <HospitalIntelligenceProfile
            onBackToMain={() =>
              setActiveView(currentUser ? (currentUser.role as PortalView) : 'LANDING')
            }
          />
        )}
      </div>

      {/* Floating Simulation Stress Testing Trigger (Discreet bottom-right button) */}
      <div className="fixed bottom-3 right-3 z-30 flex items-center gap-2">
        <button
          onClick={() => setShowSimModal(true)}
          className="p-2.5 bg-neutral-900/95 hover:bg-neutral-800 text-neutral-300 hover:text-amber-400 border border-neutral-700 hover:border-amber-500/60 backdrop-blur rounded-full shadow-2xl transition cursor-pointer"
          title="Open Simulation Stress Controls (Congestion, Bed Exhaustion, Road Closures)"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>

      {/* AI Clinical & Triage Explanation Modal */}
      {aiModalCandidate && (
        <AIExplanationModal
          candidate={aiModalCandidate}
          onClose={() => setAiModalCandidate(null)}
        />
      )}

      {/* Auth Gateway Modal */}
      <AuthGateway
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccessRole={handleRoleSuccess}
      />

      {/* Simulation Controls Modal */}
      <SimulationControlsModal
        isOpen={showSimModal}
        onClose={() => setShowSimModal(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <EmergencyProvider>
      <MainAppRouter />
    </EmergencyProvider>
  );
}
