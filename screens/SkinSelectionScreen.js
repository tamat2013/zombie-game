// screens/SkinSelectionScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { ref, update, onValue, off } from 'firebase/database';
import { auth, database } from '../firebase.config';
import { SPECIAL_SKINS } from '../constants/upgrades';

const SKINS = [
  { id: 'default', name: '👤 ברירת מחדל', color: '#4a90e2' },
  { id: 'ninja', name: '🥷 נינג\'ה', color: '#2c3e50' },
  { id: 'robot', name: '🤖 רובוט', color: '#95a5a6' },
  { id: 'alien', name: '👽 חייזר', color: '#9b59b6' },
  { id: 'cowboy', name: '🤠 קאובוי', color: '#e67e22' },
  { id: 'pirate', name: '🏴‍☠️ פיראט', color: '#34495e' },
  { id: 'wizard', name: '🧙 קוסם', color: '#8e44ad' },
  { id: 'knight', name: '🛡️ אביר', color: '#c0392b' },
  { id: 'vampire', name: '🧛 ערפד', color: '#8b0000' },
  { id: 'ghost', name: '👻 רוח רפאים', color: '#e8e8e8' },
  { id: 'superhero', name: '🦸 גיבור על', color: '#0066cc' },
];

export default function SkinSelectionScreen({ navigation }) {
  const [selectedSkin, setSelectedSkin] = useState('default');
  const [unlockedSkinPowers, setUnlockedSkinPowers] = useState({});
  const [userCoins, setUserCoins] = useState(0);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const userRef = ref(database, `users/${userId}`);
    
    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUnlockedSkinPowers(data.skinPowers || {});
        setUserCoins(data.coins || 0);
        setSelectedSkin(data.selectedSkin || 'default');
      }
    });

    return () => off(userRef);
  }, []);

  const handleSelectSkin = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      await update(ref(database, `users/${userId}`), {
        selectedSkin: selectedSkin
      });

      navigation.replace('MapSelection');
    } catch (error) {
      Alert.alert('שגיאה', 'לא הצלחנו לשמור את הסקין');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>בחר את הסקין שלך</Text>
        <View style={styles.coinsDisplay}>
          <Text style={styles.coinsText}>💰 {userCoins}</Text>
          <TouchableOpacity 
            style={styles.storeButton}
            onPress={() => navigation.navigate('Store')}
          >
            <Text style={styles.storeButtonText}>🏪 חנות</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView style={styles.skinsContainer}>
        {SKINS.map((skin) => {
          const specialSkin = SPECIAL_SKINS[skin.id];
          const hasPower = specialSkin && unlockedSkinPowers[skin.id];
          
          return (
            <TouchableOpacity
              key={skin.id}
              style={[
                styles.skinButton,
                { backgroundColor: skin.color },
                selectedSkin === skin.id && styles.selectedSkin
              ]}
              onPress={() => setSelectedSkin(skin.id)}
            >
              <View style={styles.skinHeader}>
                <Text style={styles.skinText}>{skin.name}</Text>
                {selectedSkin === skin.id && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              
              {specialSkin && (
                <View style={styles.skinPowerInfo}>
                  <Text style={styles.powerText}>
                    {hasPower ? '⚡ ' + specialSkin.power.name : '🔒 כוח נעול'}
                  </Text>
                  {hasPower && (
                    <Text style={styles.powerDescription}>
                      {specialSkin.power.description}
                    </Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={styles.continueButton} onPress={handleSelectSkin}>
        <Text style={styles.continueText}>המשך למשחק</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  header: {
    marginTop: 40,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00ff00',
    textAlign: 'center',
    marginBottom: 15,
  },
  coinsDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
  },
  coinsText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffd700',
  },
  storeButton: {
    backgroundColor: '#00ff00',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  storeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  skinsContainer: {
    flex: 1,
    marginBottom: 20,
  },
  skinButton: {
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
  },
  selectedSkin: {
    borderWidth: 4,
    borderColor: '#00ff00',
  },
  skinHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skinText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  checkmark: {
    fontSize: 30,
    color: 'white',
  },
  skinPowerInfo: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
  },
  powerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffd700',
    marginBottom: 5,
  },
  powerDescription: {
    fontSize: 14,
    color: '#ddd',
  },
  continueButton: {
    backgroundColor: '#00ff00',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  continueText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
});
