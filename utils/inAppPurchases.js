// utils/inAppPurchases.js
// In-App Purchases for coins

/**
 * Coin packages available for purchase
 */
export const COIN_PACKAGES = [
  {
    id: 'coins_100',
    coins: 100,
    price: 4.90,
    currency: '₪',
    popular: false,
    bonus: 0
  },
  {
    id: 'coins_500',
    coins: 500,
    price: 19.90,
    currency: '₪',
    popular: true,
    bonus: 50 // +50 bonus coins
  },
  {
    id: 'coins_1500',
    coins: 1500,
    price: 49.90,
    currency: '₪',
    popular: false,
    bonus: 200 // +200 bonus coins
  },
  {
    id: 'coins_5000',
    coins: 5000,
    price: 149.90,
    currency: '₪',
    popular: false,
    bonus: 1000 // +1000 bonus coins
  }
];

/**
 * Get package by ID
 */
export function getPackageById(packageId) {
  return COIN_PACKAGES.find(pkg => pkg.id === packageId);
}

/**
 * Calculate total coins including bonus
 */
export function getTotalCoins(packageId) {
  const pkg = getPackageById(packageId);
  if (!pkg) return 0;
  return pkg.coins + pkg.bonus;
}

/**
 * Format price for display
 */
export function formatPrice(price, currency = '₪') {
  return `${currency}${price.toFixed(2)}`;
}

/**
 * Purchase handler (mock - you'll need to implement with actual payment system)
 * For real implementation, use:
 * - Expo In-App Purchases: expo-in-app-purchases
 * - React Native IAP: react-native-iap
 */
export async function purchasePackage(packageId, userId) {
  const pkg = getPackageById(packageId);
  if (!pkg) {
    throw new Error('Invalid package');
  }
  
  // TODO: Implement actual payment flow
  // This is just a mock structure
  
  const purchase = {
    packageId: pkg.id,
    userId: userId,
    coins: getTotalCoins(packageId),
    price: pkg.price,
    currency: pkg.currency,
    timestamp: Date.now(),
    status: 'pending' // pending, completed, failed
  };
  
  // Here you would:
  // 1. Initiate payment with payment provider
  // 2. Wait for confirmation
  // 3. Award coins to user
  // 4. Save transaction to Firebase
  
  return purchase;
}

/**
 * Save purchase to Firebase
 */
export async function savePurchaseToFirebase(purchase, database) {
  const { ref, push, set } = await import('firebase/database');
  
  const purchaseRef = push(ref(database, `purchases/${purchase.userId}`));
  await set(purchaseRef, {
    ...purchase,
    id: purchaseRef.key
  });
  
  return purchaseRef.key;
}

/**
 * Award coins to user after successful purchase
 */
export async function awardPurchasedCoins(userId, coins, database) {
  const { ref, get, update } = await import('firebase/database');
  
  const userRef = ref(database, `users/${userId}`);
  const snapshot = await get(userRef);
  
  if (snapshot.exists()) {
    const currentCoins = snapshot.val().coins || 0;
    await update(userRef, {
      coins: currentCoins + coins
    });
    return true;
  }
  
  return false;
}
