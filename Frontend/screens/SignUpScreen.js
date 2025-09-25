import React, { useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const API_URL = "http://192.168.1.10:8080"; // Android emulator, đổi thành IP backend thật khi test máy thật

const SignUpScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Gửi OTP
  const handleGetOTP = async () => {
    if (!email.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập email");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/account/getOTPSignUp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Email: email.trim() }), // Backend yêu cầu "Email"
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert("Thành công", "OTP đã được gửi về email");
        setOtpSent(true);
      } else {
        Alert.alert("Lỗi", data.message || "Không thể gửi OTP");
      }
    } catch (err) {
      Alert.alert("Lỗi", "Không thể kết nối server");
    }
  };

  // Đăng ký + login
  const handleSignUp = async () => {
    if (!username || !password || !email || !otp) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
      return;
    }

    try {
      // Gọi signUp
      const res = await fetch(`${API_URL}/account/signUp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Username: username.trim(),
          APassword: password.trim(),
          Email: email.trim(),
          otp: otp.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Lỗi", data.message || "Đăng ký thất bại");
        return;
      }

      // Đăng ký xong → login
      const loginRes = await fetch(`${API_URL}/account/logIn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Email: email.trim(),
          APassword: password.trim(),
        }),
      });
      const loginData = await loginRes.json();

      if (loginRes.ok) {
        await AsyncStorage.setItem("accessToken", loginData.accessToken);
        await AsyncStorage.setItem("refreshToken", loginData.refreshToken);

        Alert.alert("Thành công", "Đăng ký & đăng nhập thành công");
        navigation.replace("Nickname");
      } else {
        Alert.alert("Lỗi", loginData.message || "Đăng nhập thất bại");
      }
    } catch (err) {
      Alert.alert("Lỗi", "Không thể kết nối server");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.logo}>Wordlink</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#aaa"
          value={email}
          onChangeText={setEmail}
        />

        <TouchableOpacity style={styles.button} onPress={handleGetOTP}>
          <Text style={styles.buttonText}>LẤY OTP</Text>
        </TouchableOpacity>

        {otpSent && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Tên tài khoản"
              placeholderTextColor="#aaa"
              value={username}
              onChangeText={setUsername}
            />
            <TextInput
              style={styles.input}
              placeholder="Mật khẩu"
              placeholderTextColor="#aaa"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="OTP"
              placeholderTextColor="#aaa"
              value={otp}
              onChangeText={setOtp}
              keyboardType="numeric"
            />

            <TouchableOpacity style={styles.button} onPress={handleSignUp}>
              <Text style={styles.buttonText}>ĐĂNG KÝ</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#E6EAF5",
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  logo: {
    fontSize: width > 768 ? 60 : 40,
    fontWeight: "bold",
    color: "#FFB300",
    marginBottom: 40,
  },
  input: {
    width: "100%",
    maxWidth: 400,
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#fff",
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#6A5ACD",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginBottom: 15,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default SignUpScreen;
