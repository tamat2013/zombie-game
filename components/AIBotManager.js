// components/AIBotManager.js
import { ref, update } from 'firebase/database';
import { database } from '../firebase.config';

export class AIBot {
  constructor(botId, gameId, difficulty = 'medium') {
    this.botId = botId;
    this.gameId = gameId;
    this.difficulty = difficulty;
    this.targetPlayer = null;
    this.lastDecisionTime = Date.now();
    this.decisionInterval = difficulty === 'easy' ? 2000 : difficulty === 'hard' ? 500 : 1000;
  }

  // Calculate distance between two positions
  getDistance(pos1, pos2) {
    return Math.sqrt(
      Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2)
    );
  }

  // Find nearest player
  findNearestPlayer(players, botPosition) {
    let nearest = null;
    let minDistance = Infinity;

    Object.values(players).forEach(player => {
      if (player.id === this.botId || player.role === 'zombie') return;
      
      const distance = this.getDistance(botPosition, player.position);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = player;
      }
    });

    return nearest;
  }

  // Move towards target
  async moveTowardsTarget(botPosition, targetPosition, speed) {
    const dx = targetPosition.x - botPosition.x;
    const dy = targetPosition.y - botPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return;

    const moveX = (dx / distance) * speed * 0.1;
    const moveY = (dy / distance) * speed * 0.1;

    const newX = Math.max(0, Math.min(100, botPosition.x + moveX));
    const newY = Math.max(0, Math.min(100, botPosition.y + moveY));

    await update(ref(database, `games/${this.gameId}/players/${this.botId}/position`), {
      x: newX,
      y: newY
    });
  }

  // Try to bite nearby players
  async tryBite(players, botPosition) {
    const BITE_RANGE = 20;

    for (const player of Object.values(players)) {
      if (player.id === this.botId || player.role === 'zombie') continue;

      const distance = this.getDistance(botPosition, player.position);
      
      if (distance < BITE_RANGE) {
        await update(ref(database, `games/${this.gameId}/players/${player.id}`), {
          isInfected: true,
          infectedTime: Date.now(),
          isAlive: false,
          wasInfected: true
        });

        // Update bot stats
        const currentBites = players[this.botId]?.successfulBites || 0;
        await update(ref(database, `games/${this.gameId}/players/${this.botId}`), {
          successfulBites: currentBites + 1
        });
      }
    }
  }

  // Main AI decision loop
  async makeDecision(gameData) {
    const now = Date.now();
    if (now - this.lastDecisionTime < this.decisionInterval) return;
    
    this.lastDecisionTime = now;

    const bot = gameData.players[this.botId];
    if (!bot || !bot.isAlive || bot.role !== 'zombie') return;

    const players = gameData.players;

    // Find target
    if (!this.targetPlayer || !players[this.targetPlayer.id]) {
      this.targetPlayer = this.findNearestPlayer(players, bot.position);
    }

    if (!this.targetPlayer) return;

    // Check if target is still valid
    if (players[this.targetPlayer.id]?.role === 'zombie') {
      this.targetPlayer = this.findNearestPlayer(players, bot.position);
    }

    // Move towards target
    if (this.targetPlayer) {
      await this.moveTowardsTarget(
        bot.position,
        players[this.targetPlayer.id].position,
        bot.speed
      );

      // Try to bite
      await this.tryBite(players, bot.position);
    }
  }
}

export class AIBotManager {
  constructor(gameId, botCount, difficulty = 'medium') {
    this.gameId = gameId;
    this.bots = [];
    this.running = false;

    // Create bots
    for (let i = 0; i < botCount; i++) {
      const botId = `bot_${Date.now()}_${i}`;
      this.bots.push(new AIBot(botId, gameId, difficulty));
    }
  }

  // Add bots to game
  async addBotsToGame() {
    const updates = {};

    this.bots.forEach(bot => {
      updates[`games/${this.gameId}/players/${bot.botId}`] = {
        id: bot.botId,
        role: 'zombie',
        position: {
          x: Math.random() * 80 + 10,
          y: Math.random() * 80 + 10
        },
        isAlive: true,
        isInfected: false,
        speed: 3,
        isBot: true,
        successfulBites: 0
      };
    });

    await update(ref(database), updates);
  }

  // Start AI loop
  startAI(gameData) {
    this.running = true;
    this.aiLoop(gameData);
  }

  // AI decision loop
  async aiLoop(gameData) {
    if (!this.running) return;

    for (const bot of this.bots) {
      await bot.makeDecision(gameData);
    }

    // Continue loop
    setTimeout(() => this.aiLoop(gameData), 100);
  }

  // Stop AI
  stop() {
    this.running = false;
  }
}
