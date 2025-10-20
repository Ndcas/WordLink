import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import io from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function PlayWithBotScreen({ navigation }) {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const [socket, setSocket] = useState(null);
  const [currentWord, setCurrentWord] = useState(null);
  const [usedWords, setUsedWords] = useState([]);
  const [inputWord, setInputWord] = useState("");
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [timer, setTimer] = useState(30);
  const timerRef = useRef(null);
  const [resultModal, setResultModal] = useState(null);

  useEffect(() => {
    const initSocket = async () => {
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      const avatarImage = await AsyncStorage.getItem("avatarImage");
      if (avatarImage) setPlayerAvatar(avatarImage);

      const newSocket = io(API_URL, { transports: ["websocket"] });

      newSocket.on("connect", () => {
        newSocket.emit("authentication", refreshToken, avatarImage || "default.png");
        newSocket.emit("play with bot");
      });

      // 🟢 Khi đến lượt người chơi
      newSocket.on("your turn", (data) => {
        setIsMyTurn(true);
        setCurrentWord(data.currentWord);
        setUsedWords(data.usedWords);
        resetTimer();
      });

      // 🔵 Khi bot phản hồi
      newSocket.on("bot turn", (data) => {
        setIsMyTurn(false);
        setCurrentWord(data.currentWord);
        setUsedWords(data.usedWords);
        stopTimer();
      });

      newSocket.on("invalid word", () => {
        Alert.alert("❌ Invalid word!");
      });

      newSocket.on("match result", (data) => {
        stopTimer();
        setResultModal({
          title: "🏆 Result",
          message: `${data.result === 1 ? "You've won 🎉" : "You've lost 😢"}\Point: ${
            data.score
          } (+${data.scoreD})`,
          newWords: data.newWords,
        });
        newSocket.disconnect();
      });

      setSocket(newSocket);
      return () => newSocket.disconnect();
    };

    initSocket();
  }, []);

  // ⏰ Quản lý timer
  function resetTimer() {
    clearInterval(timerRef.current);
    setTimer(30);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (socket && isMyTurn) socket.emit("bot win");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerRef.current);
  }

  // 📝 Gửi từ
  const handleSendWord = () => {
    if (!inputWord.trim() || !socket) return;

    if (currentWord && inputWord[0] !== currentWord[currentWord.length - 1]) {
      Alert.alert("❌ Invalid word", "The first character must match the last character of the last word!");
      return;
    }

    if (usedWords.includes(inputWord.trim().toLowerCase())) {
      Alert.alert("❌ Used word!");
      return;
    }

    socket.emit("send word to bot", inputWord.trim());
    setInputWord("");
    setIsMyTurn(false);
    stopTimer();
  };

  // 🛑 Người chơi đầu hàng
  const handleBotWin = () => {
    if (socket) socket.emit("bot win");
    stopTimer();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 🔹 Header */}
      <View style={styles.header}>
        <View style={styles.timerBox}>
          <Text style={styles.timerText}>{timer}s</Text>
        </View>
      </View>

      {/* 🔹 Danh sách từ (bong bóng chat) */}
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

      {/* 🔹 Ô nhập từ */}
      <TextInput
        style={styles.input}
        placeholder="Enter your word..."
        value={inputWord}
        onChangeText={setInputWord}
        editable={isMyTurn}
      />

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.sendBtn, !isMyTurn && { opacity: 0.5 }]}
          onPress={handleSendWord}
          disabled={!isMyTurn}
        >
          <Text style={styles.btnText}>SEND</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.giveUpBtn} onPress={handleBotWin}>
          <Text style={styles.btnText}>GIVE UP</Text>
        </TouchableOpacity>
      </View>

      {/* 🔹 Modal kết quả */}
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

            {resultModal?.newWords.length > 0 && (
              <>
                <Text style={[styles.modalMessage, { marginBottom: 10 }]}>
                  📚 New word learned:
                </Text>
                <ScrollView style={{ maxHeight: 200, width: "100%" }} persistentScrollbar={true}>
                  {resultModal?.newWords.map((element, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.card}
                      onPress={() => {
                        setResultModal(null);
                        navigation.replace("MainTabs", {
                          screen: "Dictionary",
                          params: { word: element },
                        });
                      }}
                    >
                      <Text style={styles.word}>{element}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 15 },
  header: {
    flexDirection: "row",
    justifyContent: "center",
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
    alignItems: "center",
    justifyContent: "center"
  },
  timerText: { color: "#fff", fontWeight: "bold", fontSize: 18, textAlign: "center" },
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
  card: {
    backgroundColor: "#F4F6FF",
    borderRadius: 12,
    padding: 10,
    marginVertical: 8,
  },
  word: { fontSize: 15, fontFamily: "Bungee", color: "#EB8317" },
});
