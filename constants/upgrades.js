// constants/upgrades.js

// יכולות (Abilities) - דברים אקטיביים
export const ABILITIES = {
  // יכולות זומבי
  ZOMBIE_SPRINT: {
    id: 'zombie_sprint',
    name: 'ספרינט זומבי',
    description: 'התפרצות מהירות ל-3 שניות',
    role: 'zombie',
    cooldown: 30,
    duration: 3,
    speedBoost: 2,
    prices: [300, 1000, 2500],
    levels: 3
  },
  FEAR_SCREAM: {
    id: 'fear_scream',
    name: 'זעקת אימה',
    description: 'משתק שחקנים במרחק קרוב ל-2 שניות',
    role: 'zombie',
    cooldown: 45,
    duration: 2,
    range: 15,
    prices: [400, 1200, 3000],
    levels: 3
  },
  ZOMBIE_LEAP: {
    id: 'zombie_leap',
    name: 'קפיצת זומבי',
    description: 'קפיצה קדימה למרחק בינוני',
    role: 'zombie',
    cooldown: 20,
    distance: 10,
    prices: [350, 1100, 2800],
    levels: 3
  },
  SHARP_CLAWS: {
    id: 'sharp_claws',
    name: 'טפרים חדים',
    description: 'טווח נשיכה כפול למשך 5 שניות',
    role: 'zombie',
    cooldown: 40,
    duration: 5,
    rangeMultiplier: 2,
    prices: [450, 1300, 3200],
    levels: 3
  },
  BLOOD_SCENT: {
    id: 'blood_scent',
    name: 'ריח דם',
    description: 'רואה שחקנים נגועים במפה למשך 5 שניות',
    role: 'zombie',
    cooldown: 35,
    duration: 5,
    prices: [500, 1500, 3500],
    levels: 3
  },

  // יכולות רופא
  INSTANT_HEAL: {
    id: 'instant_heal',
    name: 'ריפוי מהיר',
    description: 'ריפוי מיידי ללא צורך להמתין',
    role: 'doctor',
    cooldown: 60,
    prices: [400, 1200, 3000],
    levels: 3
  },
  VACCINE_SHOT: {
    id: 'vaccine_shot',
    name: 'זריקת חיסון',
    description: 'זריקה למרחוק שנותנת חיסון לשחקן',
    role: 'doctor',
    cooldown: 50,
    range: 25,
    prices: [500, 1500, 3500],
    levels: 3
  },
  HEALING_AURA: {
    id: 'healing_aura',
    name: 'אאורה מרפאת',
    description: 'כל מי שקרוב מתרפא לאט (5 שניות)',
    role: 'doctor',
    cooldown: 45,
    duration: 5,
    range: 15,
    prices: [450, 1300, 3200],
    levels: 3
  },
  REVIVE: {
    id: 'revive',
    name: 'החייאה',
    description: 'החיה זומבי חזרה לשורד (פעם אחת במשחק)',
    role: 'doctor',
    cooldown: 999,
    usesPerGame: 1,
    prices: [600, 1800, 4000],
    levels: 3
  },
  MEDICAL_STAMINA: {
    id: 'medical_stamina',
    name: 'סטמינה רפואית',
    description: 'ריפוי מהיר של עצמך אם נדבקת',
    role: 'doctor',
    cooldown: 90,
    prices: [550, 1600, 3800],
    levels: 3
  },

  // יכולות שורד
  SURVIVOR_DASH: {
    id: 'survivor_dash',
    name: 'התחמקות/דאש',
    description: 'התחמקות מהירה לכיוון (5 מטרים)',
    role: 'survivor',
    cooldown: 15,
    distance: 5,
    prices: [300, 1000, 2500],
    levels: 3
  },
  CAMOUFLAGE: {
    id: 'camouflage',
    name: 'הסוואה',
    description: 'הופך שקוף למשך 5 שניות',
    role: 'survivor',
    cooldown: 40,
    duration: 5,
    prices: [450, 1300, 3200],
    levels: 3
  },
  SMOKE_BOMB: {
    id: 'smoke_bomb',
    name: 'פצצת עשן',
    description: 'יוצר ענן עשן שמסתיר אותך',
    role: 'survivor',
    cooldown: 35,
    duration: 4,
    range: 10,
    prices: [400, 1200, 3000],
    levels: 3
  },
  PUSH_KICK: {
    id: 'push_kick',
    name: 'בעיטת דחיפה',
    description: 'דוחף זומבי לאחור 3 מטרים',
    role: 'survivor',
    cooldown: 25,
    pushDistance: 3,
    prices: [350, 1100, 2800],
    levels: 3
  },
  HELP_CALL: {
    id: 'help_call',
    name: 'קריאה לעזרה',
    description: 'מסמן את המיקום שלך לכל הרופאים',
    role: 'survivor',
    cooldown: 30,
    duration: 10,
    prices: [300, 1000, 2500],
    levels: 3
  }
};

