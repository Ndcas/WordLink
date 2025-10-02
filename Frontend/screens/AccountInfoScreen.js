import { useCallback, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, ScrollView } from "react-native";
import { Image } from 'expo-image';
import AsyncStorage from "@react-native-async-storage/async-storage";
import checkAndRefreshAccessToken from "../utils/checkAndRefreshAccessToken";
import getAvatarImage from "../utils/getAvatarImage";
import { useFocusEffect, useNavigation } from '@react-navigation/native';

export default function AccountInfoScreen() {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analytic, setAnalytic] = useState(null);
  const navigation = useNavigation();

  useFocusEffect(useCallback(() => {
    (async () => {
      try {
        setLoading(true);
        await checkAndRefreshAccessToken();
        let token = await AsyncStorage.getItem("accessToken");
        if (!token) {
          Alert.alert("Error", "Can't find the access token, please try again.");
          return;
        }
        let res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/account/getAccountInfo`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) {
          throw new Error("Can't fetch account information");
        }
        setAccount(await res.json());
        res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/account/getAnalyticReport`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) {
          throw new Error("Can't fetch analytic information");
        }
        if (res.ok) {
          setAnalytic(await res.json());
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin tài khoản:", error);
        Alert.alert("Error", error.message || "Can't fetch account infromation.");
      } finally {
        setLoading(false);
      }
    })();
  }, []));

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
    }).catch(error => {
      console.log('Lỗi khi gọi API đăng xuất:', error);
    });

    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('username');
    await AsyncStorage.removeItem('refreshToken');
    navigation.replace('LoginScreen');
    console.error('Lỗi logout:', err);
    Alert.alert('Error', 'Logout failed.');
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
        <Text>No account infromation</Text>
      </View>
    );
  }

  return (
    <ScrollView>
      <View style={styles.container}>
        <Image
          source={getAvatarImage(account.AvatarImage)}
          style={styles.avatar}
        />

        <Text style={styles.username}>👤 {account.Username}</Text>
        <Text style={styles.info}>📧 {account.Email}</Text>
        <Text style={styles.info}>⭐ Point: {account.Score}</Text>

        <View style={{ width: "80%" }}>
          <Text style={[styles.info, { fontWeight: "bold" }]}>Match played:
            <Text style={{ fontWeight: "normal" }}> {analytic.numOfMatchesPlayed}</Text>
          </Text>
          <Text style={[styles.info, { fontWeight: "bold" }]}>Match won:
            <Text style={{ fontWeight: "normal" }}> {analytic.pvpWin}</Text>
          </Text>
          <Text style={[styles.info, { fontWeight: "bold" }]}>Match lost:
            <Text style={{ fontWeight: "normal" }}> {analytic.pvpLose}</Text>
          </Text>
          <Text style={[styles.info, { fontWeight: "bold" }]}>Words used:
            <Text style={{ fontWeight: "normal" }}> {analytic.numOfWordsUsed}</Text>
          </Text>
          <Text style={[styles.info, { fontWeight: "bold" }]}>Average word popularity:
            <Text style={{ fontWeight: "normal" }}> {analytic.avgPopularity}</Text>
          </Text>

          <Text style={[styles.info, { marginTop: 10, alignSelf: "center", fontWeight: "bold" }]}>Latest 100 words</Text>
          <View style={{ flexDirection: 'column' }}>
            <View style={{ flex: 1, flexDirection: 'row' }}>
              <View style={{ flex: 1, justifyContent: "center", backgroundColor: "#f7de83ff" }}>
                <Text style={{ marginLeft: "15%", fontWeight: "bold" }}>Word</Text>
              </View>
              <View style={{ flex: 1, justifyContent: "center", alignItems: "flex-end", backgroundColor: "#f7de83ff" }}>
                <Text style={{ marginRight: "15%", fontWeight: "bold" }}>Count</Text>
              </View>
            </View>
            {
              Object.entries(analytic.last100countMap).map(([word, count], index) => (
                <View key={index} style={{ flex: 1, flexDirection: 'row' }}>
                  <View style={{ flex: 1, justifyContent: "center", backgroundColor: index % 2 == 0 ? "#fff" : "#f7de83ff" }}>
                    <Text style={{ marginLeft: "15%" }}>{word}</Text>
                  </View>
                  <View style={{ flex: 1, justifyContent: "center", alignItems: 'flex-end', backgroundColor: index % 2 == 0 ? "#fff" : "#f7de83ff" }}>
                    <Text style={{ marginRight: "15%" }}>{count}</Text>
                  </View>
                </View>
              ))
            }

          </View>
        </View>

        <TouchableOpacity style={styles.changePasswordButton} onPress={() => navigation.navigate("BookmarkScreen")}>
          <Text style={styles.logoutText}>Bookmark</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.changePasswordButton} onPress={() => navigation.navigate("ChangePasswordScreen")}>
          <Text style={styles.logoutText}>Change Password</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>LOG OUT</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
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
    marginTop: "20%",
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
  analytic: {
    backgroundColor: "#ffffffff",
  },
  logoutButton: {
    marginTop: 30,
    backgroundColor: '#FF4D4F',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  changePasswordButton: {
    marginTop: 30,
    backgroundColor: '#F3C623',
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
