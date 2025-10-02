// MultiplayerScreen.js
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import io from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function MultiplayerScreen({ navigation }) {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const socketRef = useRef(null);

  const [status, setStatus] = useState("Đang kết nối...");
  const [inMatch, setInMatch] = useState(false);
  const [opponent, setOpponent] = useState(null);
  const [usedWords, setUsedWords] = useState([]);
  const [currentWord, setCurrentWord] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [input, setInput] = useState("");
  const [timer, setTimer] = useState(30); // đếm ngược

  useEffect(() => {
    const init = async () => {
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      const avatarImage =
        (await AsyncStorage.getItem("avatarImage")) || "default.png";

      const socket = io(API_URL, {
        transports: ["websocket"],
        autoConnect: false,
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        setStatus("Connected.");
        socket.emit("authentication", refreshToken, avatarImage);
      });

      socket.on("authentication failed", () => {
        navigation.reset({ index: 0, routes: [{ name: "LoginScreen" }] });
      });

      socket.on("authenticated", () => {
        socket.emit("find match");
      });

      socket.on("waiting for a match", () => {
        setStatus("Waiting for other players...");
      });

      socket.on("match found", (data) => {
        setInMatch(true);
        setOpponent({ username: data.opponent, avatarImage: data.avatarImage });
        setUsedWords([]);
        setCurrentWord(null);
        setStatus("Match found!");
      });

      socket.on("your turn", (data) => {
        setIsMyTurn(true);
        setCurrentWord(data?.currentWord || null);
        setUsedWords(data?.usedWords || []);
        setStatus("Your turn!");
        setTimer(30); // reset timer mỗi lượt
      });

      socket.on("invalid word", () => {
        Alert.alert("Error", "Invalid word!");
      });

      socket.on("valid word", (data) => {
        setCurrentWord(data?.currentWord);
        setUsedWords(data?.usedWords || []);
      });

      socket.on("match result", (data) => {
        setInMatch(false);
        setIsMyTurn(false);
        const txt = data.result == 1 ? "You've won 🎉" : "You;ve lost 😢";
        Alert.alert("Result", `${txt}\nScore: ${data?.scoreD ?? "-"}`);
        navigation.reset({ index: 0, routes: [{ name: "Home" }] });
      });

      socket.connect();
    };

    init();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  // Timer countdown effect
  useEffect(() => {
    let interval;
    if (isMyTurn && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (timer === 0 && isMyTurn) {
      Alert.alert("⏰ Time out!", "You've ran out of time.");
      setIsMyTurn(false);
      if (socketRef.current) socketRef.current.emit("bot win"); // hoặc emit pass turn
    }
    return () => clearInterval(interval);
  }, [isMyTurn, timer]);

  const sendWord = () => {
    if (!input.trim()) return;
    let sendWord = input.trim().toLowerCase();
    if (currentWord && sendWord[0] !== currentWord[currentWord.length - 1]) {
      Alert.alert("Invalid word", "The first character must match the last character of the last word!");
      return;
    }
    if (usedWords.includes(sendWord.trim().toLowerCase())) {
      Alert.alert("Invalid word", "This word has already been used!");
      return;
    }
    if (socketRef.current) {
      socketRef.current.emit("send word to player", input.trim());
      setInput("");
      setIsMyTurn(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.status}>{status}</Text>

      {!inMatch ? (
        <ActivityIndicator size="large" color="#10375C" style={{ marginTop: 30 }} />
      ) : (
        <View style={{ flex: 1, width: "100%" }}>
          <Text style={styles.opponent}>Opponent: {opponent?.username}</Text>
          <Text style={styles.current}>Current word: {currentWord || "—"}</Text>
          {isMyTurn && <Text style={styles.timer}>⏳ {timer}s</Text>}

          <ScrollView style={styles.wordList}>
            {usedWords.map((w, i) => (
              <Text key={i} style={styles.word}>
                {i + 1}. {w}
              </Text>
            ))}
          </ScrollView>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Enter a word..."
              value={input}
              onChangeText={setInput}
              editable={isMyTurn}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !isMyTurn && { opacity: 0.5 }]}
              onPress={sendWord}
              disabled={!isMyTurn}
            >
              <Text style={styles.sendText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  status: {
    fontSize: 18,
    textAlign: "center",
    marginVertical: 10,
    color: "#10375C",
    fontWeight: "bold",
  },
  opponent: { fontSize: 16, marginTop: 10, color: "#EB8317" },
  current: { fontSize: 20, marginTop: 20, color: "#10375C", fontWeight: "700" },
  timer: {
    fontSize: 18,
    color: "#C62828",
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
  },
  wordList: { flex: 1, marginVertical: 10 },
  word: { fontSize: 16, paddingVertical: 4, color: "#333" },
  inputRow: { flexDirection: "row", alignItems: "center" },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
  },
  sendBtn: {
    backgroundColor: "#10375C",
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  sendText: { color: "#fff", fontWeight: "bold" },
});
