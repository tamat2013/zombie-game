// screens/TournamentScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { ref, onValue, set, push, off } from 'firebase/database';
import { database, auth } from '../firebase.config';
import { 
  isTournamentTime, 
  getTimeUntilTournament, 
  TOURNAMENT_SETTINGS,
  TOURNAMENT_PRIZES 
} from '../constants/tournament';

export default function TournamentScreen({ navigation }) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [hoursUntil, setHoursUntil] = useState(0);
  const [playerCount, setPlayerCount] = useState(0);
  const [hasJoined, setHasJoined] = useState(false);
  const [tournamentId, setTournamentId] = useState(null);
  const [userMedals, setUserMedals] = useState({ gold: 0, silver: 0, bronze: 0 });

  useEffect(() => {
    checkTournamentAvailability();
    loadUserMedals();

    const interval = setInterval(() => {
      checkTournamentAvailability();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const checkTournamentAvailability = () => {
    const available = isTournamentTime();
    setIsAvailable(available);
    
    if (!available) {
      setHoursUntil(getTimeUntilTournament());
    }
  };

  const loadUserMedals = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const userRef = ref(database, `users/${userId}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.medals) {
        setUserMedals(data.medals);
      }
    });

    return () => off(userRef);
  };

  const joinTournament = async () => {
    if (!isAvailable) {
      Alert.alert('התחרות לא זמינה', `התחרות תתחיל בעוד ${hoursUntil} שעות`);
      return;
    }

    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      // Find or create tournament
      const tournamentsRef = ref(database, 'tournaments/current');
      
      onValue(tournamentsRef, async (snapshot) => {
        let currentTournament = snapshot.val();
        
        if (!currentTournament || currentTournament.status === 'finished') {
          // Create new tournament
          const newTournamentRef = push(ref(database, 'tournaments'));
          await set(newTournamentRef, {
            status: 'waiting',
            createdAt: Date.now(),
            players: {
              [userId]: {
                id: userId,
                position: { x: 50, y: 50 },
                isAlive: true,
                role: 'survivor'
              }
            }
          });
          setTournamentId(newTournamentRef.key);
          setHasJoined(true);
          setPlayerCount(1);
        } else {
          // Join existing tournament
          const playerCount = Object.keys(currentTournament.players || {}).length;
          
          if (playerCount >= TOURNAMENT_SETTINGS.MAX_PLAYERS) {
            Alert.alert('התחרות מלאה', 'התחרות הגיעה למספר המקסימלי של שחקנים');
            return;
          }

          await set(ref(database, `tournaments/${currentTournament.id}/players/${userId}`), {
            id: userId,
            position: { x: 50, y: 50 },
            isAlive: true,
            role: 'survivor'
          });
          
          setTournamentId(currentTournament.id);
          setHasJoined(true);
          setPlayerCount(playerCount + 1);
        }
        
        // Navigate to lobby
        navigation.navigate('TournamentLobby', { tournamentId });
      }, { onlyOnce: true });

    } catch (error) {
      Alert.alert('שגיאה', 'לא הצלחנו להצטרף לתחרות');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← חזור</Text>
        </TouchableOpacity>
      </View>

      {/* Tournament Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>🏆 תחרות יומית 🏆</Text>
        <Text style={styles.bannerSubtitle}>קרב הישרדות אולטימטיבי!</Text>
      </View>

      {/* Status */}
      <View style={styles.statusCard}>
        {isAvailable ? (
          <>
            <Text style={styles.statusAvailable}>✅ התחרות זמינה כעת!</Text>
            <Text style={styles.statusInfo}>השתתפו: {playerCount}/{TOURNAMENT_SETTINGS.MAX_PLAYERS} שחקנים</Text>
          </>
        ) : (
          <>
            <Text style={styles.statusUnavailable}>⏰ התחרות לא זמינה</Text>
            <Text style={styles.statusInfo}>תתחיל בעוד {hoursUntil} שעות</Text>
          </>
        )}
      </View>

      {/* Info */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>📋 כללי התחרות:</Text>
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>👥</Text>
          <Text style={styles.infoText}>רק שורדים - ללא רופאים</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>🤖</Text>
          <Text style={styles.infoText}>{TOURNAMENT_SETTINGS.ZOMBIE_BOTS} זומבים בוטים (AI)</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>⏱️</Text>
          <Text style={styles.infoText}>10 דקות הישרדות</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>🏆</Text>
          <Text style={styles.infoText}>3 האחרונים מקבלים מדליות!</Text>
        </View>
      </View>

      {/* Prizes */}
      <View style={styles.prizesSection}>
        <Text style={styles.prizesTitle}>🎁 פרסים:</Text>
        <View style={styles.prizeRow}>
          <View style={styles.prizeCard}>
            <Text style={styles.prizeMedal}>🥇</Text>
            <Text style={styles.prizePlace}>מקום 1</Text>
            <Text style={styles.prizeName}>זהב</Text>
          </View>
          <View style={styles.prizeCard}>
            <Text style={styles.prizeMedal}>🥈</Text>
            <Text style={styles.prizePlace}>מקום 2</Text>
            <Text style={styles.prizeName}>כסף</Text>
          </View>
          <View style={styles.prizeCard}>
            <Text style={styles.prizeMedal}>🥉</Text>
            <Text style={styles.prizePlace}>מקום 3</Text>
            <Text style={styles.prizeName}>ארד</Text>
          </View>
        </View>
      </View>

      {/* Your Medals */}
      <View style={styles.medalsCard}>
        <Text style={styles.medalsTitle}>המדליות שלך:</Text>
        <View style={styles.medalsRow}>
          <View style={styles.medalCount}>
            <Text style={styles.medalEmoji}>🥇</Text>
            <Text style={styles.medalNumber}>{userMedals.gold || 0}</Text>
          </View>
          <View style={styles.medalCount}>
            <Text style={styles.medalEmoji}>🥈</Text>
            <Text style={styles.medalNumber}>{userMedals.silver || 0}</Text>
          </View>
          <View style={styles.medalCount}>
            <Text style={styles.medalEmoji}>🥉</Text>
            <Text style={styles.medalNumber}>{userMedals.bronze || 0}</Text>
          </View>
        </View>
      </View>

      {/* Join Button */}
      <TouchableOpacity
        style={[styles.joinButton, !isAvailable && styles.joinButtonDisabled]}
        onPress={joinTournament}
        disabled={!isAvailable || hasJoined}
      >
        <Text style={styles.joinButtonText}>
          {hasJoined ? 'הצטרפת לתחרות!' : isAvailable ? '🏆 הצטרף לתחרות!' : '⏰ חכה לתחרות'}
        </Text>
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
    padding: 20,
    paddingTop: 50,
  },
  backButton: {
    color: '#00ff00',
    fontSize: 18,
  },
  banner: {
    backgroundColor: 'linear-gradient(135deg, #ff0000, #cc0000)',
    padding: 40,
    alignItems: 'center',
    borderRadius: 20,
    margin: 20,
  },
  bannerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  bannerSubtitle: {
    fontSize: 18,
    color: 'white',
  },
  statusCard: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    margin: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  statusAvailable: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00ff00',
    marginBottom: 10,
  },
  statusUnavailable: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff0000',
    marginBottom: 10,
  },
  statusInfo: {
    fontSize: 16,
    color: '#aaa',
  },
  infoSection: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    margin: 20,
    borderRadius: 15,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00ff00',
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  infoText: {
    fontSize: 16,
    color: 'white',
  },
  prizesSection: {
    padding: 20,
  },
  prizesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00ff00',
    marginBottom: 15,
    textAlign: 'center',
  },
  prizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  prizeCard: {
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 15,
    flex: 1,
    margin: 5,
  },
  prizeMedal: {
    fontSize: 48,
    marginBottom: 10,
  },
  prizePlace: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 5,
  },
  prizeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  medalsCard: {
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    padding: 20,
    margin: 20,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#00ff00',
  },
  medalsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00ff00',
    marginBottom: 15,
    textAlign: 'center',
  },
  medalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  medalCount: {
    alignItems: 'center',
  },
  medalEmoji: {
    fontSize: 40,
    marginBottom: 5,
  },
  medalNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  joinButton: {
    backgroundColor: '#00ff00',
    padding: 20,
    margin: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  joinButtonDisabled: {
    backgroundColor: '#555',
  },
  joinButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
});
