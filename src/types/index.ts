export type UserRole = 'CITIZEN' | 'DRIVER' | 'HOSPITAL_ADMIN' | 'DISPATCHER';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface BedCategory {
  total: number;
  occupied: number;
  available: number;
}

export type HospitalVerifiedStatus = 'VERIFIED' | 'PENDING' | 'SIMULATED';

export interface Hospital {
  id: string;
  name: string;
  type: 'Government' | 'Private' | 'Trust';
  coordinates: Coordinates;
  address: string;
  emergencyPhone: string;
  ambulanceBayPhone?: string;
  verifiedStatus: HospitalVerifiedStatus;
  edOperational: boolean;
  status: 'ACCEPTING' | 'DIVERT' | 'CRITICAL_ONLY';
  specialties: string[];
  equipment: string[];
  icuBeds: BedCategory;
  generalBeds: BedCategory;
  maternityBeds: BedCategory;
  traumaBays: BedCategory;
  pediatricBeds: BedCategory;
  onDutySpecialists: string[];
  lastUpdated: string;
  dataSource: string;
  description?: string;
  imageUrl?: string;
  landmark?: string;
}

export type AmbulanceStatus = 
  | 'AVAILABLE' 
  | 'EN_ROUTE_PICKUP' 
  | 'PATIENT_LOADED' 
  | 'EN_ROUTE_HOSPITAL' 
  | 'HANDOVER_COMPLETE' 
  | 'OFF_DUTY';

export interface Ambulance {
  id: string;
  vehiclePlate: string;
  driverId: string;
  driverName: string;
  phone: string;
  baseStation: string;
  status: AmbulanceStatus;
  currentLocation: Coordinates;
  currentCaseId?: string;
  lastUpdated: string;
}

export type UrgencyLevel = 'CRITICAL' | 'HIGH' | 'MODERATE';
export type CaseStatus = 'PENDING' | 'DISPATCHED' | 'IN_TRANSIT' | 'RESOLVED' | 'CANCELLED';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  note: string;
}

export interface EmergencyCase {
  id: string;
  timestamp: string;
  category: string;
  urgency: UrgencyLevel;
  patientName?: string;
  patientPhone?: string;
  bloodGroup?: string;
  notes?: string;
  pickupLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  assignedAmbulanceId?: string;
  assignedHospitalId?: string;
  status: CaseStatus;
  statusStep?: number; // 0: Pending, 1: Accepted, 2: En Route Pickup, 3: Patient Loaded, 4: En Route Hospital, 5: Handover Complete
  auditLog: AuditLogEntry[];
  recommendedHospitalId?: string;
  dispatcherOverrideReason?: string;
}

export interface EmergencyCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  urgency: UrgencyLevel;
  criticalRequirements: {
    specialties: string[];
    equipment: string[];
    icuRequired: boolean;
    burnsUnit?: boolean;
    cathLab?: boolean;
    maternityRequired?: boolean;
    pediatricRequired?: boolean;
    veterinaryRequired?: boolean;
  };
}

export interface RoutingCandidate {
  hospital: Hospital;
  distanceKm: number;
  etaMinutes: number;
  eligible: boolean;
  ineligibilityReasons: string[];
  score: number;
  isNearest: boolean;
  isBest: boolean;
  explanation: string;
}

export interface UserProfile {
  id: string;
  role: 'CITIZEN';
  fullName: string;
  phone: string;
  homeAddress: string;
  emergencyContact: string;
  bloodGroup: string;
}

export interface DriverProfile {
  id: string;
  role: 'DRIVER';
  driverName: string;
  phone: string;
  vehiclePlate: string;
  baseStation: string;
  ambulanceId: string;
}

export interface HospitalAdminProfile {
  id: string;
  role: 'HOSPITAL_ADMIN';
  hospitalId: string;
  adminName: string;
  officialEmail: string;
  hotline: string;
}

export interface DispatcherProfile {
  id: string;
  role: 'DISPATCHER';
  officerName: string;
  badgeId: string;
  phone: string;
  deskId: string;
}

export type AuthUser = UserProfile | DriverProfile | HospitalAdminProfile | DispatcherProfile;

export interface SimulationState {
  congestionMultiplier: number;
  roadBlockages: string[]; // List of road names blocked
  activeCorridor: string; // e.g. "Central Mysuru Corridor (Sayyaji Rao Rd)"
  forcedIcuExhaustion: boolean; // Chamundi / Apollo ICU beds set to 0
  forcedSpecialistCallout: boolean; // Cardiologist unavailable at Central Institute
}

