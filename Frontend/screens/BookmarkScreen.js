import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  TouchableOpacity, 
  ScrollView 
} from "react-native";
import { get } from "../utils/requestWrapper";
import { useFocusEffect, CommonActions } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { useNavigation } from "@react-navigation/native";

export default function BookmarkScreen() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      (async () => {
        await getBookmarks();
      })();
    }, [])
  );

  async function getBookmarks() {
    try {
      setLoading(true);
      let res = await get("/bookmark/getBookmarks", {}, "access");
      switch (res.status) {
        case 401:
          Alert.alert("Error", "Unauthorized, please log in again.");
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: "LoginScreen" }],
            })
          );
          return;
        case 429:
          Alert.alert("Error", "Too many requests, please wait and try again.");
          return;
        case 500:
          Alert.alert("Error", "Server error.");
          return;
      }
      if (!res.ok) {
        Alert.alert("Error", "Cannot connect to server.");
        return;
      }

      let data = await res.json();
      setBookmarks(data);
    } catch (error) {
      Alert.alert("Error", "Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>BOOKMARKS</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#10375C" style={{ marginTop: 30 }} />
      ) : bookmarks.length === 0 ? (
        <Text style={styles.emptyText}>No bookmark created</Text>
      ) : (
        bookmarks.map((element, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={() => {
              navigation.navigate("MainTabs", {
                screen: "Dictionary",
                params: { word: element.WordV },
              });
            }}
          >
            <Text style={styles.word}>{element.WordV}</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  title: {
    fontFamily: "Bungee",
    fontSize: 28,
    color: "#10375C",
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#F4F6FF",
    borderRadius: 12,
    padding: 15,
    marginVertical: 8,
    elevation: 3,
  },
  word: {
    fontSize: 18,
    fontFamily: "Bungee",
    color: "#EB8317",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginTop: 30,
    fontFamily: "Bungee",
  },
});
