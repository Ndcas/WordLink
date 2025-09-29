import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, ScrollView } from "react-native";
import { get, post } from '../utils/requestWrapper';
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { useNavigation } from '@react-navigation/native';


export default function BookmarkScreen() {
    const [bookmarks, setBookmarks] = useState([]);
    const navigation = useNavigation();

    useFocusEffect(useCallback(() => {
        (async () => {
            await getBookmarks();
        })();
    }, []));

    async function getBookmarks() {
        try {
            let res = await get("/bookmark/getBookmarks", {}, 'access');
            switch (res.status) {
                case 401:
                    Alert.alert("Error", "Unauthorized, please log in again.");
                    await deletLogiInformation();
                    navigation.dispatch(
                        CommonActions.reset({
                            index: 0,
                            routes: [
                                { name: 'LoginScreen' },
                            ],
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
            return;
        }
    }

    console.log(bookmarks);


    return (
        <ScrollView style={{}}>
            {
                bookmarks.map((element, index) => (
                    <View key={index} style={{ flex: 1, flexDirection: 'row', marginTop: 20 }}>
                        <View style={{ flex: 1, justifyContent: "center" }}>
                            <TouchableOpacity onPress={() => {
                                navigation.navigate("MainTabs", { screen: "Dictionary", params: { word: element.WordV } });
                             }}>
                                <Text style={{ marginLeft: "15%" }}>{element.WordV}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))
            }
        </ScrollView>

    );
}