// components/MissionMinigames.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';

// Mission 1: Fix Wires
export function WiresMission({ onComplete }) {
  const [connectedWires, setConnectedWires] = useState([]);
  const wires = [
    { id: 1, color: '#ff0000', left: 'A', right: '1' },
    { id: 2, color: '#00ff00', left: 'B', right: '2' },
    { id: 3, color: '#0000ff', left: 'C', right: '3' },
    { id: 4, color: '#ffff00', left: 'D', right: '4' },
  ];

  const handleConnect = (wireId) => {
    const newConnected = [...connectedWires, wireId];
    setConnectedWires(newConnected);
    
    if (newConnected.length === wires.length) {
      setTimeout(() => onComplete(200), 500);
    }
  };

  return (
    <View style={styles.missionContainer}>
      <Text style={styles.missionTitle}>חבר את החוטים</Text>
      <View style={styles.wiresContainer}>
        {wires.map((wire) => (
          <View key={wire.id} style={styles.wireRow}>
            <View style={[styles.wirePoint, { backgroundColor: wire.color }]}>
              <Text style={styles.wireLabel}>{wire.left}</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.wireButton,
                connectedWires.includes(wire.id) && styles.wireButtonConnected
              ]}
              onPress={() => handleConnect(wire.id)}
              disabled={connectedWires.includes(wire.id)}
            >
              <Text style={styles.wireButtonText}>
                {connectedWires.includes(wire.id) ? '✓' : '○'}
              </Text>
            </TouchableOpacity>
            <View style={[styles.wirePoint, { backgroundColor: wire.color }]}>
              <Text style={styles.wireLabel}>{wire.right}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// Mission 2: Fix Machine
export function MachineMission({ onComplete }) {
  const [sequence, setSequence] = useState([]);
  const [userInput, setUserInput] = useState([]);
  const buttons = [1, 2, 3, 4, 5, 6];

  useEffect(() => {
    // Generate random sequence
    const randomSeq = [];
    for (let i = 0; i < 4; i++) {
      randomSeq.push(buttons[Math.floor(Math.random() * buttons.length)]);
    }
    setSequence(randomSeq);
  }, []);

  const handlePress = (num) => {
    const newInput = [...userInput, num];
    setUserInput(newInput);

    // Check if correct
    if (newInput[newInput.length - 1] !== sequence[newInput.length - 1]) {
      // Wrong! Reset
      setUserInput([]);
      return;
    }

    // Check if complete
    if (newInput.length === sequence.length) {
      setTimeout(() => onComplete(250), 500);
    }
  };

  return (
    <View style={styles.missionContainer}>
      <Text style={styles.missionTitle}>תקן את המכונה</Text>
      <Text style={styles.missionSubtitle}>לחץ על הכפתורים בסדר הנכון</Text>
      <View style={styles.sequenceDisplay}>
        {sequence.map((num, idx) => (
          <View
            key={idx}
            style={[
              styles.sequenceNumber,
              userInput[idx] !== undefined && styles.sequenceNumberRevealed
            ]}
          >
            <Text style={styles.sequenceText}>
              {userInput[idx] !== undefined ? num : '?'}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.buttonGrid}>
        {buttons.map((num) => (
          <TouchableOpacity
            key={num}
            style={styles.machineButton}
            onPress={() => handlePress(num)}
          >
            <Text style={styles.machineButtonText}>{num}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// Mission 3: Download Data
export function DownloadMission({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [pressing, setPressing] = useState(false);

  useEffect(() => {
    let interval;
    if (pressing) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => onComplete(150), 500);
            return 100;
          }
          return prev + 2;
        });
      }, 100);
    } else {
      // Decrease when not pressing
      interval = setInterval(() => {
        setProgress((prev) => Math.max(0, prev - 1));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [pressing]);

  return (
    <View style={styles.missionContainer}>
      <Text style={styles.missionTitle}>הורד נתונים</Text>
      <Text style={styles.missionSubtitle}>החזק את הכפתור</Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
        <Text style={styles.progressText}>{Math.floor(progress)}%</Text>
      </View>
      <TouchableOpacity
        style={[styles.downloadButton, pressing && styles.downloadButtonPressed]}
        onPressIn={() => setPressing(true)}
        onPressOut={() => setPressing(false)}
      >
        <Text style={styles.downloadButtonText}>
          {pressing ? '...מוריד' : 'לחץ והחזק'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// Mission 4: Empty Trash
export function TrashMission({ onComplete }) {
  const [items, setItems] = useState([
    { id: 1, emoji: '📄', inTrash: false },
    { id: 2, emoji: '🗑️', inTrash: false },
    { id: 3, emoji: '📦', inTrash: false },
    { id: 4, emoji: '🧻', inTrash: false },
  ]);

  const handleDrop = (itemId) => {
    const newItems = items.map(item =>
      item.id === itemId ? { ...item, inTrash: true } : item
    );
    setItems(newItems);

    if (newItems.every(item => item.inTrash)) {
      setTimeout(() => onComplete(180), 500);
    }
  };

  return (
    <View style={styles.missionContainer}>
      <Text style={styles.missionTitle}>זרוק אשפה</Text>
      <View style={styles.trashArea}>
        <View style={styles.itemsRow}>
          {items.filter(i => !i.inTrash).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.trashItem}
              onPress={() => handleDrop(item.id)}
            >
              <Text style={styles.trashEmoji}>{item.emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.trashBin}>
          <Text style={styles.trashBinText}>🗑️</Text>
          <Text style={styles.trashCount}>{items.filter(i => i.inTrash).length}/{items.length}</Text>
        </View>
      </View>
    </View>
  );
}

// Mission 5: Temperature Check
export function TemperatureMission({ onComplete }) {
  const [temperature, setTemperature] = useState(50);
  const [success, setSuccess] = useState(false);
  const targetTemp = 75;
  const tolerance = 5;

  const handleCheck = () => {
    if (Math.abs(temperature - targetTemp) <= tolerance) {
      setSuccess(true);
      setTimeout(() => onComplete(220), 500);
    }
  };

  return (
    <View style={styles.missionContainer}>
      <Text style={styles.missionTitle}>בדוק טמפרטורה</Text>
      <Text style={styles.missionSubtitle}>הגדר ל-{targetTemp}°C</Text>
      <View style={styles.thermometer}>
        <View style={[styles.mercury, { height: `${temperature}%` }]} />
        <Text style={styles.tempValue}>{temperature}°C</Text>
      </View>
      <View style={styles.tempControls}>
        <TouchableOpacity
          style={styles.tempButton}
          onPress={() => setTemperature(Math.max(0, temperature - 5))}
        >
          <Text style={styles.tempButtonText}>-</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.checkButton, success && styles.checkButtonSuccess]}
          onPress={handleCheck}
        >
          <Text style={styles.checkButtonText}>בדוק</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tempButton}
          onPress={() => setTemperature(Math.min(100, temperature + 5))}
        >
          <Text style={styles.tempButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  missionContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    minHeight: 300,
  },
  missionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00ff00',
    marginBottom: 10,
  },
  missionSubtitle: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 20,
  },
  
  // Wires Mission
  wiresContainer: {
    width: '100%',
  },
  wireRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  wirePoint: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wireLabel: {
    color: 'white',
    fontWeight: 'bold',
  },
  wireButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#777',
  },
  wireButtonConnected: {
    backgroundColor: '#00ff00',
    borderColor: '#00ff00',
  },
  wireButtonText: {
    fontSize: 24,
    color: 'white',
  },
  
  // Machine Mission
  sequenceDisplay: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  sequenceNumber: {
    width: 50,
    height: 50,
    backgroundColor: '#555',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sequenceNumberRevealed: {
    backgroundColor: '#00ff00',
  },
  sequenceText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  machineButton: {
    width: 70,
    height: 70,
    backgroundColor: '#4a90e2',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  machineButtonText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  
  // Download Mission
  progressBar: {
    width: '100%',
    height: 40,
    backgroundColor: '#555',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    zIndex: 1,
  },
  downloadButton: {
    width: '100%',
    padding: 20,
    backgroundColor: '#4a90e2',
    borderRadius: 15,
    alignItems: 'center',
  },
  downloadButtonPressed: {
    backgroundColor: '#00ff00',
  },
  downloadButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  
  // Trash Mission
  trashArea: {
    width: '100%',
  },
  itemsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 30,
    justifyContent: 'center',
  },
  trashItem: {
    width: 60,
    height: 60,
    backgroundColor: '#555',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trashEmoji: {
    fontSize: 36,
  },
  trashBin: {
    width: '100%',
    height: 100,
    backgroundColor: '#333',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#666',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trashBinText: {
    fontSize: 48,
  },
  trashCount: {
    fontSize: 18,
    color: '#00ff00',
    fontWeight: 'bold',
  },
  
  // Temperature Mission
  thermometer: {
    width: 80,
    height: 200,
    backgroundColor: '#555',
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  mercury: {
    width: '100%',
    backgroundColor: '#ff0000',
    position: 'absolute',
    bottom: 0,
  },
  tempValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    zIndex: 1,
    paddingBottom: 10,
  },
  tempControls: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
  },
  tempButton: {
    width: 60,
    height: 60,
    backgroundColor: '#4a90e2',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tempButtonText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  checkButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    backgroundColor: '#00ff00',
    borderRadius: 15,
  },
  checkButtonSuccess: {
    backgroundColor: '#ffd700',
  },
  checkButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
});
