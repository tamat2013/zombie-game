// storage/localStorage.js
// Local storage alternative to Firebase - works offline!
// Perfect for single-player or local multiplayer

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Save user data locally
 */
export async function saveUserData(userId, data) {
  try {
    const jsonValue = JSON.stringify(data);
    await AsyncStorage.setItem(`@user_${userId}`, jsonValue);
    return true;
  } catch (e) {
    console.error('Error saving user data:', e);
    return false;
  }
}

/**
 * Load user data locally
 */
export async function loadUserData(userId) {
  try {
    const jsonValue = await AsyncStorage.getItem(`@user_${userId}`);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Error loading user data:', e);
    return null;
  }
}

/**
 * Update specific fields in user data
 */
export async function updateUserData(userId, updates) {
  try {
    const currentData = await loadUserData(userId);
    const newData = { ...currentData, ...updates };
    return await saveUserData(userId, newData);
  } catch (e) {
    console.error('Error updating user data:', e);
    return false;
  }
}

/**
 * Initialize new user
 */
export async function createUser(userId, username) {
  const userData = {
    id: userId,
    username: username,
    coins: 500,
    xp: 0,
    wins: 0,
    medals: { gold: 0, silver: 0, bronze: 0 },
    abilities: {},
    items: {},
    skinPowers: {},
    customSkins: {},
    createdAt: Date.now()
  };
  
  return await saveUserData(userId, userData);
}

/**
 * Award XP
 */
export async function awardXP(userId, amount) {
  const userData = await loadUserData(userId);
  if (!userData) return false;
  
  userData.xp = (userData.xp || 0) + amount;
  return await saveUserData(userId, userData);
}

/**
 * Award coins
 */
export async function awardCoins(userId, amount) {
  const userData = await loadUserData(userId);
  if (!userData) return false;
  
  userData.coins = (userData.coins || 0) + amount;
  return await saveUserData(userId, userData);
}

/**
 * Award medal
 */
export async function awardMedal(userId, medalType) {
  const userData = await loadUserData(userId);
  if (!userData) return false;
  
  if (!userData.medals) userData.medals = { gold: 0, silver: 0, bronze: 0 };
  userData.medals[medalType] = (userData.medals[medalType] || 0) + 1;
  
  return await saveUserData(userId, userData);
}

/**
 * Purchase item
 */
export async function purchaseItem(userId, itemId, price) {
  const userData = await loadUserData(userId);
  if (!userData) return false;
  
  if (userData.coins < price) return false;
  
  userData.coins -= price;
  if (!userData.items) userData.items = {};
  userData.items[itemId] = true;
  
  return await saveUserData(userId, userData);
}

/**
 * Purchase ability
 */
export async function purchaseAbility(userId, abilityId, xpCost) {
  const userData = await loadUserData(userId);
  if (!userData) return false;
  
  if (userData.xp < xpCost) return false;
  
  userData.xp -= xpCost;
  if (!userData.abilities) userData.abilities = {};
  userData.abilities[abilityId] = true;
  
  return await saveUserData(userId, userData);
}

/**
 * Clear all data (for testing)
 */
export async function clearAllData() {
  try {
    await AsyncStorage.clear();
    return true;
  } catch (e) {
    console.error('Error clearing data:', e);
    return false;
  }
}

// ===========================
// OFFLINE MODE ADVANTAGES:
// ===========================
// ✅ No internet needed
// ✅ No Firebase costs
// ✅ Faster (no network delays)
// ✅ Privacy (data stays on device)
// ✅ Perfect for single-player
// 
// DISADVANTAGES:
// ❌ No multiplayer
// ❌ Data lost if app deleted
// ❌ Can't sync across devices
// 
// BEST FOR:
// - Single-player games
// - Mini-games (obstacle course)
// - Offline play
// - Testing