// חפצים (Items) - דברים פסיביים
export const ITEMS = {
  // חפצי מידע
  INFECTED_RADAR: {
    id: 'infected_radar',
    name: 'מכ"ם לחולים',
    description: 'מראה חץ לנגוע הקרוב ביותר',
    role: 'doctor',
    type: 'info',
    price: 800
  },
  ZOMBIE_DETECTOR: {
    id: 'zombie_detector',
    name: 'גלאי זומבים',
    description: 'מזהיר כשזומבי קרוב (רטט)',
    role: 'survivor',
    type: 'info',
    price: 700
  },
  MINI_MAP: {
    id: 'mini_map',
    name: 'מפת מיני',
    description: 'מראה מפה קטנה עם מיקומי שחקנים',
    role: 'all',
    type: 'info',
    price: 1200
  },
  TEAM_COMPASS: {
    id: 'team_compass',
    name: 'מצפן קבוצתי',
    description: 'מראה איפה חברי הקבוצה שלך',
    role: 'all',
    type: 'info',
    price: 900
  },
  BINOCULARS: {
    id: 'binoculars',
    name: 'משקפת',
    description: 'רואה שחקנים ממרחק יותר גדול',
    role: 'all',
    type: 'info',
    viewRangeBonus: 1.5,
    price: 1000
  },

  // חפצי הגנה
  VEST: {
    id: 'vest',
    name: 'אפוד מגן',
    description: 'הגנה 30% מנשיכה ראשונה',
    role: 'all',
    type: 'defense',
    protection: 0.3,
    price: 1500
  },
  HELMET: {
    id: 'helmet',
    name: 'קסדה',
    description: 'הגנה 50% מיכולות שמשתקות',
    role: 'all',
    type: 'defense',
    stunResistance: 0.5,
    price: 1800
  },
  SPEED_SHOES: {
    id: 'speed_shoes',
    name: 'נעליים מהירות',
    description: 'מהירות בסיס +10%',
    role: 'all',
    type: 'defense',
    speedBonus: 0.1,
    price: 1200
  },
  GLOVES: {
    id: 'gloves',
    name: 'כפפות',
    description: 'טווח פעולה (ריפוי/נשיכה) +20%',
    role: 'all',
    type: 'defense',
    rangeBonus: 0.2,
    price: 1400
  },
  STEALTH_COAT: {
    id: 'stealth_coat',
    name: 'מעיל סטלת\'',
    description: 'זומבים רואים אותך ממרחק -30%',
    role: 'survivor',
    type: 'defense',
    detectionReduction: 0.3,
    price: 2000
  },

  // חפצי תועלת
  RECHARGEABLE_BATTERY: {
    id: 'rechargeable_battery',
    name: 'סוללה נטענת',
    description: 'מקטין קולדאון של יכולות ב-20%',
    role: 'all',
    type: 'utility',
    cooldownReduction: 0.2,
    price: 1800
  },
  ENERGY_DRINK: {
    id: 'energy_drink',
    name: 'שיקוי אנרגיה',
    description: 'סטמינה אינסופית למשך 10 שניות (פעם אחת)',
    role: 'all',
    type: 'utility',
    duration: 10,
    usesPerGame: 1,
    price: 1500
  },
  FIRST_AID_KIT: {
    id: 'first_aid_kit',
    name: 'ערכת עזרה ראשונה',
    description: 'אוטו-ריפוי אם נדבקת (פעם אחת)',
    role: 'all',
    type: 'utility',
    usesPerGame: 1,
    price: 2000
  },
  BEGINNERS_LUCK: {
    id: 'beginners_luck',
    name: 'מזל של מתחילים',
    description: 'סיכוי 10% להתחיל עם חפץ אקראי',
    role: 'all',
    type: 'utility',
    luckyChance: 0.1,
    price: 1000
  },
  TIME_WATCH: {
    id: 'time_watch',
    name: 'שעון זמן',
    description: 'רואה כמה זמן נשאר למשחק בדיוק',
    role: 'all',
    type: 'utility',
    price: 500
  },
  XRAY_GOGGLES: {
    id: 'xray_goggles',
    name: 'משקפי רנטגן',
    description: 'רואה שחקנים דרך קירות ומכשולים!',
    role: 'zombie',
    type: 'info',
    wallVision: true,
    viewRange: 1.8,
    price: 2200
  },
  
  // חפץ נדיר
  TRAP: {
    id: 'trap',
    name: 'מלכודת',
    description: 'שם מלכודת שמאטה כל שחקן שדורך עליה ל-3 שניות',
    role: 'all',
    type: 'rare',
    duration: 3,
    slowAmount: 0.5,
    usesPerGame: 1,
    price: 2500
  }
};

