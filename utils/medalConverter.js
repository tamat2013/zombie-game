// utils/medalConverter.js
// Convert medals to XP instead of coins

import { MEDAL_VALUES } from '../constants/tournament';

/**
 * Medal to XP conversion rates
 */
export const MEDAL_TO_XP = {
  BRONZE: 100,   // 1 ארד = 100 XP
  SILVER: 300,   // 1 כסף = 300 XP
  GOLD: 600      // 1 זהב = 600 XP
};

/**
 * Convert medals to XP
 */
export function convertMedalsToXP(medals, medalType, amount) {
  const currentAmount = medals[medalType] || 0;
  if (currentAmount < amount) return null;
  
  const xpPerMedal = MEDAL_TO_XP[medalType.toUpperCase()];
  const totalXP = xpPerMedal * amount;
  
  const newMedals = { ...medals };
  newMedals[medalType] -= amount;
  
  return { newMedals, xp: totalXP };
}

/**
 * Get XP value for a single medal
 */
export function getMedalXPValue(medalType) {
  return MEDAL_TO_XP[medalType.toUpperCase()] || 0;
}

/**
 * Calculate total XP value from all medals
 */
export function calculateTotalMedalXP(medals) {
  if (!medals) return 0;
  
  const bronze = (medals.bronze || 0) * MEDAL_TO_XP.BRONZE;
  const silver = (medals.silver || 0) * MEDAL_TO_XP.SILVER;
  const gold = (medals.gold || 0) * MEDAL_TO_XP.GOLD;
  
  return bronze + silver + gold;
}
