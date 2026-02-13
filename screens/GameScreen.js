// screens/GameScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { ref, onValue, update, off } from 'firebase/database';
import { database, auth } from '../firebase.config';
import { useAbilities } from '../components/AbilityManager';
import { calculateRewards } from '../utils/rewardManager';
import { SPECIAL_SKINS } from '../constants/upgrades';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const GAME_DURATION = 600; // 10 minutes
const INFECTION_COUNTDOWN = 10; // 10 seconds to heal
const BITE_RANGE = 20; // Distance for bite

export default function GameScreen({ route, navigation }) {
  const { gameId } = route.params;
  const [gameData, setGameData] = useState(null);
  const [myPlayer, setMyPlayer] = useState(null);
  const [players, setPlayers] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(GAME_DURATION);
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  
  const intervalRef = useRef(null);
  const userId = auth.currentUser?.uid;
  
  // Abilities and items management
  const {
    userAbilities,
    userItems,
    userSkinPowers,
    userSkin,
    canUseAbility,
    useAbility,
    canUseSkinPower,
    useSkinPower,
    getItemBonuses,
    getAvailableAbilities
  } = useAbilities(gameId, myPlayer);

  useEffect(() => {
    const gameRef = ref(database, `games/${gameId}`);
    
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGameData(data);
        
        if (data.players) {
          const playersList = Object.values(data.players);
          setPlayers(playersList);
          
          const me = data.players[userId];
          setMyPlayer(me);
        }
        
        // Check if game ended
        if (data.status === 'finished') {
          handleGameEnd(data);
        }
      }
    });

    // Start game timer
    intervalRef.current = setInterval(() => {
      updateGameTimer();
    }, 1000);

    return () => {
      off(gameRef);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [gameId]);

  // Movement loop
  useEffect(() => {
    const movementInterval = setInterval(() => {
      if (joystickPosition.x !== 0 || joystickPosition.y !== 0) {
        movePlayer();
      }
      
      // Update infected players countdown
      updateInfectedPlayers();
    }, 100);

    return () => clearInterval(movementInterval);
  }, [joystickPosition, myPlayer, players]);

  const updateGameTimer = async () => {
    if (!gameData) return;
    
    const elapsed = Math.floor((Date.now() - gameData.startTime) / 1000);
    const remaining = GAME_DURATION - elapsed;
    setTimeRemaining(remaining);

    if (remaining <= 0) {
      // Time's up - survivors win
      await update(ref(database, `games/${gameId}`), {
        status: 'finished',
        winner: 'survivors'
      });
    }
  };

  const updateInfectedPlayers = async () => {
    if (!gameData?.players) return;
    
    const updates = {};
    let allInfected = true;
    
    Object.entries(gameData.players).forEach(([playerId, player]) => {
      if (player.isInfected && !player.role === 'zombie') {
        const timeSinceInfection = (Date.now() - player.infectedTime) / 1000;
        
        if (timeSinceInfection >= INFECTION_COUNTDOWN) {
          // Turn into zombie
          updates[`games/${gameId}/players/${playerId}/role`] = 'zombie';
          updates[`games/${gameId}/players/${playerId}/speed`] = 3;
          updates[`games/${gameId}/players/${playerId}/isInfected`] = false;
        }
      }
      
      if (player.role !== 'zombie' && !player.isInfected) {
        allInfected = false;
      }
    });

    if (Object.keys(updates).length > 0) {
      await update(ref(database), updates);
    }

    // Check if all players are zombies
    if (allInfected) {
      await update(ref(database, `games/${gameId}`), {
        status: 'finished',
        winner: 'zombies'
      });
    }
  };

  const movePlayer = async () => {
    if (!myPlayer || myPlayer.isInfected || !myPlayer.isAlive) return;

    const bonuses = getItemBonuses();
    const effectiveSpeed = myPlayer.speed * (1 + bonuses.speedBonus);
    
    const newX = Math.max(0, Math.min(100, myPlayer.position.x + joystickPosition.x * effectiveSpeed * 0.1));
    const newY = Math.max(0, Math.min(100, myPlayer.position.y + joystickPosition.y * effectiveSpeed * 0.1));

    await update(ref(database, `games/${gameId}/players/${userId}/position`), {
      x: newX,
      y: newY
    });
  };

  const handleBite = async () => {
    if (myPlayer?.role !== 'zombie') return;

    const bonuses = getItemBonuses();
    const effectiveRange = BITE_RANGE * (1 + bonuses.rangeBonus);
    let biteCount = 0;

    // Find nearby survivors
    for (const player of players) {
      if (player.id === userId || player.role === 'zombie') continue;

      const distance = Math.sqrt(
        Math.pow(player.position.x - myPlayer.position.x, 2) +
        Math.pow(player.position.y - myPlayer.position.y, 2)
      );

      if (distance < effectiveRange) {
        // Check for protection
        let infected = true;
        
        // Check vest protection (first bite only)
        if (player.hasVest && !player.wasBittenBefore) {
          const random = Math.random();
          if (random < 0.3) { // 30% protection
            infected = false;
          }
        }
        
        if (infected) {
          // Bite player
          await update(ref(database, `games/${gameId}/players/${player.id}`), {
            isInfected: true,
            infectedTime: Date.now(),
            isAlive: false,
            wasBittenBefore: true,
            wasInfected: true
          });
          biteCount++;
        }
      }
    }
    
    // Track successful bites
    if (biteCount > 0) {
      const currentBites = myPlayer.successfulBites || 0;
      await update(ref(database, `games/${gameId}/players/${userId}`), {
        successfulBites: currentBites + biteCount
      });
    }
  };

  const handleHeal = async () => {
    if (myPlayer?.role !== 'doctor') return;

    const bonuses = getItemBonuses();
    const effectiveRange = BITE_RANGE * (1 + bonuses.rangeBonus);
    let healCount = 0;

    // Find nearby infected players
    for (const player of players) {
      if (player.id === userId || !player.isInfected) continue;

      const distance = Math.sqrt(
        Math.pow(player.position.x - myPlayer.position.x, 2) +
        Math.pow(player.position.y - myPlayer.position.y, 2)
      );

      if (distance < effectiveRange) {
        // Heal player
        const wasDoctor = player.role === 'doctor';
        await update(ref(database, `games/${gameId}/players/${player.id}`), {
          isInfected: false,
          infectedTime: null,
          isAlive: true,
          role: wasDoctor ? 'survivor' : player.role // Doctor loses role if healed
        });
        healCount++;
      }
    }
    
    // Track successful heals
    if (healCount > 0) {
      const currentHeals = myPlayer.successfulHeals || 0;
      await update(ref(database, `games/${gameId}/players/${userId}`), {
        successfulHeals: currentHeals + healCount
      });
    }
  };

  const handleGameEnd = async (data) => {
    // Calculate rewards
    const rewards = await calculateRewards(gameId, userId);
    
    let message = data.winner === 'zombies' ? '🧟 הזומבים ניצחו!' : '👥 השורדים ניצחו!';
    
    if (rewards) {
      message += `\n\n💰 הרווחת ${rewards.coinsEarned} מטבעות!`;
      message += `\n💎 סה"כ: ${rewards.totalCoins} מטבעות`;
    }
    
    Alert.alert(
      'המשחק הסתיים!',
      message,
      [
        {
          text: 'חזור לתפריט',
          onPress: () => navigation.navigate('MapSelection')
        }
      ]
    );
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getInfectionCountdown = (player) => {
    if (!player.isInfected) return null;
    const elapsed = Math.floor((Date.now() - player.infectedTime) / 1000);
    return INFECTION_COUNTDOWN - elapsed;
  };

  return (
    <View style={styles.container}>
      {/* Game HUD */}
      <View style={styles.hud}>
        <View style={styles.hudItem}>
          <Text style={styles.hudText}>⏱️ {formatTime(timeRemaining)}</Text>
        </View>
        <View style={styles.hudItem}>
          <Text style={[styles.hudText, 
            myPlayer?.role === 'zombie' && styles.zombieText,
            myPlayer?.role === 'doctor' && styles.doctorText
          ]}>
            {myPlayer?.role === 'zombie' && '🧟 זומבי'}
            {myPlayer?.role === 'doctor' && '⚕️ רופא'}
            {myPlayer?.role === 'survivor' && '👤 שורד'}
          </Text>
        </View>
      </View>

      {/* Game Area */}
      <View style={styles.gameArea}>
        {players.map((player) => (
          <View
            key={player.id}
            style={[
              styles.player,
              {
                left: `${player.position.x}%`,
                top: `${player.position.y}%`,
              },
              player.role === 'zombie' && styles.zombiePlayer,
              player.role === 'doctor' && styles.doctorPlayer,
              player.isInfected && styles.infectedPlayer,
              player.id === userId && styles.myPlayer
            ]}
          >
            <Text style={styles.playerEmoji}>
              {player.role === 'zombie' ? '🧟' : player.role === 'doctor' ? '⚕️' : '👤'}
            </Text>
            {player.isInfected && (
              <Text style={styles.countdown}>{getInfectionCountdown(player)}</Text>
            )}
          </View>
        ))}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Abilities Bar */}
        <View style={styles.abilitiesBar}>
          {getAvailableAbilities().map((ability) => (
            <TouchableOpacity
              key={ability.id}
              style={[
                styles.abilityButton,
                ability.onCooldown && styles.abilityButtonDisabled
              ]}
              onPress={() => useAbility(ability.id)}
              disabled={ability.onCooldown}
            >
              <Text style={styles.abilityButtonText}>⚡</Text>
              {ability.usesLeft !== undefined && (
                <Text style={styles.usesLeftText}>{ability.usesLeft}</Text>
              )}
            </TouchableOpacity>
          ))}
          
          {/* Skin Power Button */}
          {userSkinPowers[userSkin] && SPECIAL_SKINS[userSkin] && (
            <TouchableOpacity
              style={[
                styles.skinPowerButton,
                !canUseSkinPower() && styles.abilityButtonDisabled
              ]}
              onPress={useSkinPower}
              disabled={!canUseSkinPower()}
            >
              <Text style={styles.abilityButtonText}>✨</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Joystick */}
        <View style={styles.controlsRow}>
          <View style={styles.joystickArea}>
          <View
            style={styles.joystick}
            onTouchStart={(e) => handleJoystickStart(e)}
            onTouchMove={(e) => handleJoystickMove(e)}
            onTouchEnd={handleJoystickEnd}
          >
            <View style={styles.joystickOuter}>
              <View 
                style={[
                  styles.joystickInner,
                  {
                    transform: [
                      { translateX: joystickPosition.x * 30 },
                      { translateY: joystickPosition.y * 30 }
                    ]
                  }
                ]} 
              />
            </View>
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.actionArea}>
          {myPlayer?.role === 'zombie' && !myPlayer.isInfected && (
            <TouchableOpacity style={styles.biteButton} onPress={handleBite}>
              <Text style={styles.actionButtonText}>🦷 נשיכה</Text>
            </TouchableOpacity>
          )}
          
          {myPlayer?.role === 'doctor' && !myPlayer.isInfected && (
            <TouchableOpacity style={styles.healButton} onPress={handleHeal}>
              <Text style={styles.actionButtonText}>💉 ריפוי</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>

      {/* Infected message */}
      {myPlayer?.isInfected && (
        <View style={styles.infectedOverlay}>
          <Text style={styles.infectedText}>
            🧟 אתה נדבק! 
          </Text>
          <Text style={styles.infectedCountdown}>
            {getInfectionCountdown(myPlayer)}
          </Text>
          <Text style={styles.infectedSubtext}>
            חפש רופא מהר!
          </Text>
        </View>
      )}
    </View>
  );

  function handleJoystickStart(e) {
    // Joystick touch start logic
  }

  function handleJoystickMove(e) {
    const touch = e.nativeEvent;
    const joystickRadius = 50;
    
    // Calculate relative position
    const centerX = touch.pageX;
    const centerY = touch.pageY;
    
    // Normalize to -1 to 1 range
    let x = (touch.pageX - centerX) / joystickRadius;
    let y = (touch.pageY - centerY) / joystickRadius;
    
    // Clamp to circle
    const distance = Math.sqrt(x * x + y * y);
    if (distance > 1) {
      x /= distance;
      y /= distance;
    }
    
    setJoystickPosition({ x, y });
  }

  function handleJoystickEnd() {
    setJoystickPosition({ x: 0, y: 0 });
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  hud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  hudItem: {
    backgroundColor: '#2a2a2a',
    padding: 10,
    borderRadius: 10,
  },
  hudText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  zombieText: {
    color: '#ff0000',
  },
  doctorText: {
    color: '#00ff00',
  },
  gameArea: {
    flex: 1,
    backgroundColor: '#4a4a4a',
    position: 'relative',
    borderWidth: 5,
    borderColor: '#2a2a2a',
  },
  player: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
  playerEmoji: {
    fontSize: 30,
  },
  zombiePlayer: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
    borderRadius: 20,
  },
  doctorPlayer: {
    backgroundColor: 'rgba(0, 255, 0, 0.3)',
    borderRadius: 20,
  },
  infectedPlayer: {
    backgroundColor: 'rgba(255, 140, 0, 0.5)',
    borderRadius: 20,
  },
  myPlayer: {
    borderWidth: 3,
    borderColor: '#ffff00',
  },
  countdown: {
    position: 'absolute',
    top: -20,
    color: '#ff0000',
    fontSize: 20,
    fontWeight: 'bold',
  },
  controls: {
    flexDirection: 'column',
    padding: 20,
    paddingBottom: 40,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  abilitiesBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 15,
  },
  abilityButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#00ff00',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  abilityButtonDisabled: {
    backgroundColor: '#555',
    opacity: 0.5,
  },
  abilityButtonText: {
    fontSize: 24,
  },
  usesLeftText: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff0000',
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 10,
  },
  skinPowerButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ffd700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  joystickArea: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joystick: {
    width: 120,
    height: 120,
  },
  joystickOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  joystickInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  actionArea: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  biteButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ff0000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  healButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#00ff00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infectedOverlay: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -50 }],
    width: 200,
    backgroundColor: 'rgba(255, 0, 0, 0.9)',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  infectedText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infectedCountdown: {
    color: 'white',
    fontSize: 48,
    fontWeight: 'bold',
  },
  infectedSubtext: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
});
