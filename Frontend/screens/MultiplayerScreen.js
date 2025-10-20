import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import io from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { getAvatarImage } from '../utils/getAvatarImage';
import { get } from '../utils/requestWrapper';

export default function MultiplayerScreen() {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const socketRef = useRef(null);
  const navigation = useNavigation();

  const [status, setStatus] = useState("Connecting...");
  const [inMatch, setInMatch] = useState(false);
  const [opponent, setOpponent] = useState(null);
  const [avatar, setAvatar] = useState();
  const [usedWords, setUsedWords] = useState([]);
  const [currentWord, setCurrentWord] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [input, setInput] = useState("");
  const [timer, setTimer] = useState(30);
  const timerRef = useRef(null);
  const [resultModal, setResultModal] = useState(null);
  const [playerAvatar, setPlayerAvatar] = useState("default.png");

  useEffect(() => {
    const init = async () => {
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      const avatarImage = (await AsyncStorage.getItem("avatarImage")) || "default.png";
      setPlayerAvatar(avatarImage);

      const socket = io(API_URL, { transports: ["websocket"], autoConnect: false });
      socketRef.current = socket;

      socket.on("connect", () => {
        setStatus("Connected.");
        socket.emit("authentication", refreshToken, avatarImage);
      });

      socket.on("authentication failed", () => {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              { name: 'LoginScreen' },
            ],
          })
        );
      });

      socket.on("authenticated", () => {
        socket.emit("find match");
      });

      socket.on("waiting for a match", () => {
        setStatus("⏳ Waiting for other player...");
      });

      socket.on("match found", (data) => {
        console.log(data);
        setInMatch(true);
        setOpponent({ username: data.opponent, avatarImage: data.avatarImage });
        setUsedWords([]);
        setCurrentWord(null);
        setStatus("Match found!");
      });

      // 🔹 Khi đến lượt người chơi
      socket.on("your turn", (data) => {
        setIsMyTurn(true);
        setCurrentWord(data?.currentWord || null);
        setUsedWords(data?.usedWords || []);
        resetTimer();
      });

      // 🔹 Khi đối thủ chơi xong
      socket.on("valid word", (data) => {
        setCurrentWord(data?.currentWord);
        setUsedWords(data?.usedWords || []);
        setIsMyTurn(false);
        stopTimer();
      });

      // 🔹 Khi người chơi nhập sai
      socket.on("invalid word", () => {
        Alert.alert("❌ Invalid word!", "Please try again.");
        setIsMyTurn(true);
        resetTimer(); // reset lại timer để người chơi nhập lại
      });

      // 🔹 Kết quả trận đấu
      socket.on("match result", (data) => {
        stopTimer();
        setInMatch(false);
        setIsMyTurn(false);

        setResultModal({
          title: "🏆 Result",
          message: `${data.result === 1 ? "You've won 🎉" : "You've lost 😢"
            }\nScore: ${data.score} (+${data.scoreD})`,
          newWords: data.newWords,
        });

        socket.disconnect();
      });

      socket.connect();
    };

    init();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  function resetTimer() {
    clearInterval(timerRef.current);
    setTimer(30);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev == 0) {
          clearInterval(timerRef.current);
          if (socketRef.current && isMyTurn) {
            Alert.alert("⏰ Time out!", "You've ran out of time.");
            socketRef.current.emit("other player win");
            setIsMyTurn(false);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerRef.current);
  }

  // ---------------- SEND WORD ----------------
  const sendWord = () => {
    if (!input.trim()) return;
    let word = input.trim().toLowerCase();

    if (currentWord && word[0] !== currentWord[currentWord.length - 1]) {
      Alert.alert(
        "❌ Invalid word",
        "The first character must match the last character of the last word!"
      );
      return;
    }
    if (usedWords.includes(word)) {
      Alert.alert("❌ Used word!");
      return;
    }

    setIsMyTurn(false); // 🔒 Disable input ngay khi gửi
    stopTimer();

    socketRef.current.emit("send word to player", word);
    setInput("");
  };

  // ---------------- UI ----------------
  if (!inMatch) {
    return (
      <SafeAreaView
        style={[styles.container, { justifyContent: "center", alignItems: "center" }]}
      >
        <ActivityIndicator size="large" color="#10375C" />
        <Text style={{ marginTop: 20, color: "#10375C", fontSize: 16 }}>
          {status}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={getAvatarImage(avatar)} style={styles.avatar} />
        <View style={styles.timerBox}>
          <Text style={styles.timerText}>{timer}s</Text>
        </View>
        <Image source={getAvatarImage(opponent.avatarImage)} style={styles.avatar} />
      </View>

      {/* Chat bubbles */}
      <ScrollView style={styles.chatContainer} contentContainerStyle={{ paddingBottom: 10 }}>
        {usedWords.map((w, i) => {
          const isPlayer = i % 2 === 0;
          return (
            <View
              key={i}
              style={[styles.bubble, isPlayer ? styles.playerBubble : styles.botBubble]}
            >
              <Text style={styles.bubbleText}>{w}</Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Input */}
      <TextInput
        style={styles.input}
        placeholder="Nhập từ của bạn..."
        value={input}
        onChangeText={setInput}
        editable={isMyTurn}
      />

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.sendBtn, !isMyTurn && { opacity: 0.5 }]}
          onPress={sendWord}
          disabled={!isMyTurn}
        >
          <Text style={styles.btnText}>SEND</Text>
        </TouchableOpacity>
      </View>

      {/* Result Modal */}
      <Modal
        visible={!!resultModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setResultModal(null)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{resultModal?.title}</Text>
            <Text style={styles.modalMessage}>{resultModal?.message}</Text>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => {
                setResultModal(null);
                navigation.goBack();
              }}
            >
              <Text style={styles.closeBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ---------------- STYLES ----------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 15 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#10375C",
  },
  timerBox: {
    backgroundColor: "#10375C",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  timerText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  chatContainer: { flex: 1, marginBottom: 10 },
  bubble: {
    maxWidth: "70%",
    padding: 10,
    borderRadius: 15,
    marginVertical: 6,
  },
  playerBubble: {
    backgroundColor: "#10375C",
    alignSelf: "flex-end",
    borderBottomRightRadius: 0,
  },
  botBubble: {
    backgroundColor: "#F3C623",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 0,
  },
  bubbleText: { color: "#fff", fontSize: 16, fontFamily: "Bungee" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  buttons: { flexDirection: "row", justifyContent: "space-between" },
  sendBtn: {
    flex: 1,
    backgroundColor: "#10375C",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginRight: 5,
  },
  giveUpBtn: {
    flex: 1,
    backgroundColor: "#C62828",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginLeft: 5,
  },
  btnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#10375C",
    marginBottom: 10,
  },
  modalMessage: { fontSize: 16, color: "#333", textAlign: "center" },
  closeBtn: {
    backgroundColor: "#10375C",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 15,
  },
  closeBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
