import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from '@react-navigation/native';

export default function AccountInfoScreen() {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchAccountInfo = async () => {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        if (!token) {
          Alert.alert("Lỗi", "Không tìm thấy access token, vui lòng đăng nhập lại.");
          setLoading(false);
          return;
        }

        const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/account/getAccountInfo`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          throw new Error("Không lấy được thông tin tài khoản");
        }

        const data = await res.json();
        setAccount(data);
      } catch (err) {
        console.error("Fetch account error:", err);
        Alert.alert("Lỗi", err.message || "Không thể tải thông tin tài khoản.");
      } finally {
        setLoading(false);
      }
    };

    fetchAccountInfo();
  }, []);

  //Đăng xuất
  const handleLogout = async () => {
    let accessToken = AsyncStorage.getItem('accessToken');

    const apiUrl = `${process.env.EXPO_PUBLIC_API_URL}/account/logOut`;
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('username');
    await AsyncStorage.removeItem('refreshToken');
    navigation.replace('LoginScreen');
    console.error('Lỗi logout:', err);
    Alert.alert('Lỗi', 'Đăng xuất thất bại.');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10375C" />
      </View>
    );
  }

  if (!account) {
    return (
      <View style={styles.center}>
        <Text>Không có thông tin tài khoản</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {account.AvatarImage ? (
        <Image
          source={{ uri: `${process.env.EXPO_PUBLIC_API_URL}/uploads/${account.AvatarImage}` }}
          style={styles.avatar}
        />
      ) : (
        <View style={[styles.avatar, styles.placeholder]} />
      )}

      <Text style={styles.username}>👤 {account.Username}</Text>
      <Text style={styles.info}>📧 {account.Email}</Text>
      <Text style={styles.info}>⭐ Điểm: {account.Score}</Text>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>LOG OUT</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
  },
  placeholder: {
    backgroundColor: "#ccc",
  },
  username: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  info: {
    fontSize: 16,
    marginBottom: 6,
  },
  logoutButton: {
    marginTop: 30,
    backgroundColor: '#FF4D4F',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  logoutText: {
    color: '#fff',
    fontFamily: 'Bungee',
    fontSize: 16
  },
});
