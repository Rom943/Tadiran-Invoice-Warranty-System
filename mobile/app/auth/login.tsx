import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('שגיאה', 'אנא מלא את כל השדות');
      return;
    }
      try {
      setIsLoading(true);
      const success = await login(email, password);
      if (success) {
        router.replace('../(tabs)');
      } else {
        Alert.alert('התחברות נכשלה', 'אימייל או סיסמה שגויים');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred during login');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      
      <Text style={styles.title}>מערכת אימות אחריות</Text>
      <Text style={styles.title}>טאדירן</Text>
      <Text style={styles.subtitle}>התחבר למשתמש שלך:</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>אימייל</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="הכנס את האימייל שלך"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>סיסמה</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="הכנס את הסיסמא שלך"
          secureTextEntry
        />
      </View>

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleLogin}
        disabled={isLoading}>

        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : 
        (<Text style={styles.buttonText}>התחבר</Text>)}
      </TouchableOpacity>
      <View style={styles.linkContainer}>
        <Text style={styles.linkText}>אינך רשום למערכת? </Text>
        <TouchableOpacity onPress={() => router.push('./register')}>
          <Text style={styles.link}>הירשם</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    direction: 'rtl', // Right-to-left for Hebrew
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: Colors.dark.primary,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    color: Colors.dark.text,
  },
  inputContainer: {
    marginBottom: 20,
    direction: 'rtl', // Right-to-left for Hebrew
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: Colors.dark.text,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    fontSize: 16,
    direction: 'rtl', // Right-to-left for Hebrew
  },
  button: {
    backgroundColor: Colors.dark.primary,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
    direction: 'rtl', // Right-to-left for Hebrew
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    direction: 'rtl', // Right-to-left for Hebrew
  },
  linkText: {
    fontSize: 16,
    color: Colors.dark.text,
  },
  link: {
    fontSize: 16,
    color: Colors.dark.primary,
    fontWeight: 'bold',
  },
});
