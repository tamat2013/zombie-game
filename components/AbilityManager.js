// components/AbilityManager.js
import { useState, useEffect } from 'react';
import { ref, onValue, update, off } from 'firebase/database';
import { database, auth } from '../firebase.config';
import { ABILITIES, ITEMS, SPECIAL_SKINS } from '../constants/upgrades';

export const useAbilities = (gameId, myPlayer) => {
  const [userAbilities, setUserAbilities] = useState({});
  const [userItems, setUserItems] = useState({});
  const [userSkinPowers, setUserSkinPowers] = useState({});
  const [userSkin, setUserSkin] = useState('default');
  const [abilityCooldowns, setAbilityCooldowns] = useState({});
  const [abilityUsesLeft, setAbilityUsesLeft] = useState({});

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const userRef = ref(database, `users/${userId}`);
    
    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUserAbilities(data.abilities || {});
        setUserItems(data.items || {});
        setUserSkinPowers(data.skinPowers || {});
        setUserSkin(data.selectedSkin || 'default');
      }
    });

    return () => off(userRef);
  }, []);

  // Check if ability is available
  const canUseAbility = (abilityId) => {
    const ability = ABILITIES[abilityId];
    if (!ability) return false;
    
    // Check if owned
    if (!userAbilities[abilityId] || userAbilities[abilityId] === 0) return false;
    
    // Check role match
    if (ability.role !== myPlayer?.role) return false;
    
    // Check cooldown
    if (abilityCooldowns[abilityId]) return false;
    
    // Check uses per game
    if (ability.usesPerGame) {
      const usesLeft = abilityUsesLeft[abilityId] ?? ability.usesPerGame;
      if (usesLeft <= 0) return false;
    }
    
    return true;
  };

  // Use ability
  const useAbility = async (abilityId) => {
    if (!canUseAbility(abilityId)) return false;

    const ability = ABILITIES[abilityId];
    const level = userAbilities[abilityId];
    
    // Get cooldown reduction from items
    let cooldownReduction = 0;
    if (userItems.rechargeable_battery) {
      cooldownReduction = ITEMS.RECHARGEABLE_BATTERY.cooldownReduction;
    }
    
    const actualCooldown = ability.cooldown * (1 - cooldownReduction);

    // Set cooldown
    setAbilityCooldowns(prev => ({ ...prev, [abilityId]: true }));
    
    setTimeout(() => {
      setAbilityCooldowns(prev => {
        const newCooldowns = { ...prev };
        delete newCooldowns[abilityId];
        return newCooldowns;
      });
    }, actualCooldown * 1000);

    // Decrease uses if limited
    if (ability.usesPerGame) {
      setAbilityUsesLeft(prev => ({
        ...prev,
        [abilityId]: (prev[abilityId] ?? ability.usesPerGame) - 1
      }));
    }

    return true;
  };

  // Check if skin power is available
  const canUseSkinPower = () => {
    const skinData = SPECIAL_SKINS[userSkin];
    if (!skinData || !userSkinPowers[userSkin]) return false;
    
    const powerId = skinData.power.id;
    
    // Check cooldown
    if (abilityCooldowns[powerId]) return false;
    
    // Check uses per game
    if (skinData.power.usesPerGame) {
      const usesLeft = abilityUsesLeft[powerId] ?? skinData.power.usesPerGame;
      if (usesLeft <= 0) return false;
    }
    
    // Check zombie-only powers
    if (skinData.power.zombieOnly && myPlayer?.role !== 'zombie') return false;
    
    return true;
  };

  // Use skin power
  const useSkinPower = async () => {
    if (!canUseSkinPower()) return false;

    const skinData = SPECIAL_SKINS[userSkin];
    const power = skinData.power;
    const powerId = power.id;

    // Set cooldown
    setAbilityCooldowns(prev => ({ ...prev, [powerId]: true }));
    
    if (power.cooldown < 999) {
      setTimeout(() => {
        setAbilityCooldowns(prev => {
          const newCooldowns = { ...prev };
          delete newCooldowns[powerId];
          return newCooldowns;
        });
      }, power.cooldown * 1000);
    }

    // Decrease uses if limited
    if (power.usesPerGame) {
      setAbilityUsesLeft(prev => ({
        ...prev,
        [powerId]: (prev[powerId] ?? power.usesPerGame) - 1
      }));
    }

    return true;
  };

  // Get active items bonuses
  const getItemBonuses = () => {
    const bonuses = {
      speedBonus: 0,
      rangeBonus: 0,
      protection: 0,
      stunResistance: 0,
      detectionReduction: 0,
      viewRangeBonus: 1,
      cooldownReduction: 0
    };

    Object.entries(userItems).forEach(([itemId, owned]) => {
      if (owned) {
        const item = ITEMS[itemId];
        if (item.speedBonus) bonuses.speedBonus += item.speedBonus;
        if (item.rangeBonus) bonuses.rangeBonus += item.rangeBonus;
        if (item.protection) bonuses.protection += item.protection;
        if (item.stunResistance) bonuses.stunResistance += item.stunResistance;
        if (item.detectionReduction) bonuses.detectionReduction += item.detectionReduction;
        if (item.viewRangeBonus) bonuses.viewRangeBonus *= item.viewRangeBonus;
        if (item.cooldownReduction) bonuses.cooldownReduction += item.cooldownReduction;
      }
    });

    return bonuses;
  };

  // Get available abilities for current role
  const getAvailableAbilities = () => {
    if (!myPlayer) return [];
    
    return Object.entries(ABILITIES)
      .filter(([id, ability]) => 
        ability.role === myPlayer.role && 
        userAbilities[id] > 0
      )
      .map(([id, ability]) => ({
        id,
        ...ability,
        level: userAbilities[id],
        onCooldown: !!abilityCooldowns[id],
        usesLeft: abilityUsesLeft[id] ?? ability.usesPerGame
      }));
  };

  return {
    userAbilities,
    userItems,
    userSkinPowers,
    userSkin,
    canUseAbility,
    useAbility,
    canUseSkinPower,
    useSkinPower,
    getItemBonuses,
    getAvailableAbilities,
    abilityCooldowns
  };
};
