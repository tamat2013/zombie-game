// screens/CoinShopScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { ref, get, update } from 'firebase/database';
import { auth, database } from '../firebase.config';
import { COIN_PACKAGES, getTotalCoins, formatPrice } from '../utils/inAppPurchases';

export default function CoinShopScreen({ navigation }) {
  const [userCoins, setUserCoins] = useState(0);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    loadUserCoins();
  }, []);

  const loadUserCoins = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      setUserCoins(snapshot.val().coins || 0);
    }
  };

  const handlePurchase = async (pkg) => {
    Alert.alert(
      'אישור רכישה',
      `האם אתה בטוח שברצונך לקנות ${getTotalCoins(pkg.id)} מטבעות ב-${formatPrice(pkg.price, pkg.currency)}?`,
      [
        {
          text: 'ביטול',
          style: 'cancel'
        },
        {
          text: 'קנה',
          onPress: async () => {
            setIsPurchasing(true);
            
            try {
              // TODO: Implement actual payment
              // This is a mock - you need to integrate with payment provider
              
              // For demo purposes, we'll just add the coins
              const userId = auth.currentUser?.uid;
              const totalCoins = getTotalCoins(pkg.id);
              
              const userRef = ref(database, `users/${userId}`);
              const snapshot = await get(userRef);
              
              if (snapshot.exists()) {
                const currentCoins = snapshot.val().coins || 0;
                await update(userRef, {
                  coins: currentCoins + totalCoins
                });
                
                setUserCoins(currentCoins + totalCoins);
                
                Alert.alert(
                  'רכישה הושלמה!',
                  `קיבלת ${totalCoins} מטבעות!`,
                  [{ text: 'מעולה!' }]
                );
              }
            } catch (error) {
              Alert.alert('שגיאה', 'הרכישה נכשלה. נסה שוב.');
            } finally {
              setIsPurchasing(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← חזור</Text>
        </TouchableOpacity>
        <Text style={styles.title}>חנות מטבעות</Text>
        <View style={styles.coinsDisplay}>
          <Text style={styles.coinsText}>💰 {userCoins}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>💎 קנה מטבעות!</Text>
          <Text style={styles.bannerText}>
            השתמש במטבעות לקניית חפצים, יכולות וסקינים!
          </Text>
        </View>

        {COIN_PACKAGES.map((pkg) => (
          <TouchableOpacity
            key={pkg.id}
            style={[
              styles.packageCard,
              pkg.popular && styles.packageCardPopular
            ]}
            onPress={() => handlePurchase(pkg)}
            disabled={isPurchasing}
          >
            {pkg.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>⭐ הכי פופולרי</Text>
              </View>
            )}
            
            <View style={styles.packageContent}>
              <View style={styles.packageLeft}>
                <Text style={styles.coinsAmount}>💰 {pkg.coins}</Text>
                {pkg.bonus > 0 && (
                  <View style={styles.bonusBadge}>
                    <Text style={styles.bonusText}>+{pkg.bonus} בונוס!</Text>
                  </View>
                )}
                <Text style={styles.totalCoins}>
                  סה"כ: {getTotalCoins(pkg.id)} מטבעות
                </Text>
              </View>
              
              <View style={styles.packageRight}>
                <Text style={styles.price}>
                  {formatPrice(pkg.price, pkg.currency)}
                </Text>
                <View style={styles.buyButton}>
                  <Text style={styles.buyButtonText}>קנה עכשיו</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ℹ️ מידע חשוב</Text>
          <Text style={styles.infoText}>
            • הרכישות הן חד-פעמיות ולא חוזרות{'\n'}
            • המטבעות מתווספים מיד לחשבון{'\n'}
            • אין החזרים על רכישות דיגיטליות{'\n'}
            • תמיכה: support@zombiegame.com
          </Text>
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            ⚠️ זוהי דוגמה בלבד! לפני השקה, יש לשלב מערכת תשלומים אמיתית כמו Stripe, PayPal או Apple/Google Pay.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#2a2a2a',
  },
  backButton: {
    color: '#00ff00',
    fontSize: 18,
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  coinsDisplay: {
    backgroundColor: '#ffd700',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  coinsText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  banner: {
    backgroundColor: 'linear-gradient(135deg, #ffd700, #ffed4e)',
    padding: 30,
    borderRadius: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  bannerText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  packageCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#3a3a3a',
    position: 'relative',
  },
  packageCardPopular: {
    borderColor: '#ffd700',
    backgroundColor: '#2d2a1a',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: '#ffd700',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
  },
  popularText: {
    color: '#1a1a1a',
    fontSize: 12,
    fontWeight: 'bold',
  },
  packageContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packageLeft: {
    flex: 1,
  },
  coinsAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffd700',
    marginBottom: 5,
  },
  bonusBadge: {
    backgroundColor: '#00ff00',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 5,
  },
  bonusText: {
    color: '#1a1a1a',
    fontSize: 12,
    fontWeight: 'bold',
  },
  totalCoins: {
    color: '#aaa',
    fontSize: 14,
  },
  packageRight: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  buyButton: {
    backgroundColor: '#00ff00',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
  },
  buyButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#00ff00',
    marginTop: 20,
  },
  infoTitle: {
    color: '#00ff00',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 24,
  },
  disclaimer: {
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffa500',
    marginTop: 20,
    marginBottom: 50,
  },
  disclaimerText: {
    color: '#ffa500',
    fontSize: 12,
    lineHeight: 20,
  },
});
