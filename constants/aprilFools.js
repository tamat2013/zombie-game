// constants/aprilFools.js

/**
 * April Fools Day (1st April) special features
 */

export const APRIL_FOOLS_CONFIG = {
  // When is April Fools active
  month: 3, // April (0-indexed, so 3 = April)
  day: 1,
  
  // Fake zombie settings
  fakeZombies: {
    enabled: true,
    biteFrequency: 60000, // Every 60 seconds, chance for fake bite
    biteChance: 0.3, // 30% chance when near player
    freezeDuration: 10000, // Player frozen for 10 seconds
    revealMessage: '!זה היה שקר - אפריל פולס', // April Fools!
  },
  
  // Phantom zombies on screen edges
  phantomZombies: {
    enabled: true,
    count: 3, // Number of phantom zombies
    spawnFrequency: 30000, // Spawn every 30 seconds
    duration: 5000, // Each phantom lasts 5 seconds
    speed: 8, // Fast moving across screen
  },
  
  // Reversed map
  reverseMap: {
    enabled: true,
    mirrorHorizontal: true, // Mirror left-right
    mirrorVertical: true, // Mirror top-bottom
    notification: '!המפה הפוכה - אפריל פולס'
  }
};

/**
 * Check if today is April Fools Day
 */
export function isAprilFools() {
  const today = new Date();
  return today.getMonth() === APRIL_FOOLS_CONFIG.month && 
         today.getDate() === APRIL_FOOLS_CONFIG.day;
}

/**
 * Reverse/mirror position for April Fools map
 */
export function reversePosition(position, mapWidth = 100, mapHeight = 100) {
  if (!isAprilFools() || !APRIL_FOOLS_CONFIG.reverseMap.enabled) {
    return position;
  }
  
  return {
    x: APRIL_FOOLS_CONFIG.reverseMap.mirrorHorizontal ? mapWidth - position.x : position.x,
    y: APRIL_FOOLS_CONFIG.reverseMap.mirrorVertical ? mapHeight - position.y : position.y
  };
}

/**
 * Generate fake zombie bite event
 */
export function generateFakeBite(playerId) {
  return {
    type: 'FAKE_BITE',
    playerId: playerId,
    timestamp: Date.now(),
    freezeDuration: APRIL_FOOLS_CONFIG.fakeZombies.freezeDuration,
    isFake: true
  };
}

/**
 * Generate phantom zombie
 */
export function generatePhantomZombie(id) {
  const sides = ['top', 'bottom', 'left', 'right'];
  const side = sides[Math.floor(Math.random() * sides.length)];
  
  let startPos = { x: 0, y: 0 };
  let endPos = { x: 0, y: 0 };
  
  switch(side) {
    case 'top':
      startPos = { x: Math.random() * 100, y: -5 };
      endPos = { x: Math.random() * 100, y: 105 };
      break;
    case 'bottom':
      startPos = { x: Math.random() * 100, y: 105 };
      endPos = { x: Math.random() * 100, y: -5 };
      break;
    case 'left':
      startPos = { x: -5, y: Math.random() * 100 };
      endPos = { x: 105, y: Math.random() * 100 };
      break;
    case 'right':
      startPos = { x: 105, y: Math.random() * 100 };
      endPos = { x: -5, y: Math.random() * 100 };
      break;
  }
  
  return {
    id: `phantom_${id}`,
    startPos,
    endPos,
    duration: APRIL_FOOLS_CONFIG.phantomZombies.duration,
    speed: APRIL_FOOLS_CONFIG.phantomZombies.speed,
    isPhantom: true,
    createdAt: Date.now()
  };
}
