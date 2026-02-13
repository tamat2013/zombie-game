// screens/SkinDesignerScreen.js
import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ScrollView, Alert 
} from 'react-native';
import { saveCustomSkin } from '../utils/skinAI';
import { auth, database } from '../firebase.config';
import { ref, get, update, push } from 'firebase/database';

const EMOJIS = ['😀', '😎', '🤖', '👽', '🦄', '🐉', '⚡', '🔥', '💎', '🌟', '👾', '🎃', '🦇', '🧙', '👹', '🤡'];
const COLORS = [
  '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
  '#ff8800', '#8800ff', '#00ff88', '#ff0088', '#88ff00', '#0088ff'
];

export default function SkinDesignerScreen({ navigation }) {
  const [skinName, setSkinName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('😀');
  const [selectedColor, setSelectedColor] = useState('#ff0000');
  const [powerSuggestion, setPowerSuggestion] = useState('');
  const [userCoins, setUserCoins] = useState(0);

  React.useEffect(() => {
    loadUserCoins();
  }, []);

  const loadUserCoins = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      setUserCoins(snapshot.val().coins || 0);
    }
  };

  const handleCreateSkin = async (withPowerSuggestion) => {
    if (!skinName.trim()) {
      Alert.alert('שגיאה', 'אנא תן שם לסקין');
      return;
    }

    const userId = auth.currentUser?.uid;
    if (!userId) return;

    // Check custom skins limit
    const userRef = ref(database, `users/${userId}/customSkins`);
    const snapshot = await get(userRef);
    const customSkins = snapshot.val() || {};
    
    if (Object.keys(customSkins).length >= 10) {
      Alert.alert('מגבלה', 'אתה יכול ליצור עד 10 סקינים מותאמים');
      return;
    }

    if (withPowerSuggestion) {
      if (!powerSuggestion.trim()) {
        Alert.alert('שגיאה', 'אנא תאר את הכוח המוצע');
        return;
      }

      // Submit power suggestion for admin approval
      await submitPowerSuggestion();
    } else {
      // Create free skin without power
      await createFreeSkin();
    }
  };

  const submitPowerSuggestion = async () => {
    try {
      const userId = auth.currentUser?.uid;
      const username = (await get(ref(database, `users/${userId}/username`))).val();
      
      // Save to power suggestions collection
      const suggestionRef = push(ref(database, 'powerSuggestions'));
      await update(suggestionRef, {
        userId: userId,
        username: username,
        skinName: skinName,
        emoji: selectedEmoji,
        color: selectedColor,
        powerDescription: powerSuggestion,
        status: 'pending', // pending, approved, rejected
        createdAt: Date.now()
      });

      Alert.alert(
        'הצעה נשלחה!',
        'ההצעה שלך לכוח נשלחה למפתחים. אם תאושר, תוכל להשתמש בה!\n\nבינתיים, הסקין נוצר ללא כוח.',
        [
          {
            text: 'מעולה!',
            onPress: async () => {
              await createFreeSkin();
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('שגיאה', 'לא הצלחנו לשלוח את ההצעה');
    }
  };

  const createFreeSkin = async () => {
    try {
      const skinData = {
        name: skinName,
        emoji: selectedEmoji,
        color: selectedColor,
        powerDescription: null,
        cooldown: null,
        usesPerGame: null,
        price: 0
      };

      const userId = auth.currentUser?.uid;
      await saveCustomSkin(userId, skinData, database);

      if (!powerSuggestion.trim()) {
        Alert.alert(
          'הצלחה!',
          'הסקין נוצר בהצלחה!',
          [
            {
              text: 'נהדר',
              onPress: () => navigation.goBack()
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('שגיאה', 'לא הצלחנו ליצור את הסקין');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← חזור</Text>
        </TouchableOpacity>
        <Text style={styles.title}>עיצוב סקין</Text>
        <Text style={styles.coins}>💰 {userCoins}</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Skin Name */}
        <Text style={styles.label}>שם הסקין:</Text>
        <TextInput
          style={styles.input}
          placeholder="הכנס שם..."
          value={skinName}
          onChangeText={setSkinName}
          placeholderTextColor="#888"
        />

        {/* Emoji Selection */}
        <Text style={styles.label}>בחר אמוג'י:</Text>
        <View style={styles.emojiGrid}>
          {EMOJIS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={[
                styles.emojiButton,
                selectedEmoji === emoji && styles.emojiButtonSelected
              ]}
              onPress={() => setSelectedEmoji(emoji)}
            >
              <Text style={styles.emojiText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Color Selection */}
        <Text style={styles.label}>בחר צבע:</Text>
        <View style={styles.colorGrid}>
          {COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorButton,
                { backgroundColor: color },
                selectedColor === color && styles.colorButtonSelected
              ]}
              onPress={() => setSelectedColor(color)}
            />
          ))}
        </View>

        {/* Preview */}
        <Text style={styles.label}>תצוגה מקדימה:</Text>
        <View style={[styles.preview, { backgroundColor: selectedColor }]}>
          <Text style={styles.previewEmoji}>{selectedEmoji}</Text>
          <Text style={styles.previewName}>{skinName || 'הסקין שלי'}</Text>
        </View>

        {/* Power Suggestion */}
        <Text style={styles.label}>הצע כוח מיוחד (אופציונלי):</Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 תאר כוח שהיית רוצה לסקין שלך!{'\n'}
            המפתחים יבדקו את ההצעה ואולי יוסיפו אותה למשחק.{'\n'}
            אם תאושר - תקבל הודעה ותוכל להשתמש בכוח!
          </Text>
        </View>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="לדוגמה: 'אני רוצה כוח שנותן לי מהירות x2 למשך 5 שניות פעם ב-30 שניות'"
          value={powerSuggestion}
          onChangeText={setPowerSuggestion}
          multiline
          numberOfLines={4}
          placeholderTextColor="#888"
        />

        {/* Create Buttons */}
        <View style={styles.createButtons}>
          <TouchableOpacity
            style={styles.createFreeButton}
            onPress={() => handleCreateSkin(false)}
          >
            <Text style={styles.createButtonText}>צור ללא כוח (חינם)</Text>
          </TouchableOpacity>

          {powerSuggestion.trim().length > 0 && (
            <TouchableOpacity
              style={styles.createWithSuggestionButton}
              onPress={() => handleCreateSkin(true)}
            >
              <Text style={styles.createButtonText}>
                צור + הצע כוח למפתחים
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Info about approval process */}
        <View style={styles.approvalInfo}>
          <Text style={styles.approvalTitle}>📋 תהליך אישור כוחות:</Text>
          <Text style={styles.approvalText}>
            1️⃣ אתה מציע כוח{'\n'}
            2️⃣ המפתחים בודקים את ההצעה{'\n'}
            3️⃣ אם הכוח מאוזן ומעניין - הוא מתווסף למשחק!{'\n'}
            4️⃣ תקבל הודעה ותוכל להשתמש בכוח{'\n'}
            {'\n'}
            💡 זה מבטיח שכל הכוחות במשחק מאוזנים ולא OP!
          </Text>
        </View>
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
  coins: {
    color: '#ffd700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  label: {
    color: '#00ff00',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#2a2a2a',
    color: 'white',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  emojiButton: {
    width: 60,
    height: 60,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3a3a3a',
  },
  emojiButtonSelected: {
    borderColor: '#00ff00',
    backgroundColor: '#3a3a3a',
  },
  emojiText: {
    fontSize: 36,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#3a3a3a',
  },
  colorButtonSelected: {
    borderWidth: 4,
    borderColor: 'white',
  },
  preview: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
  },
  previewEmoji: {
    fontSize: 64,
    marginBottom: 10,
  },
  previewName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#00ff00',
  },
  infoText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
  createButtons: {
    marginTop: 30,
    marginBottom: 20,
    gap: 15,
  },
  createFreeButton: {
    backgroundColor: '#00ff00',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  createWithSuggestionButton: {
    backgroundColor: '#ffd700',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#1a1a1a',
    fontSize: 18,
    fontWeight: 'bold',
  },
  approvalInfo: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 20,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#ffd700',
    marginBottom: 50,
  },
  approvalTitle: {
    color: '#ffd700',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  approvalText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 24,
  },
});


const EMOJIS = ['😀', '😎', '🤖', '👽', '🦄', '🐉', '⚡', '🔥', '💎', '🌟', '👾', '🎃'];
const COLORS = [
  '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
  '#ff8800', '#8800ff', '#00ff88', '#ff0088', '#88ff00', '#0088ff'
];

export default function SkinDesignerScreen({ navigation }) {
  const [skinName, setSkinName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('😀');
  const [selectedColor, setSelectedColor] = useState('#ff0000');
  const [powerDescription, setPowerDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [userCoins, setUserCoins] = useState(0);

  React.useEffect(() => {
    loadUserCoins();
  }, []);

  const loadUserCoins = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      setUserCoins(snapshot.val().coins || 0);
    }
  };

  const handleAnalyzePower = async () => {
    if (!powerDescription.trim()) {
      Alert.alert('שגיאה', 'אנא תאר את הכוח המיוחד');
      return;
    }

    setAnalyzing(true);
    setAnalysis(null);

    try {
      const result = await analyzeSkinPower(powerDescription);
      
      if (result.success) {
        setAnalysis(result);
        
        if (!result.isBalanced) {
          Alert.alert(
            'כוח לא מאוזן',
            result.reason,
            [{ text: 'הבנתי' }]
          );
        }
      } else {
        Alert.alert('שגיאה', 'לא הצלחנו לנתח את הכוח');
      }
    } catch (error) {
      Alert.alert('שגיאה', 'בעיה בחיבור לשרת');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCreateSkin = async (withPower) => {
    if (!skinName.trim()) {
      Alert.alert('שגיאה', 'אנא תן שם לסקין');
      return;
    }

    const userId = auth.currentUser?.uid;
    if (!userId) return;

    // Check custom skins limit
    const userRef = ref(database, `users/${userId}/customSkins`);
    const snapshot = await get(userRef);
    const customSkins = snapshot.val() || {};
    
    if (Object.keys(customSkins).length >= 10) {
      Alert.alert('מגבלה', 'אתה יכול ליצור עד 10 סקינים מותאמים');
      return;
    }

    if (withPower) {
      if (!analysis || !analysis.isBalanced) {
        Alert.alert('שגיאה', 'אנא נתח כוח מאוזן תחילה');
        return;
      }

      if (userCoins < analysis.price) {
        Alert.alert('אין מספיק מטבעות', `דרושים ${analysis.price} מטבעות`);
        return;
      }

      // Confirm purchase
      Alert.alert(
        'אישור רכישה',
        `האם לקנות סקין עם כוח?\nמחיר: ${analysis.price} מטבעות\nכוח: ${analysis.powerDescription}`,
        [
          { text: 'ביטול', style: 'cancel' },
          {
            text: 'קנה',
            onPress: async () => {
              await createSkinWithPower(analysis.price);
            }
          }
        ]
      );
    } else {
      // Free skin without power
      await createFreeSkin();
    }
  };

  const createSkinWithPower = async (price) => {
    try {
      const skinData = {
        name: skinName,
        emoji: selectedEmoji,
        color: selectedColor,
        powerDescription: analysis.powerDescription,
        cooldown: analysis.cooldown,
        usesPerGame: analysis.usesPerGame,
        price: price
      };

      const userId = auth.currentUser?.uid;
      await saveCustomSkin(userId, skinData, database);

      // Deduct coins
      const userRef = ref(database, `users/${userId}`);
      await update(userRef, {
        coins: userCoins - price
      });

      Alert.alert(
        'הצלחה!',
        'הסקין נוצר בהצלחה עם כוח מיוחד!',
        [
          {
            text: 'נהדר',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      Alert.alert('שגיאה', 'לא הצלחנו ליצור את הסקין');
    }
  };

  const createFreeSkin = async () => {
    try {
      const skinData = {
        name: skinName,
        emoji: selectedEmoji,
        color: selectedColor,
        powerDescription: null,
        cooldown: null,
        usesPerGame: null,
        price: 0
      };

      const userId = auth.currentUser?.uid;
      await saveCustomSkin(userId, skinData, database);

      Alert.alert(
        'הצלחה!',
        'הסקין נוצר בהצלחה!',
        [
          {
            text: 'נהדר',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      Alert.alert('שגיאה', 'לא הצלחנו ליצור את הסקין');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← חזור</Text>
        </TouchableOpacity>
        <Text style={styles.title}>עיצוב סקין</Text>
        <Text style={styles.coins}>💰 {userCoins}</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Skin Name */}
        <Text style={styles.label}>שם הסקין:</Text>
        <TextInput
          style={styles.input}
          placeholder="הכנס שם..."
          value={skinName}
          onChangeText={setSkinName}
          placeholderTextColor="#888"
        />

        {/* Emoji Selection */}
        <Text style={styles.label}>בחר אמוג'י:</Text>
        <View style={styles.emojiGrid}>
          {EMOJIS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={[
                styles.emojiButton,
                selectedEmoji === emoji && styles.emojiButtonSelected
              ]}
              onPress={() => setSelectedEmoji(emoji)}
            >
              <Text style={styles.emojiText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Color Selection */}
        <Text style={styles.label}>בחר צבע:</Text>
        <View style={styles.colorGrid}>
          {COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorButton,
                { backgroundColor: color },
                selectedColor === color && styles.colorButtonSelected
              ]}
              onPress={() => setSelectedColor(color)}
            />
          ))}
        </View>

        {/* Preview */}
        <Text style={styles.label}>תצוגה מקדימה:</Text>
        <View style={[styles.preview, { backgroundColor: selectedColor }]}>
          <Text style={styles.previewEmoji}>{selectedEmoji}</Text>
          <Text style={styles.previewName}>{skinName || 'הסקין שלי'}</Text>
        </View>

        {/* Power Description */}
        <Text style={styles.label}>כוח מיוחד (אופציונלי):</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="תאר את הכוח שאתה רוצה... (לדוגמה: 'אני רוצה להתחמק במרחק 5 מטרים פעם ב-20 שניות')"
          value={powerDescription}
          onChangeText={setPowerDescription}
          multiline
          numberOfLines={4}
          placeholderTextColor="#888"
        />

        {powerDescription.trim().length > 0 && (
          <TouchableOpacity
            style={styles.analyzeButton}
            onPress={handleAnalyzePower}
            disabled={analyzing}
          >
            {analyzing ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.analyzeButtonText}>נתח כוח</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Analysis Result */}
        {analysis && (
          <View style={[
            styles.analysisBox,
            !analysis.isBalanced && styles.analysisBoxRejected
          ]}>
            <Text style={styles.analysisTitle}>
              {analysis.isBalanced ? '✅ כוח מאוזן!' : '❌ כוח לא מאוזן'}
            </Text>
            <Text style={styles.analysisText}>{analysis.reason}</Text>
            {analysis.isBalanced && (
              <>
                <Text style={styles.analysisPower}>
                  {analysis.powerDescription}
                </Text>
                <Text style={styles.analysisPrice}>
                  💰 מחיר: {analysis.price} מטבעות
                </Text>
                {analysis.cooldown && (
                  <Text style={styles.analysisDetail}>
                    ⏱️ קולדאון: {analysis.cooldown} שניות
                  </Text>
                )}
                {analysis.usesPerGame && (
                  <Text style={styles.analysisDetail}>
                    🎯 שימושים: {analysis.usesPerGame} למשחק
                  </Text>
                )}
              </>
            )}
          </View>
        )}

        {/* Create Buttons */}
        <View style={styles.createButtons}>
          <TouchableOpacity
            style={styles.createFreeButton}
            onPress={() => handleCreateSkin(false)}
          >
            <Text style={styles.createButtonText}>צור ללא כוח (חינם)</Text>
          </TouchableOpacity>

          {analysis && analysis.isBalanced && (
            <TouchableOpacity
              style={[
                styles.createPaidButton,
                userCoins < analysis.price && styles.createPaidButtonDisabled
              ]}
              onPress={() => handleCreateSkin(true)}
              disabled={userCoins < analysis.price}
            >
              <Text style={styles.createButtonText}>
                צור עם כוח ({analysis.price} 💰)
              </Text>
            </TouchableOpacity>
          )}
        </View>
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
  coins: {
    color: '#ffd700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  label: {
    color: '#00ff00',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#2a2a2a',
    color: 'white',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  emojiButton: {
    width: 60,
    height: 60,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3a3a3a',
  },
  emojiButtonSelected: {
    borderColor: '#00ff00',
    backgroundColor: '#3a3a3a',
  },
  emojiText: {
    fontSize: 36,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#3a3a3a',
  },
  colorButtonSelected: {
    borderWidth: 4,
    borderColor: 'white',
  },
  preview: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
  },
  previewEmoji: {
    fontSize: 64,
    marginBottom: 10,
  },
  previewName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  analyzeButton: {
    backgroundColor: '#4a90e2',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  analysisBox: {
    backgroundColor: '#2a4a2a',
    padding: 20,
    borderRadius: 15,
    marginTop: 15,
    borderWidth: 2,
    borderColor: '#00ff00',
  },
  analysisBoxRejected: {
    backgroundColor: '#4a2a2a',
    borderColor: '#ff0000',
  },
  analysisTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  analysisText: {
    color: '#ddd',
    fontSize: 16,
    marginBottom: 10,
  },
  analysisPower: {
    color: '#00ff00',
    fontSize: 16,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  analysisPrice: {
    color: '#ffd700',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  analysisDetail: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 5,
  },
  createButtons: {
    marginTop: 30,
    marginBottom: 50,
    gap: 15,
  },
  createFreeButton: {
    backgroundColor: '#00ff00',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  createPaidButton: {
    backgroundColor: '#ffd700',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  createPaidButtonDisabled: {
    backgroundColor: '#555',
  },
  createButtonText: {
    color: '#1a1a1a',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
