import React, { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { UserRole, AuthUser, UserProfile, DriverProfile, HospitalAdminProfile } from '../types';
import {
  User,
  Ambulance,
  Building2,
  X,
  ChevronLeft,
  ArrowRight,
  Shield,
  KeyRound,
  Phone,
  FileText,
  Lock,
  Radio,
} from 'lucide-react';

interface AuthGatewayProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessRole: (role: UserRole) => void;
}

export const AuthGateway: React.FC<AuthGatewayProps> = ({
  isOpen,
  onClose,
  onSuccessRole,
}) => {
  const { login, hospitals } = useEmergency();

  // Step 1: Role Selection, Step 2: Auth Form
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Citizen fields
  const [citizenName, setCitizenName] = useState<string>('Yashas Gowda');
  const [citizenPhone, setCitizenPhone] = useState<string>('+91 98450 12345');
  const [citizenAddress, setCitizenAddress] = useState<string>('Kuvempunagar, Mysuru');
  const [citizenBlood, setCitizenBlood] = useState<string>('O+');

  // Driver fields
  const [driverName, setDriverName] = useState<string>('Mahesh Kumar');
  const [driverPlate, setDriverPlate] = useState<string>('KA-09-EM-1081');
  const [driverPhone, setDriverPhone] = useState<string>('+91 98451 99991');

  // Hospital fields
  const [hospitalId, setHospitalId] = useState<string>('MYS-HOSP-01');
  const [adminName, setAdminName] = useState<string>('Dr. C. P. Nanjaraj');
  const [adminPin, setAdminPin] = useState<string>('108');

  if (!isOpen) return null;

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    let user: AuthUser;

    if (selectedRole === 'CITIZEN') {
      user = {
        id: `CITIZEN-${Date.now()}`,
        role: 'CITIZEN',
        fullName: citizenName.trim() || 'Citizen User',
        phone: citizenPhone.trim() || '+91 98450 12345',
        homeAddress: citizenAddress.trim() || 'Mysuru',
        emergencyContact: '+91 98450 99999',
        bloodGroup: citizenBlood,
      };
    } else if (selectedRole === 'DRIVER') {
      user = {
        id: `DRIVER-${Date.now()}`,
        role: 'DRIVER',
        driverName: driverName.trim() || 'Driver Officer',
        phone: driverPhone.trim() || '+91 98451 99991',
        vehiclePlate: driverPlate.trim() || 'KA-09-EM-1081',
        baseStation: 'Suburban Bus Stand / Mysore Palace Zone',
        ambulanceId: 'AMB-01',
      };
    } else if (selectedRole === 'DISPATCHER') {
      user = {
        id: `DISPATCH-${Date.now()}`,
        role: 'DISPATCHER',
        officerName: 'Senior Officer Raghu V.',
        badgeId: 'KA-MYS-108-OPS',
        phone: '+91 821 241 8108',
        deskId: 'DESK-01 (Triage Control)',
      };
    } else {
      user = {
        id: `ADMIN-${Date.now()}`,
        role: 'HOSPITAL_ADMIN',
        hospitalId: hospitalId || 'MYS-HOSP-01',
        adminName: adminName.trim() || 'Hospital Superintendent',
        officialEmail: 'emergency@mmcri.karnataka.gov.in',
        hotline: '+91 821 252 0512',
      };
    }

    login(user);
    onSuccessRole(selectedRole);
    onClose();
  };

  const quickDemoLogin = (role: UserRole) => {
    setSelectedRole(role);
    let user: AuthUser;
    if (role === 'CITIZEN') {
      user = {
        id: 'DEMO-CITIZEN',
        role: 'CITIZEN',
        fullName: 'Yashas Gowda',
        phone: '+91 98450 12345',
        homeAddress: 'Kuvempunagar, Mysuru',
        emergencyContact: '+91 98450 99999',
        bloodGroup: 'O+',
      };
    } else if (role === 'DRIVER') {
      user = {
        id: 'DEMO-DRIVER',
        role: 'DRIVER',
        driverName: 'Mahesh Kumar',
        phone: '+91 98451 99991',
        vehiclePlate: 'KA-09-EM-1081',
        baseStation: 'Mysore Suburban Station',
        ambulanceId: 'AMB-01',
      };
    } else if (role === 'DISPATCHER') {
      user = {
        id: 'DEMO-DISPATCHER',
        role: 'DISPATCHER',
        officerName: 'Senior Officer Raghu V.',
        badgeId: 'KA-MYS-108-OPS',
        phone: '+91 821 241 8108',
        deskId: 'DESK-01 (Triage Control)',
      };
    } else {
      user = {
        id: 'DEMO-ADMIN',
        role: 'HOSPITAL_ADMIN',
        hospitalId: 'MYS-HOSP-01',
        adminName: 'Dr. C. P. Nanjaraj',
        officialEmail: 'admin@mmcri.gov.in',
        hotline: '+91 821 252 0512',
      };
    }
    login(user);
    onSuccessRole(role);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 font-mono">
      <div className="relative w-full max-w-lg bg-black border-2 border-neutral-700 shadow-2xl p-6 space-y-6 text-white">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="p-1 hover:bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white mr-1"
                title="Back to Role Selection"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <span className="font-bold text-xs uppercase tracking-wider text-rose-500">
              [ PORTAL ACCESS ]
            </span>
            <span className="text-neutral-500">|</span>
            <span className="text-xs uppercase text-neutral-300">
              {step === 1 ? 'STEP 1: SELECT ROLE' : `${selectedRole} AUTH`}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white border border-transparent hover:border-neutral-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: ROLE SELECTION (3 LARGE ICON-DRIVEN CARDS) */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-xs text-neutral-400 uppercase tracking-tight text-center">
              Select your operational role to access dedicated homepage:
            </p>

            <div className="grid grid-cols-1 gap-3">
              {/* Citizen */}
              <button
                onClick={() => handleSelectRole('CITIZEN')}
                className="p-4 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-white transition flex items-center justify-between text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-neutral-900 border border-neutral-700 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 transition">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm uppercase text-white group-hover:text-cyan-400 transition">
                      Citizen / Public
                    </h3>
                    <p className="text-[11px] text-neutral-400">
                      Persistent Emergency, nearby hospitals & 24/7 pharmacies directory
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-600 group-hover:text-white transition" />
              </button>

              {/* Ambulance Driver */}
              <button
                onClick={() => handleSelectRole('DRIVER')}
                className="p-4 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-white transition flex items-center justify-between text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-neutral-900 border border-neutral-700 flex items-center justify-center text-amber-400 group-hover:border-amber-400 transition">
                    <Ambulance className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm uppercase text-white group-hover:text-amber-400 transition">
                      Ambulance Driver
                    </h3>
                    <p className="text-[11px] text-neutral-400">
                      Live dispatch alerts, dynamic patient info & turn-by-turn directions
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-600 group-hover:text-white transition" />
              </button>

              {/* Hospital Administrator */}
              <button
                onClick={() => handleSelectRole('HOSPITAL_ADMIN')}
                className="p-4 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-white transition flex items-center justify-between text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-neutral-900 border border-neutral-700 flex items-center justify-center text-emerald-400 group-hover:border-emerald-400 transition">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm uppercase text-white group-hover:text-emerald-400 transition">
                      Hospital Admin
                    </h3>
                    <p className="text-[11px] text-neutral-400">
                      Real-time bed & doctor availability steppers and ED divert toggles
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-600 group-hover:text-white transition" />
              </button>

              {/* Emergency Dispatcher */}
              <button
                onClick={() => handleSelectRole('DISPATCHER')}
                className="p-4 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-white transition flex items-center justify-between text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-neutral-900 border border-neutral-700 flex items-center justify-center text-rose-400 group-hover:border-rose-400 transition">
                    <Radio className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm uppercase text-white group-hover:text-rose-400 transition">
                      Dispatcher Control
                    </h3>
                    <p className="text-[11px] text-neutral-400">
                      Active incident triage, ambulance dispatching, destination overrides & audit log
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-600 group-hover:text-white transition" />
              </button>
            </div>

            {/* Quick 1-Click Demo Logins */}
            <div className="pt-3 border-t border-neutral-900">
              <span className="text-[10px] text-neutral-500 uppercase block mb-1.5 text-center">
                Instant 1-Click Demo Access:
              </span>
              <div className="grid grid-cols-4 gap-2 text-center">
                <button
                  onClick={() => quickDemoLogin('CITIZEN')}
                  className="py-1 px-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-[10px] text-neutral-300 uppercase font-bold"
                >
                  [ Citizen ]
                </button>
                <button
                  onClick={() => quickDemoLogin('DRIVER')}
                  className="py-1 px-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-[10px] text-neutral-300 uppercase font-bold"
                >
                  [ Driver ]
                </button>
                <button
                  onClick={() => quickDemoLogin('HOSPITAL_ADMIN')}
                  className="py-1 px-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-[10px] text-neutral-300 uppercase font-bold"
                >
                  [ Admin ]
                </button>
                <button
                  onClick={() => quickDemoLogin('DISPATCHER')}
                  className="py-1 px-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-[10px] text-rose-300 border-rose-900/60 uppercase font-bold"
                >
                  [ Dispatch ]
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: AUTH FORMS (LOGIN VS REGISTER) */}
        {step === 2 && selectedRole && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Login / Register Toggle */}
            <div className="grid grid-cols-2 border border-neutral-800 p-0.5 bg-neutral-950">
              <button
                type="button"
                onClick={() => setAuthMode('LOGIN')}
                className={`py-1 text-xs uppercase font-bold transition ${
                  authMode === 'LOGIN'
                    ? 'bg-white text-black'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                [ Login ]
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('REGISTER')}
                className={`py-1 text-xs uppercase font-bold transition ${
                  authMode === 'REGISTER'
                    ? 'bg-white text-black'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                [ Register / Sign Up ]
              </button>
            </div>

            {/* CITIZEN FORM */}
            {selectedRole === 'CITIZEN' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase block mb-1">
                    Full Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={citizenName}
                    onChange={(e) => setCitizenName(e.target.value)}
                    placeholder="e.g. Yashas Gowda"
                    className="w-full p-2 bg-neutral-950 border border-neutral-700 text-white focus:border-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-neutral-400 uppercase block mb-1">
                    Phone Number:
                  </label>
                  <input
                    type="tel"
                    required
                    value={citizenPhone}
                    onChange={(e) => setCitizenPhone(e.target.value)}
                    placeholder="+91 98450 12345"
                    className="w-full p-2 bg-neutral-950 border border-neutral-700 text-white focus:border-white focus:outline-none"
                  />
                </div>

                {authMode === 'REGISTER' && (
                  <>
                    <div>
                      <label className="text-[10px] text-neutral-400 uppercase block mb-1">
                        Home Address / Locality:
                      </label>
                      <input
                        type="text"
                        value={citizenAddress}
                        onChange={(e) => setCitizenAddress(e.target.value)}
                        placeholder="e.g. Kuvempunagar, Mysuru"
                        className="w-full p-2 bg-neutral-950 border border-neutral-700 text-white focus:border-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-neutral-400 uppercase block mb-1">
                        Blood Group:
                      </label>
                      <select
                        value={citizenBlood}
                        onChange={(e) => setCitizenBlood(e.target.value)}
                        className="w-full p-2 bg-neutral-950 border border-neutral-700 text-white focus:border-white focus:outline-none"
                      >
                        <option value="O+">O Positive (O+)</option>
                        <option value="O-">O Negative (O-)</option>
                        <option value="A+">A Positive (A+)</option>
                        <option value="A-">A Negative (A-)</option>
                        <option value="B+">B Positive (B+)</option>
                        <option value="B-">B Negative (B-)</option>
                        <option value="AB+">AB Positive (AB+)</option>
                        <option value="AB-">AB Negative (AB-)</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* DRIVER FORM */}
            {selectedRole === 'DRIVER' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase block mb-1">
                    Driver Full Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="e.g. Mahesh Kumar"
                    className="w-full p-2 bg-neutral-950 border border-neutral-700 text-white focus:border-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-neutral-400 uppercase block mb-1">
                    Ambulance Vehicle ID / Plate:
                  </label>
                  <input
                    type="text"
                    required
                    value={driverPlate}
                    onChange={(e) => setDriverPlate(e.target.value)}
                    placeholder="e.g. KA-09-EM-1081"
                    className="w-full p-2 bg-neutral-950 border border-neutral-700 text-white focus:border-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-neutral-400 uppercase block mb-1">
                    Duty Phone Number:
                  </label>
                  <input
                    type="tel"
                    required
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    placeholder="+91 98451 99991"
                    className="w-full p-2 bg-neutral-950 border border-neutral-700 text-white focus:border-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* HOSPITAL ADMIN FORM */}
            {selectedRole === 'HOSPITAL_ADMIN' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase block mb-1">
                    Assign Hospital Facility:
                  </label>
                  <select
                    value={hospitalId}
                    onChange={(e) => setHospitalId(e.target.value)}
                    className="w-full p-2 bg-neutral-950 border border-neutral-700 text-white focus:border-white focus:outline-none"
                  >
                    {hospitals.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-neutral-400 uppercase block mb-1">
                    Administrator Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="e.g. Dr. C. P. Nanjaraj"
                    className="w-full p-2 bg-neutral-950 border border-neutral-700 text-white focus:border-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-neutral-400 uppercase block mb-1">
                    Security Admin PIN:
                  </label>
                  <input
                    type="password"
                    required
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    placeholder="Default PIN: 108"
                    className="w-full p-2 bg-neutral-950 border border-neutral-700 text-white focus:border-white focus:outline-none"
                  />
                  <span className="text-[9px] text-neutral-500 mt-0.5 block">
                    (Standard Demo Admin PIN is 108)
                  </span>
                </div>
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-white hover:bg-neutral-200 text-black font-bold uppercase text-xs tracking-wider transition border border-white"
              >
                {authMode === 'LOGIN' ? '[ Complete Login → ]' : '[ Complete Registration → ]'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
