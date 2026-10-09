import React, { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { AuthUser, UserRole, UserProfile, DriverProfile, HospitalAdminProfile } from '../types';
import {
  User,
  Shield,
  Ambulance,
  Building2,
  X,
  CheckCircle2,
  Phone,
  MapPin,
  Lock,
  Mail,
  HeartPulse,
  Sparkles,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: UserRole;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'CITIZEN',
}) => {
  const { login, hospitals, ambulances } = useEmergency();
  const [selectedRole, setSelectedRole] = useState<UserRole>(defaultRole);
  const [isRegister, setIsRegister] = useState<boolean>(false);

  // Form states for Citizen
  const [citizenName, setCitizenName] = useState('Ananya Sharma');
  const [citizenPhone, setCitizenPhone] = useState('+91 98451 23456');
  const [citizenAddress, setCitizenAddress] = useState('Vidyaranyapuram 4th Cross, Mysuru');
  const [citizenContact, setCitizenContact] = useState('+91 98450 99887 (Father)');
  const [citizenBloodGroup, setCitizenBloodGroup] = useState('O+');

  // Form states for Driver
  const [driverName, setDriverName] = useState('Mahesh K.');
  const [driverPhone, setDriverPhone] = useState('+91 98450 12345');
  const [driverPlate, setDriverPlate] = useState('KA-09-EM-1081');
  const [driverBase, setDriverBase] = useState('Suburban Bus Stand / Mysore Palace Post');
  const [driverPin, setDriverPin] = useState('1081');

  // Form states for Hospital Admin
  const [adminHospitalId, setAdminHospitalId] = useState(hospitals[0]?.id || 'MYS-HOSP-01');
  const [adminName, setAdminName] = useState('Dr. S. R. Channabasappa');
  const [adminEmail, setAdminEmail] = useState('chief.triage@mmcri.karnataka.gov.in');
  const [adminHotline, setAdminHotline] = useState('+91 821 252 0515');
  const [adminAccessCode, setAdminAccessCode] = useState('ADMIN770');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole === 'CITIZEN') {
      const user: UserProfile = {
        id: `usr_${Date.now()}`,
        role: 'CITIZEN',
        fullName: citizenName,
        phone: citizenPhone,
        homeAddress: citizenAddress,
        emergencyContact: citizenContact,
        bloodGroup: citizenBloodGroup,
      };
      login(user);
    } else if (selectedRole === 'DRIVER') {
      const matchedAmb = ambulances.find((a) => a.vehiclePlate === driverPlate) || ambulances[0];
      const driver: DriverProfile = {
        id: `drv_${Date.now()}`,
        role: 'DRIVER',
        driverName,
        phone: driverPhone,
        vehiclePlate: driverPlate,
        baseStation: driverBase,
        ambulanceId: matchedAmb.id,
      };
      login(driver);
    } else if (selectedRole === 'HOSPITAL_ADMIN') {
      const admin: HospitalAdminProfile = {
        id: `adm_${Date.now()}`,
        role: 'HOSPITAL_ADMIN',
        hospitalId: adminHospitalId,
        adminName,
        officialEmail: adminEmail,
        hotline: adminHotline,
      };
      login(admin);
    }
    onClose();
  };

  const setDemoCitizen = () => {
    setSelectedRole('CITIZEN');
    const user: UserProfile = {
      id: 'demo_citizen',
      role: 'CITIZEN',
      fullName: 'Rahul V. Gowda',
      phone: '+91 98455 43210',
      homeAddress: 'KRS Road, Yadavagiri, Mysuru',
      emergencyContact: '+91 98450 11223 (Spouse)',
      bloodGroup: 'B+',
    };
    login(user);
    onClose();
  };

  const setDemoDriver = () => {
    setSelectedRole('DRIVER');
    const driver: DriverProfile = {
      id: 'demo_driver',
      role: 'DRIVER',
      driverName: 'Suresh R.',
      phone: '+91 98450 67890',
      vehiclePlate: 'KA-09-EM-1082',
      baseStation: 'Vijayanagar Water Tank / Outer Ring Road',
      ambulanceId: 'AMB-1082',
    };
    login(driver);
    onClose();
  };

  const setDemoAdmin = (hospId: string = 'MYS-HOSP-01') => {
    setSelectedRole('HOSPITAL_ADMIN');
    const hosp = hospitals.find((h) => h.id === hospId) || hospitals[0];
    const admin: HospitalAdminProfile = {
      id: 'demo_admin',
      role: 'HOSPITAL_ADMIN',
      hospitalId: hosp.id,
      adminName: `Medical Superintendent (${hosp.name.split('-')[0].trim()})`,
      officialEmail: `admin@${hosp.id.toLowerCase()}.health.gov`,
      hotline: hosp.emergencyPhone,
    };
    login(admin);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">
                {isRegister ? 'Portal Registration' : 'Secure Portal Access'}
              </h3>
              <p className="text-xs text-slate-400">
                Mysuru Emergency Network • Role-Based Authentication
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

        {/* Quick Demo Credentials Banner */}
        <div className="px-6 pt-3 pb-2 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/40 border-b border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1.5">
            <span className="flex items-center gap-1 font-semibold text-cyan-400">
              <Sparkles className="w-3.5 h-3.5" /> 1-Click Fast Evaluator Sign-In:
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={setDemoCitizen}
              type="button"
              className="py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-medium text-slate-200 text-center transition"
            >
              👤 Citizen Demo
            </button>
            <button
              onClick={setDemoDriver}
              type="button"
              className="py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-medium text-amber-300 text-center transition"
            >
              🚑 Driver (KA-09)
            </button>
            <button
              onClick={() => setDemoAdmin('MYS-HOSP-01')}
              type="button"
              className="py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-medium text-emerald-300 text-center transition"
            >
              🏥 KR Hospital Admin
            </button>
          </div>
        </div>

        {/* Role Selector Tabs */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-3 p-1 rounded-xl bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedRole('CITIZEN')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition ${
                selectedRole === 'CITIZEN'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Citizen</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('DRIVER')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition ${
                selectedRole === 'DRIVER'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Ambulance className="w-3.5 h-3.5" />
              <span>Driver</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('HOSPITAL_ADMIN')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition ${
                selectedRole === 'HOSPITAL_ADMIN'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Hospital</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {selectedRole === 'CITIZEN' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={citizenName}
                    onChange={(e) => setCitizenName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-rose-500"
                    placeholder="Enter full name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="tel"
                      required
                      value={citizenPhone}
                      onChange={(e) => setCitizenPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-rose-500"
                      placeholder="+91 98450..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Blood Group
                  </label>
                  <div className="relative">
                    <HeartPulse className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <select
                      value={citizenBloodGroup}
                      onChange={(e) => setCitizenBloodGroup(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-rose-500"
                    >
                      <option value="O+">O+ Positive</option>
                      <option value="O-">O- Negative</option>
                      <option value="A+">A+ Positive</option>
                      <option value="A-">A- Negative</option>
                      <option value="B+">B+ Positive</option>
                      <option value="B-">B- Negative</option>
                      <option value="AB+">AB+ Positive</option>
                      <option value="AB-">AB- Negative</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Home Address (Mysuru)
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={citizenAddress}
                    onChange={(e) => setCitizenAddress(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-rose-500"
                    placeholder="Locality, cross road, Mysuru"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Emergency Contact Details
                </label>
                <input
                  type="text"
                  required
                  value={citizenContact}
                  onChange={(e) => setCitizenContact(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-rose-500"
                  placeholder="e.g. +91 98450 12345 (Father)"
                />
              </div>
            </div>
          )}

          {selectedRole === 'DRIVER' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Driver Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="tel"
                      required
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Ambulance Vehicle Plate
                  </label>
                  <div className="relative">
                    <Ambulance className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <select
                      value={driverPlate}
                      onChange={(e) => setDriverPlate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                    >
                      {ambulances.map((amb) => (
                        <option key={amb.id} value={amb.vehiclePlate}>
                          {amb.vehiclePlate} ({amb.driverName})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Base Station Location
                </label>
                <input
                  type="text"
                  required
                  value={driverBase}
                  onChange={(e) => setDriverBase(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500"
                  placeholder="e.g. Suburban Bus Stand / Mysore Palace Post"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Driver Security PIN
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={driverPin}
                    onChange={(e) => setDriverPin(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500"
                    placeholder="4-digit PIN"
                  />
                </div>
              </div>
            </div>
          )}

          {selectedRole === 'HOSPITAL_ADMIN' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Select Hospital Facility
                </label>
                <select
                  value={adminHospitalId}
                  onChange={(e) => setAdminHospitalId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500"
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
                  Administrator / Superintendent Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Official Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Emergency Desk Hotline
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="tel"
                      required
                      value={adminHotline}
                      onChange={(e) => setAdminHotline(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Hospital Admin Access Key
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={adminAccessCode}
                    onChange={(e) => setAdminAccessCode(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500"
                    placeholder="Enter security key"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm text-white shadow-lg transition active:scale-98 ${
                selectedRole === 'CITIZEN'
                  ? 'bg-rose-600 hover:bg-rose-500'
                  : selectedRole === 'DRIVER'
                  ? 'bg-amber-600 hover:bg-amber-500'
                  : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              {isRegister ? 'Register & Enter Dashboard' : 'Confirm & Authenticate'}
            </button>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="hover:underline text-cyan-400"
            >
              {isRegister
                ? 'Already registered? Switch to Login'
                : 'Need a new credential? Switch to Register'}
            </button>
            <span className="text-slate-500">Karnataka State 108/112 Hub</span>
          </div>
        </form>
      </div>
    </div>
  );
};
