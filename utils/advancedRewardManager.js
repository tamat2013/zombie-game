// utils/advancedRewardManager.js

/**
 * Calculate reward multiplier based on game difficulty settings
 */
export function calculateDifficultyMultiplier(zombieCount, doctorCount) {
  let multiplier = 1.0;
  
  // More zombies = harder game = more rewards
  switch(zombieCount) {
    case 1:
      multiplier *= 1.0; // Base
      break;
    case 2:
      multiplier *= 1.2; // +20%
      break;
    case 3:
      multiplier *= 1.5; // +50%
      break;
  }
  
  // More doctors = easier game = less rewards
  switch(doctorCount) {
    case 2:
      multiplier *= 1.0; // Base
      break;
    case 3:
      multiplier *= 0.85; // -15%
      break;
    case 4:
      multiplier *= 0.7; // -30%
      break;
  }
  
  return multiplier;
}

/**
 * Calculate zombie speed reduction based on zombie count
 */
export function calculateZombieSpeed(baseSpeed, zombieCount) {
  const speedReduction = (zombieCount - 1) * 0.1; // 10% per extra zombie
  return baseSpeed * (1 - speedReduction);
}

/**
 * Calculate final rewards for a player
 */
export function calculatePlayerRewards(playerData, gameData) {
  const {
    role,
    wasInfected,
    isAlive,
    successfulBites = 0,
    successfulHeals = 0,
    neverInfected = false
  } = playerData;
  
  const {
    winner, // 'zombies' or 'survivors'
    zombieCount = 1,
    doctorCount = 2,
    duration = 600
  } = gameData;
  
  let baseCoins = 20; // Participation
  let baseXP = 0;
  
  // Difficulty multiplier
  const difficultyMultiplier = calculateDifficultyMultiplier(zombieCount, doctorCount);
  
  // Role-based rewards
  if (role === 'zombie') {
    if (winner === 'zombies') {
      baseCoins += 150; // Zombie win
      baseXP += 200;
    } else {
      baseCoins += 50; // Zombie loss
      baseXP += 50;
    }
    baseCoins += successfulBites * 8; // Per bite
    
  } else if (role === 'doctor') {
    if (winner === 'survivors') {
      baseCoins += 120; // Survivor win
      baseXP += 150;
    } else {
      baseCoins += 40; // Survivor loss
      baseXP += 30;
    }
    baseCoins += successfulHeals * 15; // Per heal
    
  } else if (role === 'survivor') {
    if (winner === 'survivors') {
      baseCoins += 120; // Survivor win
      baseXP += 150;
    } else {
      baseCoins += 40; // Survivor loss
      baseXP += 30;
    }
  }
  
  // Bonus for never getting infected
  if (neverInfected && role !== 'zombie') {
    baseCoins += 50;
    baseXP += 100;
  }
  
  // PARTIAL REWARDS IF INFECTED MID-GAME
  if (wasInfected && role !== 'zombie') {
    // Player was infected during the game
    // Gets 50% of team's reward
    if (winner === 'survivors') {
      baseCoins = Math.floor(baseCoins * 0.5);
      baseXP = Math.floor(baseXP * 0.5);
    } else if (winner === 'zombies') {
      // They became zombie and zombies won
      baseCoins = Math.floor(baseCoins * 0.5);
      baseXP = Math.floor(baseXP * 0.5);
    }
  }
  
  // Apply difficulty multiplier
  const finalCoins = Math.floor(baseCoins * difficultyMultiplier);
  const finalXP = Math.floor(baseXP * difficultyMultiplier);
  
  return {
    coins: finalCoins,
    xp: finalXP,
    difficultyMultiplier: difficultyMultiplier.toFixed(2)
  };
}

/**
 * First game of the day bonus
 */
export function getFirstGameBonus(lastPlayedDate) {
  const today = new Date().toDateString();
  const lastPlayed = lastPlayedDate ? new Date(lastPlayedDate).toDateString() : null;
  
  if (lastPlayed !== today) {
    return {
      coins: 30,
      xp: 50,
      isFirstGame: true
    };
  }
  
  return {
    coins: 0,
    xp: 0,
    isFirstGame: false
  };
}

/**
 * Win streak bonus
 */
export function getWinStreakBonus(currentStreak) {
  if (currentStreak >= 3) {
    return {
      multiplier: 1.5,
      message: `!סדרת ${currentStreak} ניצחונות - בונוס x1.5`
    };
  }
  
  return {
    multiplier: 1.0,
    message: null
  };
}
