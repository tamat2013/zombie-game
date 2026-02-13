// screens/MapCreatorScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { ref, get, update, push } from 'firebase/database';
import { auth, database } from '../firebase.config';
import { calculateGoldValue, MAP_SIZE_REQUIREMENTS, MAP_SIZES } from '../constants/tournament';

export default function MapCreatorScreen({ navigation }) {
  const [userMedals, setUserMedals] = useState({ gold: 0, silver: 0, bronze: 0 });
  const [goldValue, setGoldValue] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [mapName, setMapName] = useState('');
  const [mapGrid, setMapGrid] = useState([]);

  useEffect(() => {
    loadUserMedals();
  }, []);

  const loadUserMedals = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const medals = snapshot.val().medals || { gold: 0, silver: 0, bronze: 0 };
      setUserMedals(medals);
      setGoldValue(calculateGoldValue(medals));
    }
  };

  const selectMapSize = (size) => {
    const requirement = MAP_SIZE_REQUIREMENTS[size];
    if (goldValue < requirement) {
      Alert.alert(
        'לא מספיק מדליות',
        `דרושות ${requirement} זהב. יש לך ${goldValue.toFixed(1)} זהב`
      );
      return;
    }
    setSelectedSize(size);
    initializeGrid(MAP_SIZES[size].width, MAP_SIZES[size].height);
  };

  const initializeGrid = (width, height) => {
    const grid = Array(height).fill(null).map(() => Array(width).fill(0));
    setMapGrid(grid);
  };

  const toggleCell = (row, col) => {
    const newGrid = [...mapGrid];
    newGrid[row][col] = newGrid[row][col] === 0 ? 1 : 0; // 0 = empty, 1 = wall
    setMapGrid(newGrid);
  };

  const saveMap = async () => {
    if (!mapName.trim()) {
      Alert.alert('שגיאה', 'אנא תן שם למפה');
      return;
    }

    if (!selectedSize) {
      Alert.alert('שגיאה', 'אנא בחר גודל מפה');
      return;
    }

    const userId = auth.currentUser?.uid;
    const mapData = {
      name: mapName,
      size: selectedSize,
      grid: mapGrid,
      createdBy: userId,
      createdAt: Date.now()
    };

    const mapRef = push(ref(database, `customMaps`));
    await update(mapRef, mapData);

    // Add to user's maps
    await update(ref(database, `users/${userId}/customMaps`), {
      [mapRef.key]: true
    });

    Alert.alert(
      'הצלחה!',
      'המפה נשמרה בהצלחה!',
      [{ text: 'נהדר', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← חזור</Text>
        </TouchableOpacity>
        <Text style={styles.title}>יוצר מפות</Text>
        <View style={styles.medalsDisplay}>
          <Text style={styles.medalText}>🥇 {userMedals.gold || 0}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Medals Info */}
        <View style={styles.medalsInfo}>
          <Text style={styles.infoTitle}>המדליות שלך:</Text>
          <View style={styles.medalsRow}>
            <Text style={styles.medalItem}>🥇 {userMedals.gold || 0}</Text>
            <Text style={styles.medalItem}>🥈 {userMedals.silver || 0}</Text>
            <Text style={styles.medalItem}>🥉 {userMedals.bronze || 0}</Text>
          </View>
          <Text style={styles.goldValueText}>
            = {goldValue.toFixed(1)} זהב
          </Text>
        </View>

        {/* Size Selection */}
        <Text style={styles.sectionTitle}>בחר גודל מפה:</Text>
        {Object.entries(MAP_SIZES).map(([key, size]) => {
          const requirement = MAP_SIZE_REQUIREMENTS[key];
          const canAfford = goldValue >= requirement;

          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.sizeCard,
                selectedSize === key && styles.sizeCardSelected,
                !canAfford && styles.sizeCardDisabled
              ]}
              onPress={() => selectMapSize(key)}
              disabled={!canAfford}
            >
              <View style={styles.sizeHeader}>
                <Text style={styles.sizeName}>{size.name}</Text>
                <Text style={styles.sizePrice}>🥇 {requirement}</Text>
              </View>
              <Text style={styles.sizeInfo}>
                {size.width} × {size.height}
              </Text>
              {!canAfford && (
                <Text style={styles.lockedText}>🔒 נעול</Text>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Map Grid (simplified for demo) */}
        {selectedSize && (
          <View style={styles.mapSection}>
            <Text style={styles.sectionTitle}>ערוך מפה:</Text>
            <Text style={styles.gridInfo}>
              לחץ על תאים ליצירת קירות (שחור = קיר)
            </Text>
            <ScrollView horizontal>
              <View>
                {mapGrid.map((row, rowIndex) => (
                  <View key={rowIndex} style={styles.gridRow}>
                    {row.map((cell, colIndex) => (
                      <TouchableOpacity
                        key={colIndex}
                        style={[
                          styles.gridCell,
                          cell === 1 && styles.gridCellWall
                        ]}
                        onPress={() => toggleCell(rowIndex, colIndex)}
                      />
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Save Button */}
        {selectedSize && (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveMap}
          >
            <Text style={styles.saveButtonText}>שמור מפה</Text>
          </TouchableOpacity>
        )}
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
  medalsDisplay: {
    flexDirection: 'row',
    gap: 10,
  },
  medalText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  medalsInfo: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  infoTitle: {
    color: '#00ff00',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  medalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  medalItem: {
    fontSize: 20,
  },
  goldValueText: {
    color: '#ffd700',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00ff00',
    marginBottom: 15,
  },
  sizeCard: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#3a3a3a',
  },
  sizeCardSelected: {
    borderColor: '#00ff00',
  },
  sizeCardDisabled: {
    opacity: 0.5,
  },
  sizeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  sizeName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sizePrice: {
    color: '#ffd700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sizeInfo: {
    color: '#aaa',
    fontSize: 14,
  },
  lockedText: {
    color: '#ff0000',
    fontSize: 14,
    marginTop: 5,
  },
  mapSection: {
    marginTop: 20,
  },
  gridInfo: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 10,
  },
  gridRow: {
    flexDirection: 'row',
  },
  gridCell: {
    width: 10,
    height: 10,
    backgroundColor: '#3a3a3a',
    borderWidth: 0.5,
    borderColor: '#1a1a1a',
  },
  gridCellWall: {
    backgroundColor: '#000',
  },
  saveButton: {
    backgroundColor: '#00ff00',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 50,
  },
  saveButtonText: {
    color: '#1a1a1a',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
