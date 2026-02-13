// screens/ObstacleCourseScreen.js
// Obstacle course mini-game: Run from zombie or chase as zombie!

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Alert } from 'react-native';
import { ref, get, update } from 'firebase/database';
import { auth, database } from '../firebase.config';

const GAME_SPEED = 5; // Same speed for both
const OBSTACLE_SPAWN_INTERVAL = 1500; // New obstacle every 1.5 seconds
const GAME_DURATION = 60; // 60 seconds
const XP_REWARDS = {
  survivor_win: 300,
  zombie_win: 350,
  participation: 50
};

export default function ObstacleCourseScreen({ navigation }) {
  const [selectedRole, setSelectedRole] = useState(null); // 'survivor' or 'zombie'
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [obstacles, setObstacles] = useState([]);
  const [playerY, setPlayerY] = useState(50); // Player vertical position (0-100)
  const [zombieDistance, setZombieDistance] = useState(100); // Distance behind/ahead
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const gameLoopRef = useRef(null);
  const obstacleTimerRef = useRef(null);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      startGameLoop();
    }

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      if (obstacleTimerRef.current) clearInterval(obstacleTimerRef.current);
    };
  }, [gameStarted, gameOver]);

  const startGame = (role) => {
    setSelectedRole(role);
    setGameStarted(true);
    setTimeLeft(GAME_DURATION);
    setScore(0);
    setObstacles([]);
    setPlayerY(50);
    setZombieDistance(role === 'survivor' ? 100 : -100); // Behind if survivor, ahead if zombie
    setGameOver(false);
    setWon(false);
  };

  const startGameLoop = () => {
    // Main game loop
    gameLoopRef.current = setInterval(() => {
      updateGame();
    }, 50); // 20 FPS

    // Timer countdown
    const timerInterval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame(true); // Time ran out - win!
          clearInterval(timerInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Spawn obstacles
    obstacleTimerRef.current = setInterval(() => {
      spawnObstacle();
    }, OBSTACLE_SPAWN_INTERVAL);
  };

  const spawnObstacle = () => {
    const newObstacle = {
      id: Date.now(),
      x: 100, // Start from right
      y: Math.random() * 80 + 10, // Random height (10-90)
      type: Math.random() > 0.5 ? 'high' : 'low' // Jump over or duck under
    };
    setObstacles(prev => [...prev, newObstacle]);
  };

  const updateGame = () => {
    // Move obstacles
    setObstacles(prev => 
      prev
        .map(obs => ({ ...obs, x: obs.x - GAME_SPEED }))
        .filter(obs => obs.x > -10) // Remove off-screen obstacles
    );

    // Update zombie distance
    if (selectedRole === 'survivor') {
      // Zombie catching up
      setZombieDistance(prev => {
        const newDist = prev - 0.3; // Zombie gets closer
        if (newDist <= 0) {
          endGame(false); // Caught!
          return 0;
        }
        return newDist;
      });
    } else {
      // You're chasing
      setZombieDistance(prev => {
        const newDist = prev + 0.3; // You get closer
        if (newDist >= 0) {
          endGame(true); // Caught them!
          return 0;
        }
        return newDist;
      });
    }

    // Check collision with obstacles
    obstacles.forEach(obs => {
      if (obs.x >= 10 && obs.x <= 20) { // Player zone
        const collision = checkCollision(obs);
        if (collision) {
          endGame(false); // Hit obstacle!
        } else {
          // Successfully dodged
          setScore(prev => prev + 10);
        }
      }
    });
  };

  const checkCollision = (obstacle) => {
    const playerRange = 10;
    const distance = Math.abs(playerY - obstacle.y);
    return distance < playerRange;
  };

  const jump = () => {
    setPlayerY(20); // Jump up
    setTimeout(() => setPlayerY(50), 500); // Return to normal
  };

  const duck = () => {
    setPlayerY(80); // Duck down
    setTimeout(() => setPlayerY(50), 500); // Return to normal
  };

  const endGame = async (didWin) => {
    setGameOver(true);
    setWon(didWin);
    
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    if (obstacleTimerRef.current) clearInterval(obstacleTimerRef.current);

    // Award XP
    let xpEarned = XP_REWARDS.participation;
    if (didWin) {
      xpEarned = selectedRole === 'survivor' 
        ? XP_REWARDS.survivor_win 
        : XP_REWARDS.zombie_win;
    }

    const userId = auth.currentUser?.uid;
    if (userId) {
      const userRef = ref(database, `users/${userId}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const currentXP = snapshot.val().xp || 0;
        await update(userRef, {
          xp: currentXP + xpEarned
        });
      }
    }

    Alert.alert(
      didWin ? '🎉 ניצחון!' : '😢 הפסדת',
      `קיבלת ${xpEarned} XP!\nניקוד: ${score}`,
      [
        { text: 'שחק שוב', onPress: () => navigation.replace('ObstacleCourse') },
        { text: 'חזור', onPress: () => navigation.goBack() }
      ]
    );
  };

  if (!selectedRole) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← חזור</Text>
          </TouchableOpacity>
          <Text style={styles.title}>מסלול מכשולים</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.roleSelection}>
          <Text style={styles.selectionTitle}>בחר תפקיד:</Text>
          
          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => startGame('survivor')}
          >
            <Text style={styles.roleEmoji}>🏃‍♂️</Text>
            <Text style={styles.roleName}>בורח</Text>
            <Text style={styles.roleDesc}>ברוח מהזומבי! תשרוד 60 שניות</Text>
            <Text style={styles.roleReward}>💎 +{XP_REWARDS.survivor_win} XP</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => startGame('zombie')}
          >
            <Text style={styles.roleEmoji}>🧟</Text>
            <Text style={styles.roleName}>זומבי</Text>
            <Text style={styles.roleDesc}>רדוף אחרי השורד! תפוס אותו</Text>
            <Text style={styles.roleReward}>💎 +{XP_REWARDS.zombie_win} XP</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Game HUD */}
      <View style={styles.hud}>
        <Text style={styles.hudText}>⏱️ {timeLeft}s</Text>
        <Text style={styles.hudText}>⭐ {score}</Text>
        <Text style={styles.hudText}>
          {selectedRole === 'survivor' ? '🧟' : '🏃‍♂️'} {Math.abs(Math.floor(zombieDistance))}m
        </Text>
      </View>

      {/* Game Area */}
      <View style={styles.gameArea}>
        {/* Player */}
        <View style={[styles.player, { top: `${playerY}%` }]}>
          <Text style={styles.playerEmoji}>
            {selectedRole === 'survivor' ? '🏃‍♂️' : '🧟'}
          </Text>
        </View>

        {/* Obstacles */}
        {obstacles.map(obs => (
          <View
            key={obs.id}
            style={[
              styles.obstacle,
              {
                left: `${obs.x}%`,
                top: `${obs.y}%`,
                backgroundColor: obs.type === 'high' ? '#ff0000' : '#ffaa00'
              }
            ]}
          >
            <Text style={styles.obstacleText}>
              {obs.type === 'high' ? '⬆️' : '⬇️'}
            </Text>
          </View>
        ))}

        {/* Enemy (zombie or survivor) */}
        <View style={[
          styles.enemy,
          {
            left: selectedRole === 'survivor' 
              ? `${-zombieDistance}%` 
              : `${100 + zombieDistance}%`
          }
        ]}>
          <Text style={styles.enemyEmoji}>
            {selectedRole === 'survivor' ? '🧟' : '🏃‍♂️'}
          </Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={jump}
        >
          <Text style={styles.controlText}>⬆️ קפוץ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={duck}
        >
          <Text style={styles.controlText}>⬇️ התכופף</Text>
        </TouchableOpacity>
      </View>
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
  roleSelection: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  selectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00ff00',
    textAlign: 'center',
    marginBottom: 30,
  },
  roleCard: {
    backgroundColor: '#2a2a2a',
    padding: 30,
    borderRadius: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3a3a3a',
  },
  roleEmoji: {
    fontSize: 64,
    marginBottom: 15,
  },
  roleName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  roleDesc: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 15,
  },
  roleReward: {
    fontSize: 18,
    color: '#00ff00',
    fontWeight: 'bold',
  },
  hud: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#2a2a2a',
  },
  hudText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  gameArea: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    position: 'relative',
  },
  player: {
    position: 'absolute',
    left: '10%',
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerEmoji: {
    fontSize: 40,
  },
  obstacle: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  obstacleText: {
    fontSize: 24,
  },
  enemy: {
    position: 'absolute',
    top: '50%',
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enemyEmoji: {
    fontSize: 40,
  },
  controls: {
    flexDirection: 'row',
    padding: 20,
    gap: 20,
  },
  controlButton: {
    flex: 1,
    backgroundColor: '#00ff00',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
  },
  controlText: {
    color: '#1a1a1a',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
