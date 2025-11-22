import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TextInput, TouchableOpacity, FlatList, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect, CommonActions } from '@react-navigation/native';
import { Audio } from "expo-av";
import { get, post } from '../utils/requestWrapper';
import { deletLogiInformation } from "../utils/deleteLoginInformation";

const Dictionary = ({ route }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [wordDetail, setWordDetail] = useState(null); // State để lưu thông tin chi tiết của từ
    const [pronunciation, setPronunciation] = useState([]);
    const [isBookmarked, setIsBookmarked] = useState(false);

    const navigation = useNavigation();
    const API_URL = process.env.EXPO_PUBLIC_API_URL;

    // Dùng useRef để lưu timer ID cho debounce, tránh re-render
    const debounceTimerRef = useRef(null);

    useFocusEffect(useCallback(() => {
        if (route.params && route.params.word) {
            setSuggestions([]);
            setSearchQuery(route.params.word);
            getWordInformation(route.params.word);
            route.params.word = null; // Clear param after using it
        }
        else {
            setSuggestions([]);
            setSearchQuery("");
            setWordDetail(null);
            setPronunciation([]);
            setIsBookmarked(false);

        }
    }, []));

    // Hàm gọi API lấy gợi ý từ, đã được cải tiến
    const getWordSuggestions = useCallback(async (query) => {
        if (query.trim().length < 1) {
            setSuggestions([]);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/word/getWordSuggestions?qWord=${encodeURIComponent(query)}`);
            switch (res.status) {
                case 400:
                    Alert.alert("Error", "Please enter a word.");
                    return;
                case 429:
                    Alert.alert("Error", "Too many requests, please wait and try again.");
                    return;
                case 500:
                    Alert.alert("Error", "Server error.");
                    return;
            }
            if (res.ok) {
                const data = await res.json();
                setSuggestions(data);
            } else {
                console.error('Lỗi server:', res.status);
            }
        } catch (err) {
            console.error('Fetch lỗi:', err);
        } finally {
            setLoading(false);
        }
    }, [API_URL]);

    // Hàm Debounce
    const handleSearchChange = (text) => {
        setSearchQuery(text);
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
            getWordSuggestions(text);
        }, 500); // 500ms debounce delay
    };

    // Hàm gọi API lấy thông tin chi tiết của từ
    const getWordInformation = async (word) => {
        try {
            let res = await fetch(`${API_URL}/word/getWordInformation?word=${encodeURIComponent(word)}`);
            switch (res.status) {
                case 400:
                    Alert.alert("Error", "Please enter a word.");
                    return;
                case 404:
                    Alert.alert("Error", "Word not found.");
                    setWordDetail(null);
                    return;
                case 429:
                    Alert.alert("Error", "Too many requests, please wait and try again.");
                    return;
                case 500:
                    Alert.alert("Error", "Server error.");
                    return;
            }
            if (!res.ok) {
                Alert.alert("Error", "Server error, please try again.");
                return;
            }
            const data = await res.json();

            let pronunciationTemp = [];
            data.meanings.forEach(meaning => {
                if (pronunciationTemp.indexOf(meaning.Phonetic) == -1) {
                    pronunciationTemp.push(meaning.Phonetic);
                }
            });
            setPronunciation(pronunciationTemp);

            setWordDetail(data);
            setSuggestions([]);

            res = await post("/bookmark/isBookmarked", { word: word }, 'access');
            if (!res.ok) {
                Alert.alert("Error", "Server error, please try again.");
                return;
            }
            switch (res.status) {
                case 400:
                    Alert.alert("Error", "Bad request");
                    return;
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

            const isBookmarkedTemp = await res.json();
            setIsBookmarked(isBookmarkedTemp.bookmarked);
        } catch (err) {
            console.error('Fetch lỗi:', err);
            setWordDetail(null);
        }
    };

    async function pronounce(ipa) {
        try {
            const pronRes = await get("/wordmeaning/getPronunciation", { word: wordDetail.word, ipa: ipa });
            switch (pronRes.status) {
                case 400:
                    Alert.alert("Error", "Bad request");
                    return;
                case 404:
                    Alert.alert("Error", "Pronunciation not found");
                    return;
                case 429:
                    Alert.alert("Error", "Too many requests, please wait and try again.");
                    return;
                case 500:
                    Alert.alert("Error", "Server error.");
                    return;
            }
            if (!pronRes.ok) {
                Alert.alert("Error", "Server error, please try again.");
                return;
            }

            const pronData = await pronRes.json();

            const sound = new Audio.Sound();
            const uri = `data:audio/mp3;base64,${pronData.pronunciation}`;
            await sound.loadAsync({ uri });
            await sound.playAsync();
        } catch (error) {
            Alert.alert("Error", "Cannot connect to server.");
        }
    }

    async function getExplaination(ipa) {
        try {
            const expRes = await get("/wordmeaning/explainPronunciation", { word: wordDetail.word, ipa: ipa });
            switch (expRes.status) {
                case 400:
                    Alert.alert("Error", "Bad request");
                    return;
                case 404:
                    Alert.alert("Error", "Explain not found");
                    return;
                case 429:
                    Alert.alert("Error", "Too many requests, please wait and try again.");
                    return;
                case 500:
                    Alert.alert("Error", "Server error.");
                    return;
            }
            if (!expRes.ok) {
                Alert.alert("Error", "Server error, please try again.");
                return;
            }

            const expData = await expRes.json();
            Alert.alert("Explanation", expData.explanation.replaceAll("**", ""));
        } catch (error) {
            Alert.alert("Error", "Cannot connect to server.");
        }
    }

    async function handleBookmark() {
        try {
            let res = await post("/bookmark/" + (isBookmarked ? "deleteBookmark" : "newBookmark"), { word: wordDetail.word }, 'access');
            switch (res.status) {
                case 400:
                    Alert.alert("Error", "Bad request");
                    return;
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
                case 404:
                    Alert.alert("Error", "Bookmark not found");
                    return;
                case 409:
                    Alert.alert("Error", "Bookmark existed");
                    return;
                case 429:
                    Alert.alert("Error", "Too many requests, please wait and try again.");
                    return;
                case 500:
                    Alert.alert("Error", "Server error.");
                    return;
            }
            setIsBookmarked(!isBookmarked);

        } catch (error) {
            Alert.alert("Error", "Cannot connect to server.");
            return;
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleGroup}>
                    {/* <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <FontAwesome5 name="chevron-circle-left" size={30} color="#10375C" />
                    </TouchableOpacity> */}
                    <Text style={styles.title}>DICTIONARY</Text>
                </View>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchBox}>
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <FontAwesome5 name="search" size={20} color="#999" style={styles.searchIcon} />
                    </View>
                    <View style={{ flex: 9 }}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="SEARCH FOR WORD..."
                            placeholderTextColor="#999"
                            value={searchQuery}
                            onChangeText={handleSearchChange} // Sửa tại đây
                        />
                    </View>
                </View>
            </View>

            <View style={styles.listWrapper}>
                {loading && searchQuery.length > 0 ? (
                    <ActivityIndicator size="large" color="#10375C" style={{ marginTop: 20 }} />
                ) : (
                    <FlatList
                        data={suggestions}
                        keyExtractor={(item, index) => item.WordV.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.suggestionItem}
                                onPress={() => {
                                    setSuggestions([]);
                                    setSearchQuery(item.WordV); // Cập nhật ô tìm kiếm với từ đã chọn
                                    getWordInformation(item.WordV); // Lấy thông tin chi tiết
                                }}
                            >
                                <Text style={styles.suggestionText}>{item.WordV}</Text>
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={styles.listContainer}
                        keyboardShouldPersistTaps="handled"
                    />
                )}
            </View>

            {/* Hiển thị thông tin chi tiết của từ nếu có */}
            {wordDetail && (
                <ScrollView style={styles.detailContainer}>
                    <Text style={styles.detailTitle}>{wordDetail.word}</Text>
                    <View style={{ flexDirection: 'row' }}>
                        <Text style={{ fontFamily: 'Bungee', flex: 1 }}>Popularity: {wordDetail.popularity}</Text>
                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                            <TouchableOpacity onPress={handleBookmark}>
                                {isBookmarked ? (
                                    <Ionicons name="bookmark" size={40} color="#F3C623" style={{ marginRight: 3 }} />
                                ) : (
                                    <Ionicons name="bookmark-outline" size={40} color="#F3C623" style={{ marginRight: 3 }} />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.pronunciationBox}>
                        <Text style={styles.sectionTitle}>Pronunciation</Text>
                        {
                            pronunciation.map((item, index) => (
                                <View key={index} style={{ marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', columnGap: 10 }}>
                                    <View style={{ flex: 3 }}>
                                        <Text style={styles.IPAStyle}>{item}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <TouchableOpacity style={styles.playButton} onPress={() => pronounce(item)}>
                                            <Text style={styles.playButtonText}>🔊</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <TouchableOpacity style={styles.playButton} onPress={() => getExplaination(item)}>
                                            <Text style={styles.playButtonText}>?</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        }
                    </View>

                    {wordDetail.meanings && wordDetail.meanings.map((meaning, index) => (
                        <View key={index} style={styles.meaningItem}>
                            <View style={{ flexDirection: "row", alignItems: 'center', columnGap: 10 }}>
                                <Text style={[styles.posText, { flex: 1 }]}>
                                    {meaning["PartOfSpeech.POSName"] || "Unknown"}
                                </Text>
                                <Text style={{ flex: 1, justifyContent: "flex-end", textAlign: "right", fontSize: 16 }}>{meaning.Phonetic}</Text>
                            </View>
                            <Text style={styles.meaningText}>{meaning.Definition || "No meaning available"}</Text>
                            <Text style={[styles.meaningText, { fontWeight: "bold", fontSize: 13 }]}>{meaning.Example || "No example available"}</Text>
                        </View>
                    ))}
                </ScrollView>
            )
            }
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#ffff',
        padding: 20,
        justifyContent: 'flex-start',
        flex: 1
    },
    header: {
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    titleGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginHorizontal: 10,
    },

    headerRightGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginLeft: 20,
    },

    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F4F6FF',
        borderRadius: 20,
        padding: 12,
        marginVertical: 5,
        height: 70
    },
    suggestionText: {
        fontSize: 18,
        color: '#333',
        fontFamily: "Bungee"
    },
    searchContainer: {
        marginTop: 15,
        width: '100%',
    },
    backButton: {
        padding: 5,
        marginRight: 10,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        height: 60,
        elevation: 3,
        marginTop: -10
    },

    searchIcon: {
    },

    searchInput: {
        marginBottom: -5,
        fontSize: 16,
        color: '#333',
        fontFamily: 'Bungee'
    },

    title: {
        fontFamily: 'Bungee',
        fontSize: 32,
        color: '#10375c',
    },
    listContainer: {
        padding: 20,
    },
    userBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F4F6FF',
        borderRadius: 20,
        padding: 12,
        marginVertical: 5,
        height: 70
    },
    listContainer: {
        paddingBottom: 20,
        paddingTop: 10,
    },
    detailContainer: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 10,
        elevation: 3,
        borderTopWidth: 5,
        borderTopColor: '#10375C'
    },
    detailTitle: {
        fontSize: 22,
        fontFamily: 'Bungee',
        color: "#10375C",
        textAlign: "center",
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'Bungee',
        color: "#10375C",
        marginBottom: 6,
    },
    sectionText: {
        fontSize: 11,
        fontFamily: 'Bungee',
    },
    IPAStyle: {
        fontSize: 18,
        fontWeight: "bold"
    },
    pronunciationBox: {
        marginTop: 12,
        padding: 10,
        backgroundColor: "#E8F0FE",
        borderRadius: 10,
    },
    playButton: {
        marginTop: 10,
        padding: 10,
        backgroundColor: "#10375C",
        borderRadius: 8,
        alignItems: "center",
    },
    playButtonText: {
        color: "#fff",
        fontWeight: "bold",
    },
    explanationBox: {
        marginTop: 12,
        padding: 10,
        backgroundColor: "#FFF3CD",
        borderRadius: 10,
    },
    meaningItem: {
        marginTop: 10,
        padding: 10,
        backgroundColor: "#F9F9F9",
        borderRadius: 10,
        borderLeftWidth: 4,
        borderLeftColor: "#10375C",
    },
    posText: {
        fontSize: 15,
        fontFamily: 'Bungee',
        color: "#2980B9",
        marginBottom: 4,
    },
    meaningText: {
        fontFamily: 'Bungee',
        fontSize: 10,
    },
});


export default Dictionary;
