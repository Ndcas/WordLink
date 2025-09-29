import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Dimensions, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { post } from '../utils/requestWrapper';

const { width } = Dimensions.get('window');

const LoginScreen = () => {
  const navigation = useNavigation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if ((await AsyncStorage.getItem('rememberMe')) == "1") {
        // let refreshToken = await AsyncStorage.getItem("refreshToken");

        // let res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/account/quickLogIn`, {
        //   method: "POST",
        //   headers: {
        //     Authorization: `Bearer ${refreshToken}`,
        //     "Content-Type": "application/json"
        //   },
        // });
        try {
          let res = await post('/account/quickLogIn', {}, 'refresh');
          if (res.ok) {
            let data = await res.json();
            await AsyncStorage.setItem('accessToken', data.accessToken);
            await AsyncStorage.setItem('refreshToken', data.refreshToken);
            global.expireMs = data.expireMs + Date.now();
            navigation.replace('MainTabs');
          }
        } catch (error) {
          console.error('Quick login error:', error);
        }
      }
    })();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      // const apiUrl = `${process.env.EXPO_PUBLIC_API_URL}/account/logIn`; // đúng với backend
      // const res = await axios.post(apiUrl, {
      //   email: email.trim(),       // backend yêu cầu "Email"
      //   password: password.trim() // backend yêu cầu "APassword"
      // });
      let response = await post('/account/logIn', {
        email: email.trim(),       // backend yêu cầu "Email"
        password: password.trim() // backend yêu cầu "APassword"
      });
      if (!response.ok) {
        Alert.alert('Lỗi', 'Đăng nhập thất bại');
        return;
      }
      let data = await response.json();
      // Lưu token vào AsyncStorage
      await AsyncStorage.setItem('accessToken', data.accessToken);
      await AsyncStorage.setItem('refreshToken', data.refreshToken);
      global.expireMs = data.expireMs + Date.now();
      // Nếu muốn rememberMe → giữ refreshToken lâu hơn
      await AsyncStorage.setItem('rememberMe', rememberMe ? "1" : "0");
      // Chuyển sang Home (hoặc màn chính của app)
      navigation.replace('MainTabs');
    } catch (err) {
      console.error('Login error:', err);
      Alert.alert('Lỗi đăng nhập', 'Có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.screen}>
          <View style={styles.loginCard}>
            <Text style={styles.welcomeText}>
              Hi, Welcome to <Text style={styles.cardLogo}>Wordlink</Text>
            </Text>

            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor="#B0BACC"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#B0BACC"
                secureTextEntry={true}
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View style={[styles.checkmark, rememberMe && styles.checkmarkChecked]}>
                  {rememberMe && <Text style={styles.checkmarkIcon}>✔</Text>}
                </View>
                <Text style={styles.checkboxText}>Remember me</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate("ForgotPasswordScreen")}>
                <Text style={styles.forgotPassword}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && { backgroundColor: '#888' }]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? 'ĐANG ĐĂNG NHẬP...' : 'LOGIN'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.signupPrompt}>
              Don't have account?{' '}
              <Text
                style={styles.signupLink}
                onPress={() => navigation.navigate('SignUpScreen')}
              >
                Sign up
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E6EAF5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 20,
  },
  loginCard: {
    backgroundColor: '#1A2E59',
    padding: 40,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    width: width * 0.9,
    maxWidth: 380,
    alignItems: 'center',
  },
  welcomeText: {
    color: 'white',
    fontSize: 28,
    marginBottom: 30,
    fontWeight: 'normal',
    textAlign: 'center',
  },
  cardLogo: {
    color: '#FFB300',
    fontFamily: 'Cochin',
    fontSize: 32,
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 20,
    width: '100%',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#334A72',
    borderRadius: 10,
    paddingHorizontal: 20,
    color: 'white',
    fontSize: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkmark: {
    height: 18,
    width: 18,
    backgroundColor: '#eee',
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkmarkChecked: {
    backgroundColor: '#8A2BE2',
  },
  checkmarkIcon: {
    color: 'white',
    fontSize: 12,
  },
  checkboxText: {
    color: '#B0BACC',
    fontSize: 14,
  },
  forgotPassword: {
    color: '#6A5ACD',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#6A5ACD',
    paddingVertical: 15,
    width: '100%',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupPrompt: {
    color: '#B0BACC',
    fontSize: 14,
    textAlign: 'center',
  },
  signupLink: {
    color: '#6A5ACD',
    fontWeight: 'bold',
  },
});

export default LoginScreen;
