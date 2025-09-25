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

  useEffect(() => {
    const initSocket = async () => {
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      const avatarImage = "default.png"; // hoặc lấy từ profile user

      const newSocket = io(API_URL, {
        transports: ["websocket"],
      });

      newSocket.on("connect", () => {
        console.log("Connected to server");
        // Gửi xác thực
        newSocket.emit("authentication", refreshToken, avatarImage);
        // Bắt đầu chơi với bot
        newSocket.emit("play with bot");
      });

      newSocket.on("your turn", (data) => {
        setCurrentWord(data.currentWord);
        setUsedWords(data.usedWords);
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
        navigation.goBack();
      });

      newSocket.on("disconnecting", () => {
        console.log("Disconnecting...");
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
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
      <Text style={styles.title}>PLAY WITH BOT</Text>

      <View style={styles.wordBox}>
        <Text style={styles.label}>Current Word:</Text>
        <Text style={styles.currentWord}>{currentWord || "-"}</Text>
      </View>

      <ScrollView style={styles.wordHistory}>
        {usedWords.map((w, i) => (
          <Text key={i} style={styles.usedWord}>• {w}</Text>
        ))}
      </ScrollView>

      <TextInput
        style={styles.input}
        placeholder="Enter your word..."
        value={inputWord}
        onChangeText={setInputWord}
      />

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
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", color: "#10375C", textAlign: "center", marginBottom: 20 },
  wordBox: { marginBottom: 20, alignItems: "center" },
  label: { fontSize: 16, color: "#888" },
  currentWord: { fontSize: 22, color: "#EB8317", fontWeight: "bold" },
  wordHistory: { flex: 1, marginVertical: 10 },
  usedWord: { fontSize: 16, marginVertical: 2, color: "#333" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 12, fontSize: 16, marginBottom: 10 },
  buttons: { flexDirection: "row", justifyContent: "space-around" },
  sendBtn: { backgroundColor: "#10375C", padding: 15, borderRadius: 10, flex: 1, marginRight: 5, alignItems: "center" },
  giveUpBtn: { backgroundColor: "#C62828", padding: 15, borderRadius: 10, flex: 1, marginLeft: 5, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
