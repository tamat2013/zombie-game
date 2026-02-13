// constants/missions.js

export const MISSIONS = {
  WIRE_CONNECT: {
    id: 'wire_connect',
    name: 'חיבור חוטים',
    icon: '🔌',
    xp: 200,
    type: 'wires'
  },
  FIX_MACHINE: {
    id: 'fix_machine',
    name: 'תיקון מכונה',
    icon: '🔧',
    xp: 250,
    type: 'machine'
  },
  DOWNLOAD_DATA: {
    id: 'download_data',
    name: 'הורדת נתונים',
    icon: '📥',
    xp: 150,
    type: 'download'
  },
  EMPTY_TRASH: {
    id: 'empty_trash',
    name: 'זריקת אשפה',
    icon: '🗑️',
    xp: 180,
    type: 'trash'
  },
  CHECK_TEMPERATURE: {
    id: 'check_temperature',
    name: 'בדיקת טמפרטורה',
    icon: '🌡️',
    xp: 220,
    type: 'temperature'
  }
};

// Daily missions
export const DAILY_MISSIONS = [
  { id: 'play_3_games', desc: 'שחק 3 משחקים', xp: 100, target: 3 },
  { id: 'heal_5_players', desc: 'רפא 5 שחקנים', xp: 150, target: 5, role: 'doctor' },
  { id: 'win_as_zombie', desc: 'נצח כזומבי', xp: 200, target: 1, role: 'zombie' },
  { id: 'survive_without_infection', desc: 'שרוד ללא הדבקה', xp: 180, target: 1 },
  { id: 'complete_5_missions', desc: 'השלם 5 משימות', xp: 150, target: 5 }
];

// Weekly missions
export const WEEKLY_MISSIONS = [
  { id: 'win_10_games', desc: 'זכה ב-10 משחקים', xp: 500, target: 10 },
  { id: 'bite_20_players', desc: 'נשוך 20 שחקנים', xp: 400, target: 20, role: 'zombie' },
  { id: 'heal_30_players', desc: 'רפא 30 שחקנים', xp: 600, target: 30, role: 'doctor' },
  { id: 'use_abilities_50_times', desc: 'השתמש ביכולות 50 פעמים', xp: 450, target: 50 }
];