// סקינים מיוחדים עם כוחות
export const SPECIAL_SKINS = {
  ninja: {
    id: 'ninja',
    name: '🥷 נינג\'ה',
    color: '#2c3e50',
    power: {
      id: 'ninja_stealth',
      name: 'הסתננות נינג\'ה',
      description: 'הסוואה למשך 3 שניות',
      cooldown: 60,
      duration: 3
    },
    unlockPrice: 800,
    requiredWins: 0
  },
  robot: {
    id: 'robot',
    name: '🤖 רובוט',
    color: '#95a5a6',
    power: {
      id: 'robot_sensor',
      name: 'חיישן רובוטי',
      description: 'חיווי חזותי כשמישהו קרוב (3 מטרים)',
      range: 3,
      passive: true
    },
    unlockPrice: 900,
    requiredWins: 0
  },
  alien: {
    id: 'alien',
    name: '👽 חייזר',
    color: '#9b59b6',
    power: {
      id: 'alien_teleport',
      name: 'טלפורט זעיר',
      description: 'טלפורט קטן (2 מטרים)',
      cooldown: 45,
      distance: 2
    },
    unlockPrice: 1000,
    requiredWins: 0
  },
  cowboy: {
    id: 'cowboy',
    name: '🤠 קאובוי',
    color: '#e67e22',
    power: {
      id: 'cowboy_rush',
      name: 'דהירת קאובוי',
      description: 'מהירות +15% למשך 4 שניות',
      cooldown: 40,
      duration: 4,
      speedBoost: 0.15
    },
    unlockPrice: 1200,
    requiredWins: 0
  },
  pirate: {
    id: 'pirate',
    name: '🏴‍☠️ פיראט',
    color: '#34495e',
    power: {
      id: 'pirate_treasure',
      name: 'אוצר פיראטים',
      description: 'רואה פאוור-אפ אקראי במפה (פעם במשחק)',
      cooldown: 999,
      usesPerGame: 1
    },
    unlockPrice: 1500,
    requiredWins: 0
  },
  wizard: {
    id: 'wizard',
    name: '🧙 קוסם',
    color: '#8e44ad',
    power: {
      id: 'wizard_swap',
      name: 'החלפת מיקומים',
      description: 'החלף מיקום עם שחקן אקראי (פעם במשחק)',
      cooldown: 999,
      usesPerGame: 1
    },
    unlockPrice: 1800,
    requiredWins: 10
  },
  knight: {
    id: 'knight',
    name: '🛡️ אביר',
    color: '#c0392b',
    power: {
      id: 'knight_armor',
      name: 'שריון אביר',
      description: 'נשיכה ראשונה לא מדבקת (פעם במשחק)',
      cooldown: 999,
      usesPerGame: 1
    },
    unlockPrice: 2200,
    requiredWins: 15
  },
  vampire: {
    id: 'vampire',
    name: '🧛 ערפד',
    color: '#8b0000',
    power: {
      id: 'vampire_curse',
      name: 'קללת הערפד',
      description: 'כזומבי: נשיכה מוצלחת = חוזר להיות שורד! (פעם במשחק)',
      cooldown: 999,
      usesPerGame: 1,
      zombieOnly: true
    },
    unlockPrice: 4500,
    requiredWins: 25
  },
  ghost: {
    id: 'ghost',
    name: '👻 רוח רפאים',
    color: '#e8e8e8',
    power: {
      id: 'ghost_phase',
      name: 'מעבר רוחני',
      description: 'עובר דרך שחקן אחד (לא להידבק) פעם במשחק',
      cooldown: 999,
      usesPerGame: 1
    },
    unlockPrice: 2800,
    requiredWins: 20
  },
  superhero: {
    id: 'superhero',
    name: '🦸 גיבור על',
    color: '#0066cc',
    power: {
      id: 'hero_rescue',
      name: 'הצלה גיבורית',
      description: 'אם שחקן נדבק במרחק 5 מטרים, תקבל באפ מהירות x2',
      range: 5,
      speedBoost: 2,
      duration: 5,
      passive: true
    },
    unlockPrice: 3200,
    requiredWins: 30
  }
};

// מערכת תגמולים
export const REWARDS = {
  ZOMBIE_WIN: 150,
  SURVIVOR_WIN: 120,
  SUCCESSFUL_HEAL: 15,
  SUCCESSFUL_BITE: 8,
  NEVER_INFECTED: 50,
  DAILY_FIRST_GAME: 30,
  PARTICIPATION: 20,
  WIN_STREAK_MULTIPLIER: 1.5, // אחרי 3 ניצחונות ברצף
  WIN_STREAK_THRESHOLD: 3
};
