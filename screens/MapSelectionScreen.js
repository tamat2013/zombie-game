// screens/MapSelectionScreen.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { ref, push, set, onValue, off } from 'firebase/database';
import { auth, database } from '../firebase.config';

const MAPS = [
  { id: 'hospital', name: '🏥 בית חולים', description: 'מסדרונות צרים וחדרים רבים' },
  { id: 'mall', name: '🏬 קניון', description: 'חנויות וקומות רבות' },
  { id: 'school', name: '🏫 בית ספר', description: 'כיתות ומגרשים' },
  { id: 'factory', name: '🏭 מפעל', description: 'מבוכים תעשייתיים' },
  { id: 'park', name: '🌳 פארק', description: 'שטחים פתוחים ועצים' },
];

export default function MapSelectionScreen({ navigation }) {
  const [selectedMap, setSelectedMap] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [userCoins, setUserCoins] = useState(0);
  const [zombieCount, setZombieCount] = useState(1);
  const [doctorCount, setDoctorCount] = useState(2);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const userRef = ref(database, `users/${userId}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUserCoins(data.coins || 0);
      }
    });

    return () => off(userRef);
  }, []);

  const findOrCreateGame = async () => {
    if (!selectedMap) {
      Alert.alert('שגיאה', 'אנא בחר מפה');
      return;
    }

    setIsSearching(true);
    const userId = auth.currentUser?.uid;
    const gamesRef = ref(database, 'games');

    try {
      // Search for available game with same map
      let foundGame = false;
      
      onValue(gamesRef, (snapshot) => {
        const games = snapshot.val();
        
        if (games) {
          for (const [gameId, game] of Object.entries(games)) {
            if (game.map === selectedMap && game.status === 'waiting' && game.players) {
              const playerCount = Object.keys(game.players).length;
              if (playerCount < 10) { // Max 10 players
                foundGame = true;
                joinGame(gameId);
                return;
              }
            }
          }
        }
        
        if (!foundGame) {
          createNewGame();
        }
      }, { onlyOnce: true });

    } catch (error) {
      Alert.alert('שגיאה', 'לא הצלחנו למצוא משחק');
      setIsSearching(false);
    }
  };

  const createNewGame = async () => {
    const userId = auth.currentUser?.uid;
    const newGameRef = push(ref(database, 'games'));
    
    await set(newGameRef, {
      map: selectedMap,
      status: 'waiting',
      createdAt: Date.now(),
      zombieCount: zombieCount,
      doctorCount: doctorCount,
      players: {
        [userId]: {
          id: userId,
          role: null,
          position: { x: 50, y: 50 },
          isAlive: true,
          isInfected: false,
          infectedTime: null,
          speed: 5
        }
      }
    });

    navigation.replace('Lobby', { gameId: newGameRef.key, isHost: true });
  };

  const joinGame = async (gameId) => {
    const userId = auth.currentUser?.uid;
    const playerRef = ref(database, `games/${gameId}/players/${userId}`);
    
    await set(playerRef, {
      id: userId,
      role: null,
      position: { x: 50, y: 50 },
      isAlive: true,
      isInfected: false,
      infectedTime: null,
      speed: 5
    });

    navigation.replace('Lobby', { gameId, isHost: false });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>בחר מפה</Text>
        <View style={styles.topBar}>
          <Text style={styles.coinsText}>💰 {userCoins}</Text>
          <TouchableOpacity 
            style={styles.storeButton}
            onPress={() => navigation.navigate('Store')}
          >
            <Text style={styles.storeButtonText}>🏪 חנות</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView style={styles.mapsContainer}>
        {MAPS.map((map) => (
          <TouchableOpacity
            key={map.id}
            style={[
              styles.mapButton,
              selectedMap === map.id && styles.selectedMap
            ]}
            onPress={() => setSelectedMap(map.id)}
          >
            <Text style={styles.mapName}>{map.name}</Text>
            <Text style={styles.mapDescription}>{map.description}</Text>
            {selectedMap === map.id && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Game Settings */}
      <View style={styles.settingsSection}>
        <Text style={styles.settingsTitle}>הגדרות משחק:</Text>
        
        {/* Zombies */}
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>🧟 זומבים: {zombieCount}</Text>
          <View style={styles.settingButtons}>
            <TouchableOpacity
              style={styles.settingButton}
              onPress={() => setZombieCount(Math.max(1, zombieCount - 1))}
            >
              <Text style={styles.settingButtonText}>-</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingButton}
              onPress={() => setZombieCount(Math.min(3, zombieCount + 1))}
            >
              <Text style={styles.settingButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Doctors */}
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>⚕️ רופאים: {doctorCount}</Text>
          <View style={styles.settingButtons}>
            <TouchableOpacity
              style={styles.settingButton}
              onPress={() => setDoctorCount(Math.max(2, doctorCount - 1))}
            >
              <Text style={styles.settingButtonText}>-</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingButton}
              onPress={() => setDoctorCount(Math.min(4, doctorCount + 1))}
            >
              <Text style={styles.settingButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.playButton, isSearching && styles.playButtonDisabled]} 
        onPress={findOrCreateGame}
        disabled={isSearching}
      >
        <Text style={styles.playText}>
          {isSearching ? 'מחפש משחק...' : 'מצא משחק!'}
        </Text>
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
  topBar: {
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
  mapsContainer: {
    flex: 1,
    marginBottom: 20,
  },
  mapButton: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#3a3a3a',
  },
  selectedMap: {
    borderColor: '#00ff00',
    borderWidth: 3,
  },
  mapName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  mapDescription: {
    fontSize: 16,
    color: '#aaa',
  },
  checkmark: {
    position: 'absolute',
    top: 20,
    right: 20,
    fontSize: 30,
    color: '#00ff00',
  },
  playButton: {
    backgroundColor: '#00ff00',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  playButtonDisabled: {
    backgroundColor: '#666',
  },
  playText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
});
