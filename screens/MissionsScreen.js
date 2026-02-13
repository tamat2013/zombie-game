// screens/MissionsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { ref, onValue, off } from 'firebase/database';
import { database, auth } from '../firebase.config';
import { DAILY_MISSIONS, WEEKLY_MISSIONS } from '../constants/missions';

export default function MissionsScreen({ navigation }) {
  const [userXP, setUserXP] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [dailyProgress, setDailyProgress] = useState({});
  const [weeklyProgress, setWeeklyProgress] = useState({});

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const userRef = ref(database, `users/${userId}`);
    
    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUserXP(data.xp || 0);
        setUserLevel(calculateLevel(data.xp || 0));
        setDailyProgress(data.dailyMissions || {});
        setWeeklyProgress(data.weeklyMissions || {});
      }
    });

    return () => off(userRef);
  }, []);

  const calculateLevel = (xp) => {
    return Math.floor(xp / 1000) + 1;
  };

  const getXPForNextLevel = () => {
    return userLevel * 1000;
  };

  const getProgressPercentage = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  const renderMissionCard = (mission, progress, type) => {
    const current = progress[mission.id] || 0;
    const percentage = getProgressPercentage(current, mission.target);
    const isCompleted = current >= mission.target;

    return (
      <View key={mission.id} style={[styles.missionCard, isCompleted && styles.missionCardCompleted]}>
        <View style={styles.missionHeader}>
          <Text style={styles.missionTitle}>{mission.desc}</Text>
          <Text style={styles.missionXP}>💎 +{mission.xp} XP</Text>
        </View>
        
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${percentage}%` }]} />
          <Text style={styles.progressText}>{current}/{mission.target}</Text>
        </View>

        {isCompleted && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>✓ הושלם!</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← חזור</Text>
        </TouchableOpacity>
        <Text style={styles.title}>משימות</Text>
        <View style={styles.placeholder} />
      </View>

      {/* XP Progress */}
      <View style={styles.xpCard}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>רמה {userLevel}</Text>
        </View>
        <Text style={styles.xpAmount}>💎 {userXP} XP</Text>
        <View style={styles.xpProgressBar}>
          <View 
            style={[
              styles.xpProgressFill, 
              { width: `${(userXP % 1000) / 10}%` }
            ]} 
          />
        </View>
        <Text style={styles.xpNextLevel}>
          {1000 - (userXP % 1000)} XP לרמה הבאה
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Daily Missions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 משימות יומיות</Text>
          {DAILY_MISSIONS.map(mission => renderMissionCard(mission, dailyProgress, 'daily'))}
        </View>

        {/* Weekly Missions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📆 משימות שבועיות</Text>
          {WEEKLY_MISSIONS.map(mission => renderMissionCard(mission, weeklyProgress, 'weekly'))}
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>💡 איך להרוויח XP?</Text>
          <Text style={styles.infoText}>
            • השלם משימות במפה (200-250 XP){'\n'}
            • השלם משימות יומיות (100-200 XP){'\n'}
            • השלם משימות שבועיות (400-600 XP){'\n'}
            • השתמש ב-XP לקניית יכולות בחנות!
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
  placeholder: {
    width: 60,
  },
  xpCard: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    margin: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#00ff00',
    alignItems: 'center',
  },
  levelBadge: {
    backgroundColor: '#00ff00',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 10,
  },
  levelText: {
    color: '#1a1a1a',
    fontSize: 18,
    fontWeight: 'bold',
  },
  xpAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00ff00',
    marginBottom: 15,
  },
  xpProgressBar: {
    width: '100%',
    height: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  xpProgressFill: {
    height: '100%',
    backgroundColor: '#00ff00',
  },
  xpNextLevel: {
    color: '#aaa',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00ff00',
    marginBottom: 15,
  },
  missionCard: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#3a3a3a',
  },
  missionCardCompleted: {
    borderColor: '#00ff00',
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  missionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  missionXP: {
    color: '#00ff00',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 30,
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#00ff00',
  },
  progressText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    zIndex: 1,
  },
  completedBadge: {
    marginTop: 10,
    backgroundColor: '#00ff00',
    padding: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  completedText: {
    color: '#1a1a1a',
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    padding: 20,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#00ff00',
    marginBottom: 50,
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
});
