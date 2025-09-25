import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TextInput, TouchableOpacity, FlatList, SafeAreaView, ActivityIndicator } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Audio } from "expo-av";

const Dictionary = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [wordDetail, setWordDetail] = useState(null); // State để lưu thông tin chi tiết của từ
    const [pronunciation, setPronunciation] = useState(null);
    const [explanation, setExplanation] = useState(null);

    //Load lại dữ liệu
    useFocusEffect(
        useCallback(() => {
            console.log('DictionaryScreen được focus, load lại dữ liệu');
        }, [])
    );

    const navigation = useNavigation();
    const API_URL = process.env.EXPO_PUBLIC_API_URL;

    // Dùng useRef để lưu timer ID cho debounce, tránh re-render
    const debounceTimerRef = useRef(null);

    // Hàm gọi API lấy gợi ý từ, đã được cải tiến
    const getWordSuggestions = useCallback(async (query) => {
        if (query.trim().length < 1) {
            setSuggestions([]);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/word/getWordSuggestions?qWord=${encodeURIComponent(query)}`);
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
            const res = await fetch(`${API_URL}/word/getWordInformation?word=${encodeURIComponent(word)}`);
            if (res.ok) {
                const data = await res.json();

                // Nếu có Phonetic trong meanings thì gọi thêm 2 API
                if (data.meanings && data.meanings.length > 0 && data.meanings[0].Phonetic) {
                    const ipa = data.meanings[0].Phonetic;

                    // gọi song song 2 API
                    const [pronRes, explRes] = await Promise.all([
                        fetch(`${API_URL}/wordmeaning/getPronunciation?word=${encodeURIComponent(word)}&ipa=${encodeURIComponent(ipa)}`),
                        fetch(`${API_URL}/wordmeaning/explainPronunciation?word=${encodeURIComponent(word)}&ipa=${encodeURIComponent(ipa)}`)
                    ]);

                    if (pronRes.ok) {
                        const pronData = await pronRes.json();
                        data.pronunciation = pronData; // gắn trực tiếp vào object
                    }

                    if (explRes.ok) {
                        const explData = await explRes.json();
                        data.explanation = explData.explanation; // gắn trực tiếp vào object
                    }
                }

                setWordDetail(data);
                setSuggestions([]);
            } else {
                console.error('Lỗi server:', res.status);
                setWordDetail(null);
            }
        } catch (err) {
            console.error('Fetch lỗi:', err);
            setWordDetail(null);
        }
    };

    // Hàm phát âm thanh từ base64
    async function playPronunciation(base64Audio) {
        try {
            const sound = new Audio.Sound();
            const uri = `data:audio/mp3;base64,${base64Audio}`;
            await sound.loadAsync({ uri });
            await sound.playAsync();
        } catch (err) {
            console.error("Lỗi phát âm thanh:", err);
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
                    <Text style={{ fontFamily: 'Bungee' }}>Popularity: {wordDetail.popularity}</Text>

                    {wordDetail.pronunciation && (
                        <View style={styles.pronunciationBox}>
                            <Text style={styles.sectionTitle}>Pronunciation</Text>
                            <Text style={styles.IPAStyle}>IPA: {wordDetail.pronunciation.ipa}</Text>
                            {/* Nút play thay cho việc hiển thị base64 */}
                            <TouchableOpacity
                                style={styles.playButton}
                                onPress={() =>
                                    playPronunciation(wordDetail.pronunciation.pronunciation)
                                }
                            >
                                <Text style={styles.playButtonText}>🔊 Pronounce</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {wordDetail.explanation && (
                        <View style={styles.explanationBox}>
                            <Text style={styles.sectionTitle}>Explanation</Text>
                            <Text style={styles.sectionText}>{wordDetail.explanation}</Text>
                        </View>
                    )}

                    {wordDetail.meanings && wordDetail.meanings.map((meaning, index) => (
                        <View key={index} style={styles.meaningItem}>
                            <Text style={styles.posText}>
                                {meaning["PartOfSpeech.POSName"] || "Unknown"}
                            </Text>
                            <Text style={styles.meaningText}>{meaning.Definition || "No meaning available"}</Text>
                        </View>
                    ))}

                    {/* {wordDetail.meanings.map((meaning, index) => (
                        <View key={index} style={styles.meaningItem}>
                            <Text style={styles.posText}>{meaning["PartOfSpeech.POSName"]}</Text>
                            <Text style={{fontFamily:"Bungee",color:'Black'}}>{meaning.Meaning}</Text>
                        </View>
                    ))} */}
                </ScrollView>
            )}
        </SafeAreaView>
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
        fontSize: 13,
        fontFamily: 'Bungee'
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
