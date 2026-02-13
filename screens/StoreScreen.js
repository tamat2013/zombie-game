// screens/StoreScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, 
  Alert, Modal 
} from 'react-native';
import { ref, onValue, update, off } from 'firebase/database';
import { database, auth } from '../firebase.config';
import { ABILITIES, ITEMS, SPECIAL_SKINS, REWARDS } from '../constants/upgrades';

export default function StoreScreen({ navigation }) {
  const [userCoins, setUserCoins] = useState(0);
  const [userWins, setUserWins] = useState(0);
  const [ownedAbilities, setOwnedAbilities] = useState({});
  const [ownedItems, setOwnedItems] = useState({});
  const [unlockedSkinPowers, setUnlockedSkinPowers] = useState({});
  const [selectedTab, setSelectedTab] = useState('abilities'); // abilities, items, skins
  const [selectedRole, setSelectedRole] = useState('all'); // zombie, doctor, survivor, all

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const userRef = ref(database, `users/${userId}`);
    
    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUserCoins(data.coins || 0);
        setUserWins(data.wins || 0);
        setOwnedAbilities(data.abilities || {});
        setOwnedItems(data.items || {});
        setUnlockedSkinPowers(data.skinPowers || {});
      }
    });

    return () => off(userRef);
  }, []);

  const purchaseAbility = async (abilityId, level) => {
    const ability = ABILITIES[abilityId];
    const price = ability.prices[level - 1];

    if (userCoins < price) {
      Alert.alert('אין מספיק מטבעות', `דרושים ${price} מטבעות`);
      return;
    }

    const userId = auth.currentUser?.uid;
    const updates = {};
    updates[`users/${userId}/coins`] = userCoins - price;
    updates[`users/${userId}/abilities/${abilityId}`] = level;

    await update(ref(database), updates);
    Alert.alert('רכישה מוצלחת!', `רכשת ${ability.name} רמה ${level}`);
  };

  const purchaseItem = async (itemId) => {
    const item = ITEMS[itemId];
    const price = item.price;

    if (userCoins < price) {
      Alert.alert('אין מספיק מטבעות', `דרושים ${price} מטבעות`);
      return;
    }

    const userId = auth.currentUser?.uid;
    const updates = {};
    updates[`users/${userId}/coins`] = userCoins - price;
    updates[`users/${userId}/items/${itemId}`] = true;

    await update(ref(database), updates);
    Alert.alert('רכישה מוצלחת!', `רכשת ${item.name}`);
  };

  const unlockSkinPower = async (skinId) => {
    const skin = SPECIAL_SKINS[skinId];
    const price = skin.unlockPrice;

    if (userWins < skin.requiredWins) {
      Alert.alert(
        'לא מספיק ניצחונות',
        `דרושים ${skin.requiredWins} ניצחונות. יש לך ${userWins}`
      );
      return;
    }

    if (userCoins < price) {
      Alert.alert('אין מספיק מטבעות', `דרושים ${price} מטבעות`);
      return;
    }

    const userId = auth.currentUser?.uid;
    const updates = {};
    updates[`users/${userId}/coins`] = userCoins - price;
    updates[`users/${userId}/skinPowers/${skinId}`] = true;

    await update(ref(database), updates);
    Alert.alert('פתיחה מוצלחת!', `פתחת את כוח ${skin.name}`);
  };

  const filterByRole = (items, role) => {
    if (role === 'all') return items;
    return Object.entries(items).filter(([key, item]) => 
      item.role === role || item.role === 'all'
    );
  };

  const renderAbilities = () => {
    const filteredAbilities = filterByRole(ABILITIES, selectedRole);

    return filteredAbilities.map(([key, ability]) => {
      const currentLevel = ownedAbilities[key] || 0;
      const nextLevel = currentLevel + 1;
      const canUpgrade = nextLevel <= ability.levels;
      const price = canUpgrade ? ability.prices[nextLevel - 1] : 0;

      return (
        <View key={key} style={styles.itemCard}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemName}>{ability.name}</Text>
            <Text style={styles.itemLevel}>רמה {currentLevel}/{ability.levels}</Text>
          </View>
          <Text style={styles.itemDescription}>{ability.description}</Text>
          <View style={styles.itemFooter}>
            <Text style={styles.itemRole}>
              {ability.role === 'zombie' ? '🧟 זומבי' : 
               ability.role === 'doctor' ? '⚕️ רופא' : '👤 שורד'}
            </Text>
            {canUpgrade ? (
              <TouchableOpacity 
                style={[styles.buyButton, userCoins < price && styles.buyButtonDisabled]}
                onPress={() => purchaseAbility(key, nextLevel)}
                disabled={userCoins < price}
              >
                <Text style={styles.buyButtonText}>💰 {price}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.maxLevelText}>מקסימום!</Text>
            )}
          </View>
        </View>
      );
    });
  };

  const renderItems = () => {
    const filteredItems = filterByRole(ITEMS, selectedRole);

    return filteredItems.map(([key, item]) => {
      const owned = ownedItems[key];

      return (
        <View key={key} style={styles.itemCard}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemName}>{item.name}</Text>
            {owned && <Text style={styles.ownedBadge}>✓ ברשותך</Text>}
          </View>
          <Text style={styles.itemDescription}>{item.description}</Text>
          <View style={styles.itemFooter}>
            <Text style={styles.itemType}>
              {item.type === 'info' ? '📡 מידע' :
               item.type === 'defense' ? '🛡️ הגנה' :
               item.type === 'utility' ? '⚡ תועלת' : '⭐ נדיר'}
            </Text>
            {!owned ? (
              <TouchableOpacity 
                style={[styles.buyButton, userCoins < item.price && styles.buyButtonDisabled]}
                onPress={() => purchaseItem(key)}
                disabled={userCoins < item.price}
              >
                <Text style={styles.buyButtonText}>💰 {item.price}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.ownedText}>ברשותך</Text>
            )}
          </View>
        </View>
      );
    });
  };

  const renderSkins = () => {
    return Object.entries(SPECIAL_SKINS).map(([key, skin]) => {
      const powerUnlocked = unlockedSkinPowers[key];
      const canUnlock = userWins >= skin.requiredWins;

      return (
        <View key={key} style={styles.itemCard}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemName}>{skin.name}</Text>
            {powerUnlocked && <Text style={styles.ownedBadge}>✓ כוח פתוח</Text>}
          </View>
          <View style={styles.skinPowerBox}>
            <Text style={styles.powerName}>{skin.power.name}</Text>
            <Text style={styles.itemDescription}>{skin.power.description}</Text>
          </View>
          <View style={styles.itemFooter}>
            <Text style={styles.winsRequired}>
              🏆 {skin.requiredWins} ניצחונות
            </Text>
            {!powerUnlocked ? (
              <TouchableOpacity 
                style={[
                  styles.buyButton, 
                  (!canUnlock || userCoins < skin.unlockPrice) && styles.buyButtonDisabled
                ]}
                onPress={() => unlockSkinPower(key)}
                disabled={!canUnlock || userCoins < skin.unlockPrice}
              >
                <Text style={styles.buyButtonText}>💰 {skin.unlockPrice}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.ownedText}>כוח פתוח!</Text>
            )}
          </View>
        </View>
      );
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← חזור</Text>
        </TouchableOpacity>
        <View style={styles.coinsDisplay}>
          <Text style={styles.coinsText}>💰 {userCoins}</Text>
          <Text style={styles.winsText}>🏆 {userWins}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'abilities' && styles.tabActive]}
          onPress={() => setSelectedTab('abilities')}
        >
          <Text style={[styles.tabText, selectedTab === 'abilities' && styles.tabTextActive]}>
            יכולות
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'items' && styles.tabActive]}
          onPress={() => setSelectedTab('items')}
        >
          <Text style={[styles.tabText, selectedTab === 'items' && styles.tabTextActive]}>
            חפצים
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'skins' && styles.tabActive]}
          onPress={() => setSelectedTab('skins')}
        >
          <Text style={[styles.tabText, selectedTab === 'skins' && styles.tabTextActive]}>
            כוחות סקין
          </Text>
        </TouchableOpacity>
      </View>

      {/* Role Filter (for abilities and items) */}
      {selectedTab !== 'skins' && (
        <View style={styles.roleFilter}>
          <TouchableOpacity 
            style={[styles.roleButton, selectedRole === 'all' && styles.roleButtonActive]}
            onPress={() => setSelectedRole('all')}
          >
            <Text style={styles.roleButtonText}>הכל</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.roleButton, selectedRole === 'zombie' && styles.roleButtonActive]}
            onPress={() => setSelectedRole('zombie')}
          >
            <Text style={styles.roleButtonText}>🧟</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.roleButton, selectedRole === 'doctor' && styles.roleButtonActive]}
            onPress={() => setSelectedRole('doctor')}
          >
            <Text style={styles.roleButtonText}>⚕️</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.roleButton, selectedRole === 'survivor' && styles.roleButtonActive]}
            onPress={() => setSelectedRole('survivor')}
          >
            <Text style={styles.roleButtonText}>👤</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      <ScrollView style={styles.content}>
        {selectedTab === 'abilities' && renderAbilities()}
        {selectedTab === 'items' && renderItems()}
        {selectedTab === 'skins' && renderSkins()}
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
    padding: 10,
  },
  backButtonText: {
    color: '#00ff00',
    fontSize: 18,
  },
  coinsDisplay: {
    flexDirection: 'row',
    gap: 15,
  },
  coinsText: {
    color: '#ffd700',
    fontSize: 20,
    fontWeight: 'bold',
  },
  winsText: {
    color: '#00ff00',
    fontSize: 20,
    fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 10,
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#00ff00',
  },
  tabText: {
    color: '#888',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: '#00ff00',
  },
  roleFilter: {
    flexDirection: 'row',
    padding: 10,
    gap: 10,
    backgroundColor: '#1a1a1a',
  },
  roleButton: {
    flex: 1,
    padding: 10,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#00ff00',
  },
  roleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 10,
  },
  itemCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemLevel: {
    color: '#00ff00',
    fontSize: 14,
  },
  ownedBadge: {
    color: '#00ff00',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemDescription: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 10,
  },
  skinPowerBox: {
    backgroundColor: '#1a1a1a',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  powerName: {
    color: '#ffd700',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemRole: {
    color: '#888',
    fontSize: 14,
  },
  itemType: {
    color: '#888',
    fontSize: 14,
  },
  winsRequired: {
    color: '#ffd700',
    fontSize: 14,
  },
  buyButton: {
    backgroundColor: '#00ff00',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  buyButtonDisabled: {
    backgroundColor: '#555',
  },
  buyButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  maxLevelText: {
    color: '#ffd700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  ownedText: {
    color: '#00ff00',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
