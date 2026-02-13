// screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, database } from '../firebase.config';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  const handleAuth = async () => {
    try {
      if (isRegister) {
        if (!username.trim()) {
          Alert.alert('שגיאה', 'אנא הזן שם משתמש');
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const userId = userCredential.user.uid;
        
        // Create user profile in database
        await set(ref(database, `users/${userId}`), {
          username: username,
          email: email,
          selectedSkin: 'default',
          gamesPlayed: 0,
          wins: 0,
          coins: 500, // התחלה עם 500 מטבעות
          abilities: {},
          items: {},
          skinPowers: {},
          stats: {
            totalHeals: 0,
            totalBites: 0,
            winStreak: 0,
            lastPlayDate: null
          }
        });
        
        Alert.alert('הצלחה!', 'החשבון נוצר בהצלחה');
        navigation.replace('SkinSelection');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        navigation.replace('SkinSelection');
      }
    } catch (error) {
      Alert.alert('שגיאה', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧟 משחק הזומבים 🧟</Text>
      
      {isRegister && (
        <TextInput
          style={styles.input}
          placeholder="שם משתמש"
          value={username}
          onChangeText={setUsername}
        />
      )}
      
      <TextInput
        style={styles.input}
        placeholder="אימייל"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="סיסמה"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity style={styles.button} onPress={handleAuth}>
        <Text style={styles.buttonText}>
          {isRegister ? 'הרשמה' : 'התחברות'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
        <Text style={styles.switchText}>
          {isRegister ? 'יש לך חשבון? התחבר' : 'אין לך חשבון? הירשם'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00ff00',
    marginBottom: 40,
  },
  input: {
    width: '100%',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    width: '100%',
    backgroundColor: '#00ff00',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#1a1a1a',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchText: {
    color: '#00ff00',
    marginTop: 20,
    fontSize: 16,
  },
});
