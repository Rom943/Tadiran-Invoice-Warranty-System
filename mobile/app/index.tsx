import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/Colors';
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const { user, isLoading } = useAuth();
  const [isRedirecting, setIsRedirecting] = React.useState(false);

  useEffect(() => {
    // We'll automatically redirect after a short delay
    // This gives users time to see the splash screen
    const timer = setTimeout(() => {
      setIsRedirecting(true);
    }, 2000); // 2 seconds delay

    return () => clearTimeout(timer);  }, []); 

  if (isRedirecting) {
    return user ? <Redirect href="/(tabs)" /> : <Redirect href="/auth/login" />;
  }

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/tadiran-logo.png")} // Use your Tadiran logo here
        style={styles.logo}
        resizeMode="contain"
      />

      <ActivityIndicator size="large" color={Colors.dark.primary} style={styles.loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: Colors.dark.primary,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 40,
    color: Colors.dark.text,
  },
  loading: {
    marginTop: 20,
  },
});