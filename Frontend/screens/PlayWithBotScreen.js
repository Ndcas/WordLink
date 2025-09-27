import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PlayWithBotScreen({ navigation }) {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const [socket, setSocket] = useState(null);
  const [currentWord, setCurrentWord] = useState(null);
  const [usedWords, setUsedWords] = useState([]);
  const [inputWord, setInputWord] = useState("");
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    const initSocket = async () => {
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      const avatarImage = "default.png";

      const newSocket = io(API_URL, { transports: ["websocket"] });

      newSocket.on("connect", () => {
        console.log("Connected to server");
        newSocket.emit("authentication", refreshToken, avatarImage);
      });

      newSocket.on("authenticated", () => {
        newSocket.emit("play with bot");
      })

      newSocket.on("your turn", (data) => {
        setCurrentWord(data.currentWord);
        setUsedWords(data.usedWords);
        setTimer(30); // reset đồng hồ
      });

      newSocket.on("authentication failed", (data) => {
        console.log(data);
      });

      newSocket.on("invalid word", () => {
        Alert.alert("❌ Lỗi", "Từ không hợp lệ!");
      });

      newSocket.on("match result", (data) => {
        Alert.alert(
          "🏆 Kết quả",
          `Kết quả: ${data.result === 1 ? "Bạn thắng" : "Bạn thua"}\nĐiểm: ${data.score} (+${data.scoreD})`
        );
        newSocket.disconnect();
        navigation.replace('MainTabs');
      });

      setSocket(newSocket);

      return () => newSocket.disconnect();
    };

    initSocket();
  }, []);

  const handleSendWord = () => {
    if (inputWord.trim() && socket) {
      socket.emit("send word to bot", inputWord.trim());
      setInputWord("");
    }
  };

  const handleBotWin = () => {
    if (socket) socket.emit("bot win");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>🤖 PLAY WITH BOT</Text>

      {/* Đồng hồ đếm ngược */}
      <Text style={styles.timer}>⏳ {timer}s</Text>

      {/* Current word */}
      <View style={styles.wordBox}>
        <Text style={styles.label}>Current Word</Text>
        <Text style={styles.currentWord}>{currentWord || "-"}</Text>
      </View>

      {/* Lịch sử từ */}
      <Text style={styles.historyTitle}>Used Words</Text>
      <ScrollView style={styles.wordHistory}>
        {usedWords.map((w, i) => (
          <Text key={i} style={styles.usedWord}>• {w}</Text>
        ))}
      </ScrollView>

      {/* Input */}
      <TextInput
        style={styles.input}
        placeholder="Enter your word..."
        value={inputWord}
        onChangeText={setInputWord}
      />

      {/* Buttons */}
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.sendBtn} onPress={handleSendWord}>
          <Text style={styles.btnText}>SEND</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.giveUpBtn} onPress={handleBotWin}>
          <Text style={styles.btnText}>BOT WIN</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F4F6FF" },
  title: { fontSize: 26, fontWeight: "bold", color: "#10375C", textAlign: "center", marginBottom: 10 },
  timer: { fontSize: 20, color: "#C62828", textAlign: "center", marginBottom: 15, fontWeight: "bold" },
  wordBox: { marginBottom: 20, alignItems: "center" },
  label: { fontSize: 16, color: "#888" },
  currentWord: { fontSize: 28, color: "#EB8317", fontWeight: "bold", marginTop: 5 },
  historyTitle: { fontSize: 18, fontWeight: "bold", color: "#10375C", marginBottom: 5 },
  wordHistory: { flex: 1, backgroundColor: "#fff", borderRadius: 10, padding: 10, marginBottom: 10 },
  usedWord: { fontSize: 16, marginVertical: 2, color: "#333" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 12, fontSize: 16, marginBottom: 10, backgroundColor: "#fff" },
  buttons: { flexDirection: "row", justifyContent: "space-between" },
  sendBtn: { backgroundColor: "#10375C", padding: 15, borderRadius: 10, flex: 1, marginRight: 5, alignItems: "center" },
  giveUpBtn: { backgroundColor: "#C62828", padding: 15, borderRadius: 10, flex: 1, marginLeft: 5, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
