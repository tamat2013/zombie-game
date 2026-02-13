// screens/LobbyScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { ref, onValue, update, off } from 'firebase/database';
import { database, auth } from '../firebase.config';

export default function LobbyScreen({ route, navigation }) {
  const { gameId, isHost } = route.params;
  const [players, setPlayers] = useState([]);
  const [gameData, setGameData] = useState(null);

  useEffect(() => {
    const gameRef = ref(database, `games/${gameId}`);
    
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGameData(data);
        if (data.players) {
          setPlayers(Object.values(data.players));
        }
        
        // If game started, navigate to game screen
        if (data.status === 'playing') {
          navigation.replace('Game', { gameId });
        }
      }
    });

    return () => off(gameRef);
  }, [gameId]);

  const startGame = async () => {
    if (players.length < 3) {
      Alert.alert('שגיאה', 'נדרשים לפחות 3 שחקנים להתחלת המשחק');
      return;
    }

    // Assign roles
    const playerIds = players.map(p => p.id);
    
    // 1 zombie
    const zombieIndex = Math.floor(Math.random() * playerIds.length);
    const zombieId = playerIds[zombieIndex];
    
    // 1-2 doctors (depending on player count)
    const numDoctors = players.length >= 6 ? 2 : 1;
    const doctorIds = [];
    const availableForDoctors = playerIds.filter(id => id !== zombieId);
    
    for (let i = 0; i < numDoctors; i++) {
      const docIndex = Math.floor(Math.random() * availableForDoctors.length);
      doctorIds.push(availableForDoctors[docIndex]);
      availableForDoctors.splice(docIndex, 1);
    }

    // Update all players with their roles
    const updates = {};
    playerIds.forEach(playerId => {
      let role = 'survivor';
      let speed = 5;
      
      if (playerId === zombieId) {
        role = 'zombie';
        speed = 3; // Zombies are slower
      } else if (doctorIds.includes(playerId)) {
        role = 'doctor';
      }
      
      updates[`games/${gameId}/players/${playerId}/role`] = role;
      updates[`games/${gameId}/players/${playerId}/speed`] = speed;
      
      // Random starting positions
      updates[`games/${gameId}/players/${playerId}/position`] = {
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10
      };
    });

    updates[`games/${gameId}/status`] = 'playing';
    updates[`games/${gameId}/startTime`] = Date.now();
    updates[`games/${gameId}/gameTime`] = 600; // 10 minutes in seconds

    await update(ref(database), updates);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>חדר המתנה</Text>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>מפה: {gameData?.map}</Text>
        <Text style={styles.infoText}>שחקנים: {players.length}/10</Text>
      </View>

      <Text style={styles.subtitle}>שחקנים בחדר:</Text>
      <ScrollView style={styles.playersList}>
        {players.map((player, index) => (
          <View key={player.id} style={styles.playerCard}>
            <Text style={styles.playerText}>שחקן {index + 1}</Text>
            {player.id === auth.currentUser?.uid && (
              <Text style={styles.youTag}>(את/ה)</Text>
            )}
          </View>
        ))}
      </ScrollView>

      {isHost && (
        <TouchableOpacity style={styles.startButton} onPress={startGame}>
          <Text style={styles.startText}>התחל משחק!</Text>
        </TouchableOpacity>
      )}

      {!isHost && (
        <Text style={styles.waitingText}>ממתין למארח להתחיל את המשחק...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00ff00',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  infoBox: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  infoText: {
    color: 'white',
    fontSize: 18,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00ff00',
    marginBottom: 10,
  },
  playersList: {
    flex: 1,
    marginBottom: 20,
  },
  playerCard: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerText: {
    color: 'white',
    fontSize: 18,
  },
  youTag: {
    color: '#00ff00',
    fontSize: 16,
    marginLeft: 10,
  },
  startButton: {
    backgroundColor: '#00ff00',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  startText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  waitingText: {
    color: '#aaa',
    fontSize: 18,
    textAlign: 'center',
    padding: 20,
  },
});
