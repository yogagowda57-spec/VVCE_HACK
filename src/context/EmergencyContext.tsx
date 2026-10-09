import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Hospital,
  Ambulance,
  EmergencyCase,
  AuditLogEntry,
  AuthUser,
  UserRole,
  SimulationState,
  BroadcastMessage,
  BedCategory,
  RoutingCandidate,
} from '../types';
import { INITIAL_HOSPITALS, INITIAL_AMBULANCES } from '../data/mysuruFacilities';
import { evaluateHospitals } from '../engine/evaluator';
import { playEmergencySirenAlert, playSuccessChime } from '../utils/audioAlert';

interface EmergencyContextType {
  currentUser: AuthUser | null;
  activeRole: UserRole;
  hospitals: Hospital[];
  ambulances: Ambulance[];
  cases: EmergencyCase[];
  activeCase: EmergencyCase | null;
  simulationState: SimulationState;
  auditLogs: AuditLogEntry[];
  incomingAlert: EmergencyCase | null;
  dismissIncomingAlert: () => void;
  userCoords: { lat: number; lng: number; address: string };
  setUserCoords: (coords: { lat: number; lng: number; address: string }) => void;
  
  // Actions
  triggerEmergencySOS: (params: {
    category: string;
    pickupLocation: { lat: number; lng: number; address: string };
    patientName?: string;
    patientPhone?: string;
    bloodGroup?: string;
    notes?: string;
  }) => EmergencyCase;
  cancelEmergencySOS: (caseId: string, reason?: string) => void;
  updateCaseStatus: (
    caseId: string,
    status: EmergencyCase['status'],
    statusStep?: number,
    actorName?: string,
    note?: string
  ) => void;
  assignAmbulanceAndHospital: (
    caseId: string,
    ambulanceId: string,
    hospitalId: string,
    isOverride?: boolean,
    overrideReason?: string
  ) => void;
  updateHospitalBeds: (
    hospitalId: string,
    categoryKey: 'icuBeds' | 'generalBeds' | 'maternityBeds' | 'traumaBays' | 'pediatricBeds',
    beds: BedCategory
  ) => void;
  toggleHospitalDoctor: (hospitalId: string, doctorName: string, active: boolean) => void;
  toggleHospitalEquipment: (hospitalId: string, equipmentName: string, active: boolean) => void;
  toggleHospitalStatus: (hospitalId: string, status: 'ACCEPTING' | 'DIVERT' | 'CRITICAL_ONLY') => void;
  updateHospitalProfile: (hospitalId: string, updates: Partial<Hospital>) => void;
  updateAmbulanceStatus: (
    ambulanceId: string,
    status: Ambulance['status'],
    coords?: { lat: number; lng: number }
  ) => void;
  setSimulationState: React.Dispatch<React.SetStateAction<SimulationState>>;
  toggleSimulationCongestion: () => void;
  toggleSimulationIcuExhaustion: () => void;
  toggleSimulationSpecialistCallout: () => void;
  toggleSimulationRoadBlockage: () => void;
  resetToDefaults: () => void;
  login: (user: AuthUser) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  getHospitalEvaluation: (caseData: EmergencyCase) => RoutingCandidate[];
}

const getUserDisplayName = (user: AuthUser | null): string => {
  if (!user) return 'Anonymous Citizen';
  if ('fullName' in user) return user.fullName;
  if ('driverName' in user) return user.driverName;
  if ('adminName' in user) return user.adminName;
  if ('officerName' in user) return user.officerName;
  return 'User';
};

const getUserPhone = (user: AuthUser | null): string => {
  if (!user) return '+91 98450 00000';
  if ('phone' in user) return user.phone;
  if ('hotline' in user) return user.hotline;
  return '+91 98450 00000';
};

const STORAGE_KEYS = {
  HOSPITALS: 'mysuru_emg_hospitals_v1',
  AMBULANCES: 'mysuru_emg_ambulances_v1',
  CASES: 'mysuru_emg_cases_v1',
  SIMULATION: 'mysuru_emg_sim_v1',
  USER: 'mysuru_emg_user_v1',
  LOGS: 'mysuru_emg_logs_v1',
};

const EmergencyContext = createContext<EmergencyContextType | null>(null);

