import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PlayWithBotScreen({ navigation }) {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const [socket, setSocket] = useState(null);
  const [currentWord, setCurrentWord] = useState(null);
  const [usedWords, setUsedWords] = useState([]);
  const [inputWord, setInputWord] = useState("");
  const [resultModal, setResultModal] = useState(null); // lưu kết quả để hiển thị

  useEffect(() => {
    const initSocket = async () => {
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      const avatarImage = "default.png";

      const newSocket = io(API_URL, { transports: ["websocket"] });

      newSocket.on("connect", () => {
        console.log("Connected to server");
        newSocket.emit("authentication", refreshToken, avatarImage);
        newSocket.emit("play with bot");
      });

      newSocket.on("your turn", (data) => {
        setCurrentWord(data.currentWord);
        setUsedWords(data.usedWords);
      });

      newSocket.on("invalid word", () => {
        Alert.alert("Invalid word");
      });

      newSocket.on("match result", (data) => {
        setResultModal({
          title: "🏆 Kết quả",
          message: `${data.result === 1 ? "Bạn thắng 🎉" : "Bạn thua 😢"}\nĐiểm: ${data.score} (+${data.scoreD})`,
          newWords: data.newWords,
          isError: false
        });
        newSocket.disconnect();
      });

      setSocket(newSocket);
      return () => newSocket.disconnect();
    };

    initSocket();
  }, []);

  const handleSendWord = () => {
    if (currentWord) {
      if (inputWord[0] !== currentWord[currentWord.length - 1]) {
        Alert.alert("Invalid word", "The first character must match the last character of the last word!");
        return;
      }
    }
    if (usedWords.includes(inputWord.trim().toLowerCase())) {
      Alert.alert("Invalid word", "This word has already been used!");
      return;
    }
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

      {/* Modal kết quả */}
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

            {
              resultModal?.newWords.length > 0 ?
                <Text style={[styles.modalMessage, { marginBottom: 10 }]}>New words learned:</Text>
                : null
            }

            <ScrollView style={{ maxHeight: 200, width: "100%" }} persistentScrollbar={true}>
              {
                resultModal?.newWords?.map((element, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.card}
                    onPress={() => {
                      navigation.replace("MainTabs", {
                        screen: "Dictionary",
                        params: { word: element },
                      });
                    }}
                  >
                    <Text style={styles.word}>{element}</Text>
                  </TouchableOpacity>

                ))
              }
            </ScrollView>


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

  // Modal
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center"
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    elevation: 5,
  },
  modalTitle: { fontSize: 22, fontWeight: "bold", color: "#10375C", marginBottom: 10 },
  modalMessage: { fontSize: 16, color: "#333", textAlign: "center", marginBottom: 20 },
  closeBtn: {
    backgroundColor: "#10375C",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 15,
  },
  closeBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  card: {
    backgroundColor: "#F4F6FF",
    borderRadius: 12,
    padding: 10,
    marginVertical: 8,
    elevation: 3,
  },
  word: {
    fontSize: 15,
    fontFamily: "Bungee",
    color: "#EB8317",
  },
});
