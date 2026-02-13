// screens/AdminPowerSuggestionsScreen.js
// This screen is for the game developer to review and approve power suggestions

import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, 
  TextInput, Alert 
} from 'react-native';
import { ref, onValue, update, off } from 'firebase/database';
import { database } from '../firebase.config';

export default function AdminPowerSuggestionsScreen({ navigation }) {
  const [suggestions, setSuggestions] = useState([]);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all

  useEffect(() => {
    const suggestionsRef = ref(database, 'powerSuggestions');
    
    const unsubscribe = onValue(suggestionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const suggestionsArray = Object.entries(data).map(([id, suggestion]) => ({
          id,
          ...suggestion
        }));
        
        // Sort by date (newest first)
        suggestionsArray.sort((a, b) => b.createdAt - a.createdAt);
        
        setSuggestions(suggestionsArray);
      }
    });

    return () => off(suggestionsRef);
  }, []);

  const handleApprove = async (suggestionId, suggestion) => {
    Alert.prompt(
      'אשר כוח',
      'הזן מחיר למטבעות (200-5000):',
      [
        {
          text: 'ביטול',
          style: 'cancel'
        },
        {
          text: 'אשר',
          onPress: async (price) => {
            const priceNum = parseInt(price);
            if (isNaN(priceNum) || priceNum < 200 || priceNum > 5000) {
              Alert.alert('שגיאה', 'מחיר לא תקין');
              return;
            }

            try {
              // Update suggestion status
              await update(ref(database, `powerSuggestions/${suggestionId}`), {
                status: 'approved',
                approvedPrice: priceNum,
                approvedAt: Date.now()
              });

              // Add power to user's custom skins
              await update(ref(database, `users/${suggestion.userId}/customSkins/${suggestionId}`), {
                name: suggestion.skinName,
                emoji: suggestion.emoji,
                color: suggestion.color,
                powerDescription: suggestion.powerDescription,
                price: priceNum,
                createdAt: Date.now(),
                approved: true
              });

              // Notify user (you can implement push notifications here)
              Alert.alert('הצלחה', 'הכוח אושר והתווסף למשתמש!');
            } catch (error) {
              Alert.alert('שגיאה', 'לא הצלחנו לאשר את הכוח');
            }
          }
        }
      ],
      'plain-text',
      '1000'
    );
  };

  const handleReject = async (suggestionId) => {
    Alert.alert(
      'דחה כוח',
      'האם אתה בטוח שאתה רוצה לדחות את ההצעה?',
      [
        {
          text: 'ביטול',
          style: 'cancel'
        },
        {
          text: 'דחה',
          style: 'destructive',
          onPress: async () => {
            try {
              await update(ref(database, `powerSuggestions/${suggestionId}`), {
                status: 'rejected',
                rejectedAt: Date.now()
              });
              Alert.alert('הצלחה', 'ההצעה נדחתה');
            } catch (error) {
              Alert.alert('שגיאה', 'לא הצלחנו לדחות את ההצעה');
            }
          }
        }
      ]
    );
  };

  const filteredSuggestions = suggestions.filter(s => 
    filter === 'all' ? true : s.status === filter
  );

  const renderSuggestion = (suggestion) => {
    const statusColors = {
      pending: '#ffaa00',
      approved: '#00ff00',
      rejected: '#ff0000'
    };

    const statusText = {
      pending: 'ממתין',
      approved: 'אושר',
      rejected: 'נדחה'
    };

    return (
      <View key={suggestion.id} style={styles.suggestionCard}>
        <View style={styles.suggestionHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[suggestion.status] }]}>
            <Text style={styles.statusText}>{statusText[suggestion.status]}</Text>
          </View>
          <Text style={styles.dateText}>
            {new Date(suggestion.createdAt).toLocaleDateString('he-IL')}
          </Text>
        </View>

        <View style={styles.skinPreview}>
          <View style={[styles.skinIcon, { backgroundColor: suggestion.color }]}>
            <Text style={styles.skinEmoji}>{suggestion.emoji}</Text>
          </View>
          <View style={styles.skinInfo}>
            <Text style={styles.skinName}>{suggestion.skinName}</Text>
            <Text style={styles.userName}>👤 {suggestion.username}</Text>
          </View>
        </View>

        <View style={styles.powerBox}>
          <Text style={styles.powerLabel}>הכוח המוצע:</Text>
          <Text style={styles.powerText}>{suggestion.powerDescription}</Text>
        </View>

        {suggestion.status === 'pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.approveButton}
              onPress={() => handleApprove(suggestion.id, suggestion)}
            >
              <Text style={styles.buttonText}>✓ אשר</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => handleReject(suggestion.id)}
            >
              <Text style={styles.buttonText}>✗ דחה</Text>
            </TouchableOpacity>
          </View>
        )}

        {suggestion.status === 'approved' && (
          <View style={styles.approvedInfo}>
            <Text style={styles.approvedText}>
              💰 מחיר שנקבע: {suggestion.approvedPrice} מטבעות
            </Text>
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
        <Text style={styles.title}>הצעות כוחות</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'pending' && styles.filterTabActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>
            ממתין ({suggestions.filter(s => s.status === 'pending').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'approved' && styles.filterTabActive]}
          onPress={() => setFilter('approved')}
        >
          <Text style={[styles.filterText, filter === 'approved' && styles.filterTextActive]}>
            אושר ({suggestions.filter(s => s.status === 'approved').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'rejected' && styles.filterTabActive]}
          onPress={() => setFilter('rejected')}
        >
          <Text style={[styles.filterText, filter === 'rejected' && styles.filterTextActive]}>
            נדחה ({suggestions.filter(s => s.status === 'rejected').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            הכל ({suggestions.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {filteredSuggestions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>אין הצעות להצגה</Text>
          </View>
        ) : (
          filteredSuggestions.map(renderSuggestion)
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
  placeholder: {
    width: 60,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    padding: 10,
  },
  filterTab: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  filterTabActive: {
    backgroundColor: '#00ff00',
  },
  filterText: {
    color: '#888',
    fontSize: 14,
    fontWeight: 'bold',
  },
  filterTextActive: {
    color: '#1a1a1a',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  suggestionCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#3a3a3a',
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusBadge: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    color: '#1a1a1a',
    fontWeight: 'bold',
    fontSize: 12,
  },
  dateText: {
    color: '#888',
    fontSize: 12,
  },
  skinPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  skinIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  skinEmoji: {
    fontSize: 36,
  },
  skinInfo: {
    flex: 1,
  },
  skinName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userName: {
    color: '#aaa',
    fontSize: 14,
  },
  powerBox: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  powerLabel: {
    color: '#00ff00',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  powerText: {
    color: 'white',
    fontSize: 16,
    lineHeight: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#00ff00',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#ff0000',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  approvedInfo: {
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#00ff00',
  },
  approvedText: {
    color: '#00ff00',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 18,
  },
});
