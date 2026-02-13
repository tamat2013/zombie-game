// components/GameIntroAnimation.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function GameIntroAnimation({ 
  players, 
  zombieCount, 
  onAnimationComplete 
}) {
  const [phase, setPhase] = useState(1);
  const [selectedZombies, setSelectedZombies] = useState([]);
  
  // Animation values
  const fadeAnim = new Animated.Value(0);
  const shakeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(1);
  const scatterAnim = new Animated.Value(0);

  useEffect(() => {
    // Select random zombies
    const playerIds = Object.keys(players);
    const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
    const zombies = shuffled.slice(0, zombieCount);
    setSelectedZombies(zombies);

    startAnimation();
  }, []);

  const startAnimation = async () => {
    // Phase 1: Players gather (2s)
    await runPhase1();
    
    // Phase 2: Potions appear (1s)
    await runPhase2();
    
    // Phase 3: Drinking (1s)
    await runPhase3();
    
    // Phase 4: Transformation (3s)
    await runPhase4();
    
    // Phase 5: Panic and scatter (2s)
    await runPhase5();
    
    // Phase 6: Game starts (1s)
    await runPhase6();
    
    onAnimationComplete();
  };

  const runPhase1 = () => {
    return new Promise((resolve) => {
      setPhase(1);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true
      }).start(() => {
        setTimeout(resolve, 500);
      });
    });
  };

  const runPhase2 = () => {
    return new Promise((resolve) => {
      setPhase(2);
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
      setTimeout(resolve, 1000);
    });
  };

  const runPhase3 = () => {
    return new Promise((resolve) => {
      setPhase(3);
      setTimeout(resolve, 1000);
    });
  };

  const runPhase4 = () => {
    return new Promise((resolve) => {
      setPhase(4);
      
      // Shake animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(shakeAnim, {
            toValue: 10,
            duration: 50,
            useNativeDriver: true
          }),
          Animated.timing(shakeAnim, {
            toValue: -10,
            duration: 50,
            useNativeDriver: true
          }),
          Animated.timing(shakeAnim, {
            toValue: 0,
            duration: 50,
            useNativeDriver: true
          })
        ]),
        { iterations: 20 }
      ).start();
      
      setTimeout(resolve, 3000);
    });
  };

  const runPhase5 = () => {
    return new Promise((resolve) => {
      setPhase(5);
      Animated.timing(scatterAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true
      }).start(resolve);
    });
  };

  const runPhase6 = () => {
    return new Promise((resolve) => {
      setPhase(6);
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true
      }).start(resolve);
    });
  };

  const renderPlayers = () => {
    const playerList = Object.entries(players);
    const radius = 100;
    const centerX = SCREEN_WIDTH / 2;
    const centerY = SCREEN_HEIGHT / 2;

    return playerList.map(([playerId, player], index) => {
      const isZombie = selectedZombies.includes(playerId);
      const angle = (index / playerList.length) * Math.PI * 2;
      
      let x = centerX + Math.cos(angle) * radius - 20;
      let y = centerY + Math.sin(angle) * radius - 20;

      // Scatter animation for phase 5
      if (phase >= 5) {
        const scatterAngle = angle + Math.PI;
        x = centerX + Math.cos(scatterAngle) * radius * 3 * scatterAnim._value - 20;
        y = centerY + Math.sin(scatterAngle) * radius * 3 * scatterAnim._value - 20;
      }

      const backgroundColor = phase >= 4 && isZombie ? '#00ff00' : player.color || '#4a90e2';
      
      return (
        <Animated.View
          key={playerId}
          style={[
            styles.player,
            {
              left: x,
              top: y,
              backgroundColor,
              transform: [
                { 
                  translateX: phase === 4 && isZombie ? shakeAnim : 0 
                },
                {
                  scale: phase === 4 && isZombie ? scaleAnim : 1
                }
              ]
            }
          ]}
        >
          <Text style={styles.playerEmoji}>
            {phase >= 4 && isZombie ? '🧟' : '👤'}
          </Text>
        </Animated.View>
      );
    });
  };

  const renderPotions = () => {
    if (phase < 2) return null;

    const centerX = SCREEN_WIDTH / 2;
    const centerY = SCREEN_HEIGHT / 2;

    return Array.from({ length: zombieCount }).map((_, index) => (
      <Animated.View
        key={index}
        style={[
          styles.potion,
          {
            left: centerX - 15 + (index - zombieCount / 2) * 30,
            top: centerY - 50,
            opacity: phase >= 3 ? 0 : 1,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <Text style={styles.potionEmoji}>🧪</Text>
      </Animated.View>
    ));
  };

  const renderDialogue = () => {
    let text = '';
    
    switch(phase) {
      case 2:
        text = '?!מה זה';
        break;
      case 3:
        text = '!בואו נבדוק';
        break;
      case 4:
        text = '...😱';
        break;
      case 5:
        text = '!!!זומבים';
        break;
      case 6:
        text = '!שרדו';
        break;
      default:
        text = '';
    }

    if (!text) return null;

    return (
      <Animated.View style={[styles.dialogue, { opacity: fadeAnim }]}>
        <Text style={styles.dialogueText}>{text}</Text>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.scene, { opacity: fadeAnim }]}>
        {renderPlayers()}
        {renderPotions()}
        {renderDialogue()}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.95)',
    zIndex: 1000,
  },
  scene: {
    flex: 1,
  },
  player: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  playerEmoji: {
    fontSize: 24,
  },
  potion: {
    position: 'absolute',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  potionEmoji: {
    fontSize: 30,
  },
  dialogue: {
    position: 'absolute',
    top: SCREEN_HEIGHT / 2 - 150,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  dialogueText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    textShadowColor: '#00ff00',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  }
});
