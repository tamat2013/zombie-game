// utils/rewardManager.js
import { ref, get, update } from 'firebase/database';
import { database } from '../firebase.config';
import { REWARDS } from '../constants/upgrades';

export const calculateRewards = async (gameId, userId) => {
  const gameRef = ref(database, `games/${gameId}`);
  const userRef = ref(database, `users/${userId}`);
  
  const [gameSnap, userSnap] = await Promise.all([
    get(gameRef),
    get(userRef)
  ]);
  
  const game = gameSnap.val();
  const user = userSnap.val();
  
  if (!game || !user) return;
  
  const player = game.players[userId];
  if (!player) return;
  
  let coinsEarned = REWARDS.PARTICIPATION;
  let stats = user.stats || {};
  
  // Win rewards
  if (game.winner) {
    if (game.winner === 'zombies' && player.role === 'zombie') {
      coinsEarned += REWARDS.ZOMBIE_WIN;
      
      // Update wins
      const newWins = (user.wins || 0) + 1;
      const newWinStreak = (stats.winStreak || 0) + 1;
      
      // Win streak bonus
      if (newWinStreak >= REWARDS.WIN_STREAK_THRESHOLD) {
        coinsEarned = Math.floor(coinsEarned * REWARDS.WIN_STREAK_MULTIPLIER);
      }
      
      await update(userRef, {
        wins: newWins,
        'stats/winStreak': newWinStreak
      });
    } else if (game.winner === 'survivors' && player.role !== 'zombie') {
      coinsEarned += REWARDS.SURVIVOR_WIN;
      
      // Update wins
      const newWins = (user.wins || 0) + 1;
      const newWinStreak = (stats.winStreak || 0) + 1;
      
      // Win streak bonus
      if (newWinStreak >= REWARDS.WIN_STREAK_THRESHOLD) {
        coinsEarned = Math.floor(coinsEarned * REWARDS.WIN_STREAK_MULTIPLIER);
      }
      
      await update(userRef, {
        wins: newWins,
        'stats/winStreak': newWinStreak
      });
    } else {
      // Lost - reset win streak
      await update(userRef, {
        'stats/winStreak': 0
      });
    }
  }
  
  // Performance bonuses
  if (player.successfulHeals) {
    coinsEarned += player.successfulHeals * REWARDS.SUCCESSFUL_HEAL;
    stats.totalHeals = (stats.totalHeals || 0) + player.successfulHeals;
  }
  
  if (player.successfulBites) {
    coinsEarned += player.successfulBites * REWARDS.SUCCESSFUL_BITE;
    stats.totalBites = (stats.totalBites || 0) + player.successfulBites;
  }
  
  // Never infected bonus
  if (!player.wasInfected && player.role !== 'zombie') {
    coinsEarned += REWARDS.NEVER_INFECTED;
  }
  
  // Daily first game bonus
  const today = new Date().toDateString();
  if (stats.lastPlayDate !== today) {
    coinsEarned += REWARDS.DAILY_FIRST_GAME;
    stats.lastPlayDate = today;
  }
  
  // Update user coins and stats
  const newCoins = (user.coins || 0) + coinsEarned;
  const newGamesPlayed = (user.gamesPlayed || 0) + 1;
  
  await update(userRef, {
    coins: newCoins,
    gamesPlayed: newGamesPlayed,
    stats: stats
  });
  
  return {
    coinsEarned,
    totalCoins: newCoins,
    breakdown: {
      base: REWARDS.PARTICIPATION,
      win: game.winner ? (game.winner === 'zombies' && player.role === 'zombie' ? REWARDS.ZOMBIE_WIN : game.winner === 'survivors' && player.role !== 'zombie' ? REWARDS.SURVIVOR_WIN : 0) : 0,
      heals: (player.successfulHeals || 0) * REWARDS.SUCCESSFUL_HEAL,
      bites: (player.successfulBites || 0) * REWARDS.SUCCESSFUL_BITE,
      neverInfected: (!player.wasInfected && player.role !== 'zombie') ? REWARDS.NEVER_INFECTED : 0,
      dailyBonus: stats.lastPlayDate !== today ? REWARDS.DAILY_FIRST_GAME : 0
    }
  };
};
