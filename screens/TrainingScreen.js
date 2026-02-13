// screens/TrainingScreen.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { ref, push, set } from 'firebase/database';
import { auth, database } from '../firebase.config';

const DIFFICULTIES = {
  easy: { name: 'קל', color: '#00ff00', description: 'בוטים איטיים' },
  medium: { name: 'בינוני', color: '#ffaa00', description: 'בוטים רגילים' },
  hard: { name: 'קשה', color: '#ff0000', description: 'בוטים חכמים' }
};

export default function TrainingScreen({ navigation }) {
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [selectedMap, setSelectedMap] = useState('hospital');

  const MAPS = [
    { id: 'hospital', name: '🏥 בית חולים', emoji: '🏥' },
    { id: 'mall', name: '🏬 קניון', emoji: '🏬' },
    { id: 'school', name: '🏫 בית ספר', emoji: '🏫' },
    { id: 'factory', name: '🏭 מפעל', emoji: '🏭' },
    { id: 'park', name: '🌳 פארק', emoji: '🌳' }
  ];

  const startTraining = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      // Create training game
      const gameRef = push(ref(database, 'games'));
      const gameId = gameRef.key;

      await set(gameRef, {
        map: selectedMap,
        status: 'waiting',
        isTraining: true,
        difficulty: selectedDifficulty,
        players: {
          [userId]: {
            id: userId,
            position: { x: 50, y: 50 },
            role: 'survivor', // Player is always survivor in training
            isAlive: true,
            isInfected: false,
            speed: 5
          },
          bot1: {
            id: 'bot1',
            position: { x: 20, y: 20 },
            role: 'zombie',
            isAlive: true,
            isBot: true,
            speed: 3
          },
          bot2: {
            id: 'bot2',
            position: { x: 80, y: 80 },
            role: 'zombie',
            isAlive: true,
            isBot: true,
            speed: 3
          }
        },
        startTime: Date.now(),
        gameTime: 600
      });

      Alert.alert(
        'אימון מתחיל!',
        'זכור: לא תרוויח מטבעות או XP במצב אימון',
        [
          {
            text: 'התחל',
            onPress: () => navigation.navigate('Game', { gameId, isTraining: true })
          }
        ]
      );
    } catch (error) {
      Alert.alert('שגיאה', 'לא הצלחנו ליצור משחק אימון');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← חזור</Text>
        </TouchableOpacity>
        <Text style={styles.title}>מצב אימון</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoBannerTitle}>🎯 מצב אימון</Text>
        <Text style={styles.infoBannerText}>
          תרגל נגד בוטים AI ללא לחץ.{'\n'}
          💡 לא תרוויח מטבעות או XP
        </Text>
      </View>

      {/* Difficulty Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>בחר קושי:</Text>
        {Object.entries(DIFFICULTIES).map(([key, diff]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.difficultyCard,
              selectedDifficulty === key && styles.difficultyCardSelected,
              { borderColor: diff.color }
            ]}
            onPress={() => setSelectedDifficulty(key)}
          >
            <View style={styles.difficultyHeader}>
              <Text style={[styles.difficultyName, { color: diff.color }]}>
                {diff.name}
              </Text>
              {selectedDifficulty === key && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
            <Text style={styles.difficultyDesc}>{diff.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Map Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>בחר מפה:</Text>
        <View style={styles.mapGrid}>
          {MAPS.map((map) => (
            <TouchableOpacity
              key={map.id}
              style={[
                styles.mapCard,
                selectedMap === map.id && styles.mapCardSelected
              ]}
              onPress={() => setSelectedMap(map.id)}
            >
              <Text style={styles.mapEmoji}>{map.emoji}</Text>
              <Text style={styles.mapName}>{map.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Start Button */}
      <TouchableOpacity
        style={styles.startButton}
        onPress={startTraining}
      >
        <Text style={styles.startButtonText}>🎮 התחל אימון</Text>
      </TouchableOpacity>
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
  placeholder: {
    width: 60,
  },
  infoBanner: {
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    padding: 20,
    margin: 20,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#00ff00',
  },
  infoBannerTitle: {
    color: '#00ff00',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoBannerText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 22,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    color: '#00ff00',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  difficultyCard: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 2,
  },
  difficultyCardSelected: {
    backgroundColor: '#3a3a3a',
  },
  difficultyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  difficultyName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  checkmark: {
    fontSize: 24,
    color: '#00ff00',
  },
  difficultyDesc: {
    color: '#aaa',
    fontSize: 14,
  },
  mapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  mapCard: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    width: '30%',
    borderWidth: 2,
    borderColor: '#3a3a3a',
  },
  mapCardSelected: {
    borderColor: '#00ff00',
    backgroundColor: '#3a3a3a',
  },
  mapEmoji: {
    fontSize: 32,
    marginBottom: 5,
  },
  mapName: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#00ff00',
    padding: 20,
    margin: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#1a1a1a',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
