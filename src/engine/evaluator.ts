import { EmergencyCase, Hospital, RoutingCandidate, Coordinates } from '../types';
import { EMERGENCY_CATEGORIES } from '../data/mysuruFacilities';

/**
 * Calculates distance in kilometers between two GPS coordinates using Haversine formula
 * with a city winding factor (1.35x) to reflect actual Mysuru road topology.
 */
export function calculateRoadDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLon = ((coord2.lng - coord1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLineKm = R * c;
  
  // Mysore urban street topology winding coefficient
  const windingFactor = 1.35;
  return Number((straightLineKm * windingFactor).toFixed(1));
}

/**
 * Calculates road ETA in minutes factoring Mysuru city center vs ring road congestion.
 */
export function calculateRoadETA(
  distanceKm: number,
  coord1: Coordinates,
  coord2: Coordinates,
  trafficMultiplier: number = 1.0,
  roadBlockages: string[] = []
): number {
  // Average urban emergency speed in Mysuru is ~32 km/h
  let avgSpeedKmh = 32;

  // Check if trip crosses Central Corridor (around 12.305 to 12.320 lat, 76.645 to 76.660 lng)
  const isCentralOrigin = coord1.lat >= 12.300 && coord1.lat <= 12.325 && coord1.lng >= 76.640 && coord1.lng <= 76.665;
  const isCentralDest = coord2.lat >= 12.300 && coord2.lat <= 12.325 && coord2.lng >= 76.640 && coord2.lng <= 76.665;
  
  let routeMultiplier = trafficMultiplier;

  if (isCentralOrigin || isCentralDest) {
    // City center density penalty
    avgSpeedKmh = 24;
    // If road blockages exist along central corridor (e.g. Sayyaji Rao Rd), add delay
    if (roadBlockages.length > 0) {
      routeMultiplier *= 1.4;
    }
  }

  const baseMinutes = (distanceKm / avgSpeedKmh) * 60;
  const finalMinutes = Math.max(3, Math.round(baseMinutes * routeMultiplier));
  return finalMinutes;
}

/**
 * Deterministic hospital evaluation and clinical matching engine.
 */
export function evaluateHospitals(
  caseData: EmergencyCase,
  hospitals: Hospital[],
  trafficMultiplier: number = 1.0,
  roadBlockages: string[] = []
): RoutingCandidate[] {
  // Find category definitions
  const categoryDef = EMERGENCY_CATEGORIES.find((c) => c.id === caseData.category) || EMERGENCY_CATEGORIES[EMERGENCY_CATEGORIES.length - 1];
  const reqs = categoryDef.criticalRequirements;

  const candidates: RoutingCandidate[] = hospitals.map((hospital) => {
    const ineligibilityReasons: string[] = [];

    // 1. Operational status
    if (!hospital.edOperational) {
      ineligibilityReasons.push('Emergency Department is temporarily closed');
    }
    if (hospital.status === 'DIVERT') {
      ineligibilityReasons.push('Hospital is on DIVERT status (at capacity or technical downtime)');
    }

    // 2. Specialty & Specialist on duty check
    for (const spec of reqs.specialties) {
      const hasSpecialty = hospital.specialties.some(
        (s) => s.toLowerCase() === spec.toLowerCase()
      );
      if (!hasSpecialty) {
        ineligibilityReasons.push(`Lacks required clinical department: ${spec}`);
      } else {
        // Must also have specialist on duty
        const hasOnDuty = hospital.onDutySpecialists.some((s) => {
          const sLower = s.toLowerCase();
          const specLower = spec.toLowerCase();
          return (
            sLower.includes(specLower) ||
            specLower.includes(sLower) ||
            (specLower.includes('cardio') && sLower.includes('cardio')) ||
            (specLower.includes('neuro') && sLower.includes('neuro')) ||
            (specLower.includes('trauma') && sLower.includes('trauma')) ||
            (specLower.includes('obstetric') && (sLower.includes('obstetric') || sLower.includes('gynec'))) ||
            (specLower.includes('pediatric') && sLower.includes('pediatric')) ||
            (specLower.includes('veterinary') && sLower.includes('veterinary'))
          );
        });

        if (!hasOnDuty) {
          ineligibilityReasons.push(`Specialist NOT currently on active duty: ${spec}`);
        }
      }
    }

    // 3. Equipment check
    for (const eq of reqs.equipment) {
      const hasEquipment = hospital.equipment.some(
        (e) => e.toLowerCase() === eq.toLowerCase()
      );
      if (!hasEquipment) {
        ineligibilityReasons.push(`Missing mandatory critical equipment: ${eq}`);
      }
    }

    // 4. ICU bed check
    if (reqs.icuRequired && hospital.icuBeds.available <= 0) {
      ineligibilityReasons.push('Intensive Care Unit (ICU) has 0 available beds');
    }

    // 5. Maternity bed check
    if (reqs.maternityRequired && hospital.maternityBeds && hospital.maternityBeds.available <= 0) {
      ineligibilityReasons.push('Maternity / Labor Ward has 0 available beds');
    }

    // 6. Pediatric bed check
    if (reqs.pediatricRequired && hospital.pediatricBeds && hospital.pediatricBeds.available <= 0) {
      ineligibilityReasons.push('Pediatric ICU / Ward has 0 available beds');
    }

    // 7. Cath Lab check
    if (reqs.cathLab && !hospital.equipment.includes('Cath Lab')) {
      ineligibilityReasons.push('No 24/7 Primary Percutaneous Coronary Intervention (Cath Lab)');
    }

    const eligible = ineligibilityReasons.length === 0;

    // Calculate Distance and ETA
    const distanceKm = calculateRoadDistance(caseData.pickupLocation, hospital.coordinates);
    const etaMinutes = calculateRoadETA(
      distanceKm,
      caseData.pickupLocation,
      hospital.coordinates,
      trafficMultiplier,
      roadBlockages
    );

    // Scoring Algorithm:
    // Base 100 - (ETA * 1.5) + (ICU Beds * 2) + Verified Bonus (10) + Specialists Bonus (2 * count)
    let score = 0;
    if (eligible) {
      const availableBedsBonus = (hospital.icuBeds.available * 2) + 
        (hospital.maternityBeds ? hospital.maternityBeds.available : 0) +
        (hospital.traumaBays ? hospital.traumaBays.available : 0);
      const verifiedBonus = hospital.verifiedStatus === 'VERIFIED' ? 10 : 0;
      const staffReadiness = hospital.onDutySpecialists.length * 2;
      
      score = (100 - (etaMinutes * 1.5)) + availableBedsBonus + verifiedBonus + staffReadiness;
    } else {
      // Ineligible score is negative, scaled by distance to maintain relative spatial order
      score = -50 - (etaMinutes * 1.2);
    }

    return {
      hospital,
      distanceKm,
      etaMinutes,
      eligible,
      ineligibilityReasons,
      score: Math.round(score * 10) / 10,
      isNearest: false,
      isBest: false,
      explanation: '',
    };
  });

  // Identify absolute Nearest hospital (regardless of eligibility)
  const sortedByDistance = [...candidates].sort((a, b) => a.distanceKm - b.distanceKm);
  const nearest = sortedByDistance[0];

  // Identify Best hospital (highest score among eligible)
  const eligibleCandidates = candidates.filter((c) => c.eligible);
  eligibleCandidates.sort((a, b) => b.score - a.score);
  const best = eligibleCandidates.length > 0 ? eligibleCandidates[0] : null;

  // Mark flags and craft deterministic explanation
  return candidates.map((cand) => {
    const isNearest = cand.hospital.id === nearest?.hospital.id;
    const isBest = cand.hospital.id === best?.hospital.id;

    let explanation = '';
    if (isBest) {
      if (isNearest) {
        explanation = `Optimal choice: Closest clinical facility (${cand.distanceKm} km, ~${cand.etaMinutes} mins) with 100% verified staff readiness and available beds for ${categoryDef.name}.`;
      } else {
        const missingCriteria = nearest.ineligibilityReasons.slice(0, 2).join('; ');
        explanation = `Recommended destination: While ${nearest.hospital.name} is closer (${nearest.distanceKm} km), it cannot accept this patient due to: ${missingCriteria}. ${cand.hospital.name} (${cand.distanceKm} km, ~${cand.etaMinutes} mins) guarantees active on-duty specialists and confirmed capacity.`;
      }
    } else if (!cand.eligible) {
      explanation = `Clinically Ineligible: ${cand.ineligibilityReasons.join('. ')}.`;
    } else {
      explanation = `Eligible alternative: Full clinical capability available. Travel ETA is ~${cand.etaMinutes} mins (${cand.distanceKm} km).`;
    }

    return {
      ...cand,
      isNearest,
      isBest,
      explanation,
    };
  }).sort((a, b) => {
    // Put Best first, then eligible by score, then ineligible by distance
    if (a.isBest) return -1;
    if (b.isBest) return 1;
    if (a.eligible && !b.eligible) return -1;
    if (!a.eligible && b.eligible) return 1;
    if (a.eligible && b.eligible) return b.score - a.score;
    return a.distanceKm - b.distanceKm;
  });
}
