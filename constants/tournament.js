// constants/tournament.js

export const MEDAL_VALUES = {
  BRONZE: 1,
  SILVER: 3,
  GOLD: 6
};

export const MEDAL_TO_COINS = {
  BRONZE: 50,
  SILVER: 150,
  GOLD: 300
};

export const MAP_SIZE_REQUIREMENTS = {
  SMALL: 1,
  MEDIUM: 3,
  LARGE: 6,
  XLARGE: 10
};

export const MAP_SIZES = {
  SMALL: { width: 30, height: 30, name: 'קטנה' },
  MEDIUM: { width: 50, height: 50, name: 'בינונית' },
  LARGE: { width: 70, height: 70, name: 'גדולה' },
  XLARGE: { width: 100, height: 100, name: 'ענקית' }
};

export const TOURNAMENT_HOUR = 20;

export const TOURNAMENT_SETTINGS = {
  MIN_PLAYERS: 6,
  MAX_PLAYERS: 20,
  ZOMBIE_BOTS: 2,
  NO_DOCTORS: true,
  DURATION: 600,
  PRIZE_PLACES: 3
};

export const TOURNAMENT_PRIZES = {
  1: 'GOLD',
  2: 'SILVER',
  3: 'BRONZE'
};

export function calculateGoldValue(medals) {
  if (!medals) return 0;
  const bronze = medals.bronze || 0;
  const silver = medals.silver || 0;
  const gold = medals.gold || 0;
  return gold + (silver / 2) + (bronze / 3);
}

export function convertMedals(medals, fromType, toType, amount) {
  const newMedals = { ...medals };
  
  if (fromType === 'bronze' && toType === 'silver') {
    if (medals.bronze >= 3 * amount) {
      newMedals.bronze -= 3 * amount;
      newMedals.silver = (newMedals.silver || 0) + amount;
      return newMedals;
    }
  } else if (fromType === 'silver' && toType === 'gold') {
    if (medals.silver >= 2 * amount) {
      newMedals.silver -= 2 * amount;
      newMedals.gold = (newMedals.gold || 0) + amount;
      return newMedals;
    }
  }
  
  return null;
}

export function medalsToCoins(medals, medalType, amount) {
  const currentAmount = medals[medalType] || 0;
  if (currentAmount < amount) return null;
  
  const coinsPerMedal = MEDAL_TO_COINS[medalType.toUpperCase()];
  const totalCoins = coinsPerMedal * amount;
  
  const newMedals = { ...medals };
  newMedals[medalType] -= amount;
  
  return { newMedals, coins: totalCoins };
}

export function isTournamentTime() {
  const now = new Date();
  return now.getHours() === TOURNAMENT_HOUR;
}

export function getTimeUntilTournament() {
  const now = new Date();
  const currentHour = now.getHours();
  let hoursUntil = TOURNAMENT_HOUR - currentHour;
  if (hoursUntil < 0) hoursUntil += 24;
  return hoursUntil;
}
