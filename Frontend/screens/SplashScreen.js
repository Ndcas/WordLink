import React, { useEffect } from 'react';
import {View, Text, StyleSheet, Dimensions, ActivityIndicator} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          // Gọi API quick login
          const res = await fetch('http://<IP_BACKEND>:3000/account/quickLogIn', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${refreshToken}`,
              'Content-Type': 'application/json',
            },
          });

          const data = await res.json();
          if (res.ok && data.accessToken) {
            await AsyncStorage.setItem('accessToken', data.accessToken);
            await AsyncStorage.setItem('refreshToken', data.refreshToken);
            navigation.replace('MainTabs'); // Nếu login thành công
            return;
          }
        }
      } catch (error) {
        console.log('Quick login error:', error);
      }
      // Nếu không có token hoặc lỗi → quay về login
      navigation.replace('Login');
    };

    checkLogin();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <Text style={styles.logo}>Wordlink</Text>
        <ActivityIndicator size="large" color="#FFB300" style={{ marginTop: 20 }} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E6EAF5',
  },
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  logo: {
    fontFamily: 'Cochin',
    fontSize: width > 768 ? 80 : 50,
    color: '#FFB300',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
});

export default SplashScreen;
