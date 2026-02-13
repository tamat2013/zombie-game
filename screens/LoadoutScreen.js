// screens/LoadoutScreen.js
// Screen for selecting 1 ability and 5 items before game

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { ref, get } from 'firebase/database';
import { auth, database } from '../firebase.config';
import { ABILITIES, ITEMS } from '../constants/upgrades';

export default function LoadoutScreen({ navigation, route }) {
  const [userAbilities, setUserAbilities] = useState([]);
  const [userItems, setUserItems] = useState([]);
  const [selectedAbility, setSelectedAbility] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    loadUserUpgrades();
  }, []);

  const loadUserUpgrades = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      
      // Get owned abilities
      const ownedAbilities = data.abilities || {};
      const abilities = Object.keys(ownedAbilities)
        .filter(key => ownedAbilities[key])
        .map(key => ABILITIES[key])
        .filter(Boolean);
      
      // Get owned items
      const ownedItems = data.items || {};
      const items = Object.keys(ownedItems)
        .filter(key => ownedItems[key])
        .map(key => ITEMS[key])
        .filter(Boolean);
      
      setUserAbilities(abilities);
      setUserItems(items);
    }
  };

  const toggleItemSelection = (item) => {
    if (selectedItems.find(i => i.id === item.id)) {
      // Remove item
      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    } else {
      // Add item (max 5)
      if (selectedItems.length >= 5) {
        Alert.alert('מקסימום', 'אתה יכול לבחור עד 5 חפצים');
        return;
      }
      setSelectedItems([...selectedItems, item]);
    }
  };

  const confirmLoadout = () => {
    if (!selectedAbility) {
      Alert.alert('חסר יכולת', 'אנא בחר יכולת אחת');
      return;
    }

    if (selectedItems.length === 0) {
      Alert.alert('חסרים חפצים', 'אנא בחר לפחות חפץ אחד');
      return;
    }

    // Save loadout and continue to game
    const loadout = {
      ability: selectedAbility,
      items: selectedItems
    };

    // Navigate back to map selection with loadout
    navigation.navigate('MapSelection', { loadout });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← חזור</Text>
        </TouchableOpacity>
        <Text style={styles.title}>בחר ציוד</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Ability Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ בחר יכולת אחת:</Text>
          
          {userAbilities.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>אין לך יכולות! קנה בחנות</Text>
            </View>
          ) : (
            userAbilities.map((ability) => (
              <TouchableOpacity
                key={ability.id}
                style={[
                  styles.abilityCard,
                  selectedAbility?.id === ability.id && styles.selectedCard
                ]}
                onPress={() => setSelectedAbility(ability)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.abilityName}>{ability.name}</Text>
                  {selectedAbility?.id === ability.id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
                <Text style={styles.abilityDesc}>{ability.description}</Text>
                <View style={styles.abilityStats}>
                  <Text style={styles.statText}>⏱️ {ability.cooldown}s</Text>
                  <Text style={styles.statText}>🎯 {ability.role}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Items Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            🎒 בחר עד 5 חפצים ({selectedItems.length}/5):
          </Text>
          
          {userItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>אין לך חפצים! קנה בחנות</Text>
            </View>
          ) : (
            userItems.map((item) => {
              const isSelected = selectedItems.find(i => i.id === item.id);
              
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.itemCard,
                    isSelected && styles.selectedCard
                  ]}
                  onPress={() => toggleItemSelection(item)}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {isSelected && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                  <Text style={styles.itemDesc}>{item.description}</Text>
                  <View style={styles.itemStats}>
                    <Text style={styles.statText}>📦 {item.type}</Text>
                    <Text style={styles.statText}>🎭 {item.role}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>📋 הציוד שנבחר:</Text>
          <Text style={styles.summaryText}>
            ⚡ יכולת: {selectedAbility?.name || 'לא נבחר'}
          </Text>
          <Text style={styles.summaryText}>
            🎒 חפצים: {selectedItems.length}/5
          </Text>
        </View>
      </ScrollView>

      {/* Confirm Button */}
      <TouchableOpacity
        style={[
          styles.confirmButton,
          (!selectedAbility || selectedItems.length === 0) && styles.confirmButtonDisabled
        ]}
        onPress={confirmLoadout}
        disabled={!selectedAbility || selectedItems.length === 0}
      >
        <Text style={styles.confirmButtonText}>✓ אישור והמשך</Text>
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
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#00ff00',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  abilityCard: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#3a3a3a',
  },
  itemCard: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#3a3a3a',
  },
  selectedCard: {
    borderColor: '#00ff00',
    backgroundColor: '#2d3a2d',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  abilityName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkmark: {
    color: '#00ff00',
    fontSize: 24,
    fontWeight: 'bold',
  },
  abilityDesc: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 10,
  },
  itemDesc: {
    color: '#ccc',
    fontSize: 13,
    marginBottom: 8,
  },
  abilityStats: {
    flexDirection: 'row',
    gap: 15,
  },
  itemStats: {
    flexDirection: 'row',
    gap: 15,
  },
  statText: {
    color: '#aaa',
    fontSize: 12,
  },
  emptyState: {
    backgroundColor: '#2a2a2a',
    padding: 40,
    borderRadius: 15,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
  summary: {
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    padding: 20,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#00ff00',
    marginBottom: 20,
  },
  summaryTitle: {
    color: '#00ff00',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  summaryText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 5,
  },
  confirmButton: {
    backgroundColor: '#00ff00',
    padding: 20,
    margin: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#555',
  },
  confirmButtonText: {
    color: '#1a1a1a',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
