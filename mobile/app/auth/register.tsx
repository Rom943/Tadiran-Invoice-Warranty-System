import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
      try {
      setIsLoading(true);
      const success = await register(name, email, password);
        if (success) {
        router.replace('../(tabs)');
      } else {
        Alert.alert('Registration Failed', 'Failed to create account');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred during registration');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>מערכת אימות אחריות</Text>
      <Text style={styles.title}>טאדירן</Text>
      <Text style={styles.subtitle}>צור משתמש מתקין</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>שם מלא</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="הקלד שם מלא"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>אימייל</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="הקלד את האימייל שלך"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>סיסמא</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="הקלד את הסיסמא שלך"
          secureTextEntry
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>וידוי סיסמא</Text>
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="הקלד את הסיסמא שוב"
          secureTextEntry/>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>הרשם</Text>
      </TouchableOpacity>
       <View style={styles.linkContainer}>
        <Text style={styles.linkText}>יש לך כבר משתמש? </Text>   
             <TouchableOpacity onPress={() => router.push('./login')}>
          <Text style={styles.link}>התחבר</Text>
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
    direction: 'rtl', // Right-to-left layout for Hebrew
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
  },
  button: {
    backgroundColor: Colors.dark.primary,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
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