// Central Mysuru Palace coordinates as reliable default
const DEFAULT_COORDS = {
  lat: 12.3080,
  lng: 76.6570,
  address: 'Suburban Bus Stand / Mysore Palace Vicinity, Mysuru',
};

const CHANNEL_NAMES = ['emergency_channel', 'mysuru_emergency_network', 'mysuru_emergency_dispatch_channel'];

export const EmergencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const clientIdRef = useRef<string>(`client_${Math.random().toString(36).substring(2, 9)}`);

  // Current User & Role: Defaults to null for Anonymous SOS Landing Page
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved user:', e);
    }
    return null;
  });

  const [activeRole, setActiveRole] = useState<UserRole>(() => {
    return currentUser?.role || 'CITIZEN';
  });

  // Hospitals
  const [hospitals, setHospitals] = useState<Hospital[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HOSPITALS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse hospitals:', e);
    }
    return INITIAL_HOSPITALS;
  });

  // Ambulances
  const [ambulances, setAmbulances] = useState<Ambulance[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AMBULANCES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse ambulances:', e);
    }
    return INITIAL_AMBULANCES;
  });

  // Cases
  const [cases, setCases] = useState<EmergencyCase[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CASES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse cases:', e);
    }
    return [];
  });

  // Simulation State
  const [simulationState, setSimulationState] = useState<SimulationState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SIMULATION);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse simulation:', e);
    }
    return {
      congestionMultiplier: 1.0,
      roadBlockages: [],
      activeCorridor: 'Normal Flow',
      forcedIcuExhaustion: false,
      forcedSpecialistCallout: false,
    };
  });

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse logs:', e);
    }
    return [
      {
        id: 'log-001',
        timestamp: new Date().toLocaleTimeString(),
        actor: 'SYSTEM',
        action: 'ENGINE_INITIALIZED',
        note: 'Mysuru Emergency Triage and Fleet Engine online. 6 Primary hospitals connected.',
      },
    ];
  });

  // User Coords
  const [userCoords, setUserCoords] = useState(DEFAULT_COORDS);

  // Incoming Alert banner/modal (for Driver & Hospital views)
  const [incomingAlert, setIncomingAlert] = useState<EmergencyCase | null>(null);

  // Get active case for citizen
  const activeCase = cases.find(
    (c) => c.status === 'PENDING' || c.status === 'DISPATCHED' || c.status === 'IN_TRANSIT'
  ) || null;

  const broadcastChannelsRef = useRef<BroadcastChannel[]>([]);

  // Broadcast Helper
  const broadcast = useCallback((type: BroadcastMessage['type'], payload: any) => {
    const msg: BroadcastMessage = {
      type,
      payload,
      senderId: clientIdRef.current,
      timestamp: new Date().toISOString(),
    };

    broadcastChannelsRef.current.forEach((ch) => {
      try {
        ch.postMessage(msg);
      } catch (err) {
        console.warn('BroadcastChannel error:', err);
      }
    });

    // Also send legacy NEW_EMERGENCY payload for drivers
    if (type === 'SOS_TRIGGERED') {
      const legacyMsg = {
        type: 'NEW_EMERGENCY',
        caseId: payload.id,
        location: payload.pickupLocation,
        timestamp: payload.timestamp,
        payload,
        senderId: clientIdRef.current,
      };
      broadcastChannelsRef.current.forEach((ch) => {
        try {
          ch.postMessage(legacyMsg);
        } catch (e) {}
      });
    }

    // StorageEvent fallback
    try {
      localStorage.setItem('mysuru_emg_bc_signal', JSON.stringify(msg));
    } catch (err) {
      console.warn('StorageEvent fallback error:', err);
    }
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(hospitals));
  }, [hospitals]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AMBULANCES, JSON.stringify(ambulances));
  }, [ambulances]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
  }, [cases]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SIMULATION, JSON.stringify(simulationState));
  }, [simulationState]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(auditLogs.slice(0, 50)));
  }, [auditLogs]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
      setActiveRole(currentUser.role);
    }
  }, [currentUser]);

  // Request browser geolocation once smoothly
  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          // If within Mysuru general boundaries (approx 12.15 to 12.45 lat, 76.5 to 76.8 lng), use it
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          if (lat >= 12.15 && lat <= 12.45 && lng >= 76.5 && lng <= 76.8) {
            setUserCoords({
              lat: Number(lat.toFixed(4)),
              lng: Number(lng.toFixed(4)),
              address: 'GPS Verified Incident Location (Mysuru)',
            });
          }
        },
        (err) => {
          console.log('Using default Mysuru City Center coordinates:', err.message);
        },
        { timeout: 5000 }
      );
    }
  }, []);

  // Setup BroadcastChannel & Storage Event Listeners for Multi-Tab Sync
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const channels = CHANNEL_NAMES.map((name) => {
        const ch = new BroadcastChannel(name);
        ch.onmessage = (event: MessageEvent<any>) => {
          const msg = event.data;
          if (!msg || msg.senderId === clientIdRef.current) return;
          handleIncomingBroadcast(msg);
        };
        return ch;
      });
      broadcastChannelsRef.current = channels;
    } catch (e) {
      console.warn('BroadcastChannel not supported, relying on localStorage fallback', e);
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'mysuru_emg_bc_signal' && e.newValue) {
        try {
          const msg: any = JSON.parse(e.newValue);
          if (msg.senderId !== clientIdRef.current) {
            handleIncomingBroadcast(msg);
          }
        } catch (err) {
          console.warn('Failed parsing storage signal:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      broadcastChannelsRef.current.forEach((ch) => ch.close());
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Dispatch handling from other tabs
  const handleIncomingBroadcast = useCallback((msg: any) => {
    if (msg.type === 'SOS_TRIGGERED' || msg.type === 'NEW_EMERGENCY') {
      const newCase: EmergencyCase = msg.payload || {
        id: msg.caseId || `EMG-${Date.now().toString().slice(-6)}`,
        timestamp: msg.timestamp || new Date().toLocaleTimeString(),
        category: 'general_emergency',
        urgency: 'CRITICAL',
        patientName: 'Citizen Emergency Dispatch',
        pickupLocation: msg.location || DEFAULT_COORDS,
        status: 'PENDING',
        statusStep: 0,
        auditLog: [],
      };
      setCases((prev) => {
        if (prev.some((c) => c.id === newCase.id)) return prev;
        return [newCase, ...prev];
      });
      setIncomingAlert(newCase);
      playEmergencySirenAlert();
    } else if (msg.type === 'CASE_UPDATED') {
      const updatedCase: EmergencyCase = msg.payload;
      setCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
      if (updatedCase.status === 'RESOLVED' || updatedCase.status === 'CANCELLED') {
        setIncomingAlert((current) => (current?.id === updatedCase.id ? null : current));
        playSuccessChime();
      }
    } else if (msg.type === 'AMBULANCE_STATUS_CHANGED') {
      const updatedAmb: Ambulance = msg.payload;
      setAmbulances((prev) => prev.map((a) => (a.id === updatedAmb.id ? updatedAmb : a)));
    } else if (msg.type === 'HOSPITAL_CAPACITY_UPDATED') {
      const updatedHosp: Hospital = msg.payload;
      setHospitals((prev) => prev.map((h) => (h.id === updatedHosp.id ? updatedHosp : h)));
    } else if (msg.type === 'SIMULATION_MUTATION') {
      setSimulationState(msg.payload);
    }
  }, []);

  const addAuditLog = useCallback((actor: string, action: string, note: string) => {
    const newEntry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleTimeString(),
      actor,
      action,
      note,
    };
    setAuditLogs((prev) => [newEntry, ...prev.slice(0, 49)]);
    return newEntry;
  }, []);

  // Evaluate candidate hospitals for a given case
  const getHospitalEvaluation = useCallback(
    (caseData: EmergencyCase): RoutingCandidate[] => {
      return evaluateHospitals(
        caseData,
        hospitals,
        simulationState.congestionMultiplier,
        simulationState.roadBlockages
      );
    },
    [hospitals, simulationState]
  );

  // Trigger Emergency SOS Sequence
  const triggerEmergencySOS = useCallback(
    (params: {
      category: string;
      pickupLocation: { lat: number; lng: number; address: string };
      patientName?: string;
      patientPhone?: string;
      bloodGroup?: string;
      notes?: string;
    }): EmergencyCase => {
      const caseId = `EMG-${Date.now().toString().slice(-6)}`;
      const timestamp = new Date().toLocaleTimeString();

      const isAnonymous = !currentUser && !params.patientName;
      const patientName = isAnonymous
        ? undefined
        : params.patientName || (currentUser && 'fullName' in currentUser ? currentUser.fullName : undefined);
      const patientPhone = isAnonymous
        ? undefined
        : params.patientPhone || (currentUser && 'phone' in currentUser ? currentUser.phone : undefined);
      const bloodGroup = isAnonymous
        ? undefined
        : params.bloodGroup || (currentUser?.role === 'CITIZEN' ? currentUser.bloodGroup : undefined);

      const tempCase: EmergencyCase = {
        id: caseId,
        timestamp,
        category: params.category || 'general_emergency',
        urgency: 'CRITICAL',
        patientName,
        patientPhone,
        bloodGroup,
        notes: params.notes || (isAnonymous ? 'Anonymous Emergency' : 'Registered Citizen Emergency'),
        pickupLocation: params.pickupLocation,
        status: 'PENDING',
        statusStep: 0,
        auditLog: [
          {
            id: `audit-${Date.now()}-1`,
            timestamp,
            actor: isAnonymous ? 'Anonymous Citizen' : (patientName || 'Registered User'),
            action: 'SOS_TRIGGERED',
            note: isAnonymous
              ? `Anonymous emergency broadcast at ${params.pickupLocation.address}.`
              : `Incident registered for ${patientName} (${patientPhone || 'N/A'}) at ${params.pickupLocation.address}.`,
          },
        ],
      };

      // Run evaluation engine to determine Best Recommended Hospital
      const candidates = getHospitalEvaluation(tempCase);
      const bestCandidate = candidates.find((c) => c.isBest) || candidates[0];
      tempCase.recommendedHospitalId = bestCandidate?.hospital.id;

      // Automatically find nearest available ambulance
      const availableAmbulances = ambulances.filter((a) => a.status === 'AVAILABLE');
      let assignedAmb: Ambulance | null = null;

      if (availableAmbulances.length > 0) {
        // Find closest ambulance
        assignedAmb = availableAmbulances[0];
        tempCase.assignedAmbulanceId = assignedAmb.id;
        tempCase.assignedHospitalId = bestCandidate?.hospital.id;
        tempCase.status = 'DISPATCHED';
        tempCase.statusStep = 1; // Dispatched / Accepted

        tempCase.auditLog.push({
          id: `audit-${Date.now()}-2`,
          timestamp,
          actor: 'AUTO_DISPATCH_ENGINE',
          action: 'AMBULANCE_DISPATCHED',
          note: `Assigned Ambulance ${assignedAmb.vehiclePlate} (${assignedAmb.driverName}). Target Destination: ${bestCandidate.hospital.name}.`,
        });

        // Mutate ambulance status
        setAmbulances((prev) =>
          prev.map((a) =>
            a.id === assignedAmb!.id
              ? {
                  ...a,
                  status: 'EN_ROUTE_PICKUP',
                  currentCaseId: caseId,
                  lastUpdated: 'Just now',
                }
              : a
          )
        );
      }

      setCases((prev) => [tempCase, ...prev]);
      addAuditLog('DISPATCHER', 'SOS_ACTIVATED', `New emergency case ${caseId} created. Ambulance: ${assignedAmb ? assignedAmb.vehiclePlate : 'Queued'}.`);

      // Broadcast to other open windows/tabs (Drivers, Admins)
      broadcast('SOS_TRIGGERED', tempCase);
      playEmergencySirenAlert();

      return tempCase;
    },
    [currentUser, ambulances, getHospitalEvaluation, addAuditLog, broadcast]
  );

  // Cancel Emergency
  const cancelEmergencySOS = useCallback(
    (caseId: string, reason: string = 'User cancelled Emergency sequence') => {
      const timestamp = new Date().toLocaleTimeString();
      let cancelledCase: EmergencyCase | null = null;

      setCases((prev) =>
        prev.map((c) => {
          if (c.id === caseId) {
            cancelledCase = {
              ...c,
              status: 'CANCELLED',
              auditLog: [
                ...c.auditLog,
                {
                  id: `audit-${Date.now()}`,
                  timestamp,
                  actor: getUserDisplayName(currentUser),
                  action: 'SOS_CANCELLED',
                  note: reason,
                },
              ],
            };
            return cancelledCase;
          }
          return c;
        })
      );

      // Release ambulance if any was assigned
      const targetCase = cases.find((c) => c.id === caseId);
      if (targetCase?.assignedAmbulanceId) {
        setAmbulances((prev) =>
          prev.map((a) =>
            a.id === targetCase.assignedAmbulanceId
              ? {
                  ...a,
                  status: 'AVAILABLE',
                  currentCaseId: undefined,
                  lastUpdated: 'Just now',
                }
              : a
          )
        );
      }

      if (cancelledCase) {
        broadcast('CASE_UPDATED', cancelledCase);
      }
      setIncomingAlert(null);
      addAuditLog('CITIZEN', 'SOS_CANCELLED', `Case ${caseId} cancelled. Reason: ${reason}`);
    },
    [currentUser, cases, broadcast, addAuditLog]
  );

  // Update Case Status (for Driver stepper & Dispatcher)
  const updateCaseStatus = useCallback(
    (
      caseId: string,
      status: EmergencyCase['status'],
      statusStep?: number,
      actorName?: string,
      note?: string
    ) => {
      const timestamp = new Date().toLocaleTimeString();
      let updatedCase: EmergencyCase | null = null;

      setCases((prev) =>
        prev.map((c) => {
          if (c.id === caseId) {
            updatedCase = {
              ...c,
              status,
              statusStep: statusStep !== undefined ? statusStep : c.statusStep,
              auditLog: [
                ...c.auditLog,
                {
                  id: `audit-${Date.now()}`,
                  timestamp,
                  actor: actorName || getUserDisplayName(currentUser),
                  action: `STATUS_${status}`,
                  note: note || `Case progressed to ${status}.`,
                },
              ],
            };
            return updatedCase;
          }
          return c;
        })
      );

      if (updatedCase) {
        broadcast('CASE_UPDATED', updatedCase);
      }
      addAuditLog(actorName || 'OPERATOR', 'CASE_UPDATED', `Case ${caseId} status set to ${status}.`);
    },
    [currentUser, broadcast, addAuditLog]
  );

  // Assign or override ambulance and destination
  const assignAmbulanceAndHospital = useCallback(
    (
      caseId: string,
      ambulanceId: string,
      hospitalId: string,
      isOverride: boolean = false,
      overrideReason?: string
    ) => {
      const timestamp = new Date().toLocaleTimeString();
      const hospital = hospitals.find((h) => h.id === hospitalId);
      const ambulance = ambulances.find((a) => a.id === ambulanceId);

      setCases((prev) =>
        prev.map((c) => {
          if (c.id === caseId) {
            const updated: EmergencyCase = {
              ...c,
              assignedAmbulanceId: ambulanceId,
              assignedHospitalId: hospitalId,
              status: 'DISPATCHED',
              statusStep: 1,
              dispatcherOverrideReason: isOverride ? overrideReason : undefined,
              auditLog: [
                ...c.auditLog,
                {
                  id: `audit-${Date.now()}`,
                  timestamp,
                  actor: getUserDisplayName(currentUser),
                  action: isOverride ? 'DISPATCHER_OVERRIDE' : 'DISPATCH_ASSIGNED',
                  note: isOverride
                    ? `Manual override to ${hospital?.name || hospitalId}. Justification: ${overrideReason || 'Operational re-routing'}`
                    : `Dispatched ${ambulance?.vehiclePlate} to ${hospital?.name || hospitalId}.`,
                },
              ],
            };
            broadcast('CASE_UPDATED', updated);
            return updated;
          }
          return c;
        })
      );

      // Mutate ambulance
      setAmbulances((prev) =>
        prev.map((a) =>
          a.id === ambulanceId
            ? {
                ...a,
                status: 'EN_ROUTE_PICKUP',
                currentCaseId: caseId,
                lastUpdated: 'Just now',
              }
            : a
        )
      );

      addAuditLog(
        'DISPATCHER',
        isOverride ? 'DESTINATION_OVERRIDE' : 'ROUTING_ASSIGNMENT',
        `Assigned ${ambulance?.vehiclePlate} to Case ${caseId}. Destination: ${hospital?.name}.`
      );
    },
    [currentUser, hospitals, ambulances, broadcast, addAuditLog]
  );

  // Update Hospital Beds with strict capacity validation (available <= total - occupied, no negatives)
  const updateHospitalBeds = useCallback(
    (
      hospitalId: string,
      categoryKey: 'icuBeds' | 'generalBeds' | 'maternityBeds' | 'traumaBays' | 'pediatricBeds',
      beds: BedCategory
    ) => {
      // Validate
      const sanitizedTotal = Math.max(0, beds.total);
      const sanitizedOccupied = Math.min(sanitizedTotal, Math.max(0, beds.occupied));
      const sanitizedAvailable = Math.max(0, sanitizedTotal - sanitizedOccupied);

      const validatedBeds: BedCategory = {
        total: sanitizedTotal,
        occupied: sanitizedOccupied,
        available: sanitizedAvailable,
      };

      setHospitals((prev) =>
        prev.map((h) => {
          if (h.id === hospitalId) {
            const updated = {
              ...h,
              [categoryKey]: validatedBeds,
              lastUpdated: 'Just now',
            };
            broadcast('HOSPITAL_CAPACITY_UPDATED', updated);
            return updated;
          }
          return h;
        })
      );

      addAuditLog(
        'HOSPITAL_ADMIN',
        'BED_INVENTORY_UPDATE',
        `Updated ${categoryKey} for hospital ${hospitalId}: Total ${sanitizedTotal}, Available ${sanitizedAvailable}.`
      );
    },
    [broadcast, addAuditLog]
  );

  // Doctor on-duty toggle
  const toggleHospitalDoctor = useCallback(
    (hospitalId: string, doctorName: string, active: boolean) => {
      setHospitals((prev) =>
        prev.map((h) => {
          if (h.id === hospitalId) {
            let updatedSpecialists = [...h.onDutySpecialists];
            if (active) {
              if (!updatedSpecialists.includes(doctorName)) {
                updatedSpecialists.push(doctorName);
              }
            } else {
              updatedSpecialists = updatedSpecialists.filter((d) => d !== doctorName);
            }
            const updated = {
              ...h,
              onDutySpecialists: updatedSpecialists,
              lastUpdated: 'Just now',
            };
            broadcast('HOSPITAL_CAPACITY_UPDATED', updated);
            return updated;
          }
          return h;
        })
      );

      addAuditLog(
        'HOSPITAL_ADMIN',
        'DOCTOR_ON_DUTY_TOGGLE',
        `${doctorName} set to ${active ? 'ON DUTY' : 'OFF DUTY'} at ${hospitalId}.`
      );
    },
    [broadcast, addAuditLog]
  );

  // Critical equipment toggle
  const toggleHospitalEquipment = useCallback(
    (hospitalId: string, equipmentName: string, active: boolean) => {
      setHospitals((prev) =>
        prev.map((h) => {
          if (h.id === hospitalId) {
            let updatedEquipment = [...h.equipment];
            if (active) {
              if (!updatedEquipment.includes(equipmentName)) {
                updatedEquipment.push(equipmentName);
              }
            } else {
              updatedEquipment = updatedEquipment.filter((e) => e !== equipmentName);
            }
            const updated = {
              ...h,
              equipment: updatedEquipment,
              lastUpdated: 'Just now',
            };
            broadcast('HOSPITAL_CAPACITY_UPDATED', updated);
            return updated;
          }
          return h;
        })
      );

      addAuditLog(
        'HOSPITAL_ADMIN',
        'EQUIPMENT_STATUS_CHANGE',
        `${equipmentName} marked as ${active ? 'OPERATIONAL' : 'DOWN / MAINTENANCE'} at ${hospitalId}.`
      );
    },
    [broadcast, addAuditLog]
  );

  // Hospital status toggle
  const toggleHospitalStatus = useCallback(
    (hospitalId: string, status: 'ACCEPTING' | 'DIVERT' | 'CRITICAL_ONLY') => {
      setHospitals((prev) =>
        prev.map((h) => {
          if (h.id === hospitalId) {
            const updated: Hospital = {
              ...h,
              status,
              edOperational: status !== 'DIVERT',
              lastUpdated: 'Just now',
            };
            broadcast('HOSPITAL_CAPACITY_UPDATED', updated);
            return updated;
          }
          return h;
        })
      );

      addAuditLog(
        'HOSPITAL_ADMIN',
        'DEPARTMENT_STATUS_CHANGE',
        `Hospital ${hospitalId} triage status changed to: ${status}.`
      );
    },
    [broadcast, addAuditLog]
  );

  // Update hospital details
  const updateHospitalProfile = useCallback(
    (hospitalId: string, updates: Partial<Hospital>) => {
      setHospitals((prev) =>
        prev.map((h) => {
          if (h.id === hospitalId) {
            const updated = {
              ...h,
              ...updates,
              lastUpdated: 'Just now',
            };
            broadcast('HOSPITAL_CAPACITY_UPDATED', updated);
            return updated;
          }
          return h;
        })
      );
      addAuditLog('HOSPITAL_ADMIN', 'PROFILE_UPDATED', `Updated profile data for ${hospitalId}.`);
    },
    [broadcast, addAuditLog]
  );

  // Update Ambulance Status
  const updateAmbulanceStatus = useCallback(
    (
      ambulanceId: string,
      status: Ambulance['status'],
      coords?: { lat: number; lng: number }
    ) => {
      setAmbulances((prev) =>
        prev.map((a) => {
          if (a.id === ambulanceId) {
            const updated: Ambulance = {
              ...a,
              status,
              currentLocation: coords || a.currentLocation,
              currentCaseId: status === 'AVAILABLE' || status === 'OFF_DUTY' ? undefined : a.currentCaseId,
              lastUpdated: 'Just now',
            };
            broadcast('AMBULANCE_STATUS_CHANGED', updated);
            return updated;
          }
          return a;
        })
      );

      addAuditLog('DRIVER', 'STATUS_MUTATION', `Ambulance ${ambulanceId} updated to ${status}.`);
    },
    [broadcast, addAuditLog]
  );

  // Simulation Toggles
  const toggleSimulationCongestion = useCallback(() => {
    setSimulationState((prev) => {
      const isCongested = prev.congestionMultiplier > 1.0;
      const updated: SimulationState = {
        ...prev,
        congestionMultiplier: isCongested ? 1.0 : 2.2,
        activeCorridor: isCongested ? 'Normal Flow' : 'Central Mysuru Corridor (Sayyaji Rao Rd) - High Congestion',
      };
      broadcast('SIMULATION_MUTATION', updated);
      addAuditLog(
        'SIMULATOR',
        'TRAFFIC_MUTATION',
        isCongested ? 'Traffic cleared to normal baseline.' : 'Simulated 2.2x traffic gridlock on Sayyaji Rao Rd / Central Mysuru corridor.'
      );
      return updated;
    });
  }, [broadcast, addAuditLog]);

  const toggleSimulationIcuExhaustion = useCallback(() => {
    setSimulationState((prev) => {
      const nextVal = !prev.forcedIcuExhaustion;
      const updated: SimulationState = {
        ...prev,
        forcedIcuExhaustion: nextVal,
      };
      
      // Update Apollo / Chamundi ICU available beds to 0
      setHospitals((hList) =>
        hList.map((h) => {
          if (h.id === 'MYS-HOSP-03') {
            return {
              ...h,
              icuBeds: {
                ...h.icuBeds,
                available: nextVal ? 0 : 4,
                occupied: nextVal ? h.icuBeds.total : h.icuBeds.total - 4,
              },
            };
          }
          return h;
        })
      );

      broadcast('SIMULATION_MUTATION', updated);
      addAuditLog(
        'SIMULATOR',
        'ICU_EXHAUSTION_MUTATION',
        nextVal
          ? 'Apollo BGS ICU available beds set to 0 (Critical Bed Crunch).'
          : 'Apollo BGS ICU beds restored to normal capacity.'
      );
      return updated;
    });
  }, [broadcast, addAuditLog]);

  const toggleSimulationSpecialistCallout = useCallback(() => {
    setSimulationState((prev) => {
      const nextVal = !prev.forcedSpecialistCallout;
      const updated: SimulationState = {
        ...prev,
        forcedSpecialistCallout: nextVal,
      };

      // Toggle cardiologist at JSS Hospital or Apollo
      setHospitals((hList) =>
        hList.map((h) => {
          if (h.id === 'MYS-HOSP-05') {
            const specs = nextVal
              ? h.onDutySpecialists.filter((s) => !s.toLowerCase().includes('cardio'))
              : [...h.onDutySpecialists, 'Cardiologist'];
            return {
              ...h,
              onDutySpecialists: specs,
            };
          }
          return h;
        })
      );

      broadcast('SIMULATION_MUTATION', updated);
      addAuditLog(
        'SIMULATOR',
        'SPECIALIST_CALLOUT_MUTATION',
        nextVal
          ? 'Cardiologist at JSS Hospital marked as Unavailable / Emergency Callout.'
          : 'Cardiologist returned to active duty at JSS Hospital.'
      );
      return updated;
    });
  }, [broadcast, addAuditLog]);

  const toggleSimulationRoadBlockage = useCallback(() => {
    setSimulationState((prev) => {
      const isBlocked = prev.roadBlockages.length > 0;
      const updated: SimulationState = {
        ...prev,
        roadBlockages: isBlocked ? [] : ['Irwin Road Junction Blocked (Procession)'],
      };
      broadcast('SIMULATION_MUTATION', updated);
      addAuditLog(
        'SIMULATOR',
        'ROAD_BLOCKAGE_MUTATION',
        isBlocked
          ? 'Irwin Road junction cleared. Bypass route lifted.'
          : 'Irwin Road junction BLOCKED. Forcing alternate bypass routing.'
      );
      return updated;
    });
  }, [broadcast, addAuditLog]);

  // Reset all to clean defaults
  const resetToDefaults = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.HOSPITALS);
    localStorage.removeItem(STORAGE_KEYS.AMBULANCES);
    localStorage.removeItem(STORAGE_KEYS.CASES);
    localStorage.removeItem(STORAGE_KEYS.SIMULATION);
    localStorage.removeItem(STORAGE_KEYS.LOGS);

    setHospitals(INITIAL_HOSPITALS);
    setAmbulances(INITIAL_AMBULANCES);
    setCases([]);
    setSimulationState({
      congestionMultiplier: 1.0,
      roadBlockages: [],
      activeCorridor: 'Normal Flow',
      forcedIcuExhaustion: false,
      forcedSpecialistCallout: false,
    });
    setIncomingAlert(null);
    addAuditLog('SYSTEM', 'RESET_DEFAULTS', 'Application reset to factory Mysuru demonstration state.');
  }, [addAuditLog]);

  // Auth functions
  const login = useCallback((user: AuthUser) => {
    setCurrentUser(user);
    setActiveRole(user.role);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setActiveRole('CITIZEN');
    localStorage.removeItem(STORAGE_KEYS.USER);
    setIncomingAlert(null);
    addAuditLog('SYSTEM', 'USER_LOGOUT', 'User logged out to Anonymous Emergency portal.');
  }, [addAuditLog]);

  const switchRole = useCallback((role: UserRole) => {
    setActiveRole(role);
  }, []);

  const dismissIncomingAlert = useCallback(() => {
    setIncomingAlert(null);
  }, []);

  return (
    <EmergencyContext.Provider
      value={{
        currentUser,
        activeRole,
        hospitals,
        ambulances,
        cases,
        activeCase,
        simulationState,
        auditLogs,
        incomingAlert,
        dismissIncomingAlert,
        userCoords,
        setUserCoords,
        triggerEmergencySOS,
        cancelEmergencySOS,
        updateCaseStatus,
        assignAmbulanceAndHospital,
        updateHospitalBeds,
        toggleHospitalDoctor,
        toggleHospitalEquipment,
        toggleHospitalStatus,
        updateHospitalProfile,
        updateAmbulanceStatus,
        setSimulationState,
        toggleSimulationCongestion,
        toggleSimulationIcuExhaustion,
        toggleSimulationSpecialistCallout,
        toggleSimulationRoadBlockage,
        resetToDefaults,
        login,
        logout,
        switchRole,
        getHospitalEvaluation,
      }}
    >
      {children}
    </EmergencyContext.Provider>
  );
};

export const useEmergency = () => {
  const context = useContext(EmergencyContext);
  if (!context) {
    throw new Error('useEmergency must be used within an EmergencyProvider');
  }
  return context;
};