export interface BroadcastMessage {
  type: 
    | 'SOS_TRIGGERED' 
    | 'CASE_UPDATED' 
    | 'AMBULANCE_STATUS_CHANGED' 
    | 'HOSPITAL_CAPACITY_UPDATED' 
    | 'SIMULATION_MUTATION'
    | 'DISPATCHER_OVERRIDE'
    | 'NEW_EMERGENCY'
    | 'HOSPITAL_UPDATE';
  payload: any;
  senderId: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// HOSPITAL INTELLIGENCE 12-LAYER PROFILE DATA MODELS
// ---------------------------------------------------------------------------

export type AssetCategory =
  | 'BUILDINGS'
  | 'ELECTRICAL'
  | 'WATER_DRAINAGE'
  | 'FIRE_SAFETY'
  | 'MEDICAL_CRITICAL'
  | 'ENVIRONMENTAL';

export interface InfrastructureAsset {
  id: string;
  category: AssetCategory;
  name: string;
  assetId: string;
  constructionYear?: number;
  floors?: number;
  status: 'OPERATIONAL' | 'DEGRADED' | 'CRITICAL' | 'MAINTENANCE';
  lastInspection: string;
  nextInspectionDue: string;
  observations: string;
  assignedTeam: string;
  openIncidentsCount: number;
  details: Record<string, string | number | boolean>;
}

export type DataSourceQuality = 'LIVE_SENSOR' | 'EXTERNAL_API' | 'MANUAL_REPORT' | 'CACHED' | 'UNAVAILABLE';

export interface MonitoringReading {
  id: string;
  indicator: string;
  value: string | number;
  unit?: string;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  timestamp: string;
  sourceIdentifier: string;
  updateInterval: string;
  dataQuality: DataSourceQuality;
  connectionStatus: 'CONNECTED' | 'DELAYED' | 'OFFLINE';
  lastSync: string;
}

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'UNKNOWN';

export interface HealthAssessment {
  category: string;
  riskLevel: RiskLevel;
  assessmentSummary: string;
  evidence: string[];
  lastAssessmentDate: string;
  missingInformation: string[];
  confidenceScore: number; // 0 - 100
  recommendedAction: string;
}

export interface AIEarlyWarning {
  id: string;
  title: string;
  affectedAsset: string;
  category: string;
  riskLevel: RiskLevel;
  detectedSummary: string;
  evidencePoints: string[];
  detectionTime: string;
  previousIncidents: string[];
  potentialOutcomes: string[];
  aiConfidence: number; // e.g. 91%
  whyDetectedExplanation: string;
  recommendedVerification: string[];
  preventiveActions: string[];
  assignedTeam: string;
  investigationStatus: 'ACTIVE_ALERT' | 'INVESTIGATING' | 'ACTION_DISPATCHED' | 'RESOLVED';
}

export interface RiskTimelineEvent {
  id: string;
  timestamp: string;
  eventType: 'INCIDENT' | 'INSPECTION' | 'MAINTENANCE' | 'SENSOR_ANOMALY' | 'AI_ALERT';
  affectedAsset: string;
  description: string;
  evidenceSource: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  responsibleTeam: string;
  resolutionStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
}

export interface InfrastructureIncidentReport {
  id: string;
  hospitalId: string;
  affectedAsset: string;
  category: string;
  description: string;
  timestamp: string;
  reporterRole: string;
  urgency: 'CRITICAL' | 'HIGH' | 'MODERATE';
  status: 'REPORTED' | 'UNDER_REVIEW' | 'VERIFIED' | 'ACTION_ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  verifiedBy?: string;
  assignedTeam?: string;
  evidenceNotes?: string;
}

export interface HospitalResponsePlan {
  id: string;
  title: string;
  priority: 'CRITICAL' | 'HIGH' | 'MODERATE';
  responsibleTeam: string;
  targetResponseHours: number;
  currentStatus: 'PENDING' | 'INSPECTION_REQUESTED' | 'MAINTENANCE_IN_PROGRESS' | 'RESOLVED';
  actionRequired: string;
  notes: string;
}

export interface DataSourceProvenance {
  sourceName: string;
  sourceType: 'OFFICIAL_RECORDS' | 'GOV_OPEN_DATA' | 'WEATHER_API' | 'IOT_SENSORS' | 'INSPECTION_REPORTS';
  collectionTimestamp: string;
  lastSync: string;
  verificationStatus: 'VERIFIED' | 'PENDING' | 'SIMULATED';
  dataQuality: string;
  limitations: string;
}

export interface HospitalIntelligenceProfileData {
  hospitalId: string;
  district: string;
  pinCode: string;
  ownership: string;
  buildingCount: number;
  authorizedAdministrator: string;
  overallAssessment: 'STABLE_MONITORED' | 'ATTENTION_REQUIRED' | 'CRITICAL_VULNERABILITY' | 'ASSESSMENT_INCOMPLETE';
  riskScore: number; // 0 - 100
  dataCompletenessPct: number;
  assets: InfrastructureAsset[];
  monitoringReadings: MonitoringReading[];
  healthAssessments: HealthAssessment[];
  aiEarlyWarnings: AIEarlyWarning[];
  timeline: RiskTimelineEvent[];
  incidentReports: InfrastructureIncidentReport[];
  responsePlans: HospitalResponsePlan[];
  dataSources: DataSourceProvenance[];
}

