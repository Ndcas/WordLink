import React, { useCallback, useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { getAvatarImage } from '../utils/getAvatarImage';
import { get } from '../utils/requestWrapper';
import { MusicContext } from '../context/MusicContext';


export default function HomeScreen() {

    const navigation = useNavigation();
    const [username, setUsername] = useState("Guest");
    const [avatar, setAvatar] = useState();
    const [score, setScore] = useState(0);
    const [rank, setRank] = useState(null);
    const [loading, setLoading] = useState(true);

    const { sound } = useContext(MusicContext);
    const [musicStatus, setMusicStatus] = useState(false);

    const toggleMusic = async () => {
        const status = await sound.getStatusAsync();
        setMusicStatus(status.isPlaying);
        if (status.isPlaying) {
            await sound.pauseAsync();
        } else {
            await sound.playAsync();
        }
    };

    useFocusEffect(useCallback(() => {
        const loadUserInfo = async () => {
            try {
                const accessToken = await AsyncStorage.getItem("accessToken");

                if (!accessToken) {
                    setLoading(false);
                    return;
                }

                // Lấy thông tin account
                let infoRes = await get("/account/getAccountInfo", {}, 'access');
                switch (infoRes.status) {
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
                if (infoRes.ok) {
                    const infoData = await infoRes.json();
                    setUsername(infoData.Username || "Guest");
                    global.username = infoData.Username;
                    setScore(infoData.Score || 0);
                    if (infoData.AvatarImage) {
                        setAvatar(infoData.AvatarImage);
                        global.avatarImage = infoData.AvatarImage || "default.png";
                    }
                }

                // Lấy xếp hạng
                let rankRes = await get("/account/getAccountRank", {}, 'access');
                switch (rankRes.status) {
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
                if (rankRes.ok) {
                    const rankData = await rankRes.json();
                    setRank(rankData.rank || null);
                }
            } catch (err) {
                await AsyncStorage.removeItem('accessToken');
                await AsyncStorage.removeItem('username');
                await AsyncStorage.removeItem('refreshToken');
                navigation.replace('LoginScreen');
            } finally {
                setLoading(false);
            }
        };
        loadUserInfo();
    }, []));

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color="#10375C" style={{ marginTop: 50 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>WORDLINK</Text>
                <TouchableOpacity onPress={() => navigation.navigate('AccountInfoScreen')}>
                    <Image source={getAvatarImage(avatar)} style={styles.avatar} />
                </TouchableOpacity>
            </View>

            <Text style={styles.greeting}>HI {username.toUpperCase()}, HOW ARE YOU TODAY?</Text>

            {/* Rank and Point */}
            <View style={styles.rankBox}>
                {/* RANK */}
                <View style={styles.rankItem}>
                    <FontAwesome5 name="crown" size={33} color="#F3C623" style={[styles.rankIcon]} />
                    <View style={styles.rankTextGroup}>
                        <Text style={[styles.rankLabel,]}>RANK</Text>
                        <Text style={[styles.rankValue,]}>{rank !== null ? rank : '-'}</Text>
                    </View>
                </View>

                {/* POINT */}
                <View style={styles.rankItem}>
                    <FontAwesome5 name="award" size={33} color="#F3C623" style={styles.rankIcon} />
                    <View style={styles.rankTextGroup}>
                        <Text style={styles.rankLabel}>POINT</Text>
                        <Text style={styles.rankValue}>{score}</Text>
                    </View>
                </View>
            </View>

            {/* Menu */}
            <Text style={styles.playTitle}>LET’S PLAY</Text>

            <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('PlayWithBotScreen')}>
                <FontAwesome5 name="chalkboard-teacher" size={22} color="#F3C623" />
                <Text style={styles.menuText}>TRAINING MODE</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('MultiplayerScreen')}>
                <FontAwesome5 name="crosshairs" size={25} color="#F3C623" />
                <Text style={styles.menuText}>MULTIPLAYER</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => toggleMusic()} style={styles.musicButton}>
                {
                    !musicStatus ?
                        <FontAwesome5 name="volume-up" size={28} color="#fff" />
                        :
                        <FontAwesome5 name="volume-mute" size={28} color="#fff" />
                }
            </TouchableOpacity>
        </SafeAreaView>

    );
}

const styles = StyleSheet.create({
    container: {
        height: '100%',
        padding: 20,
        backgroundColor: '#fffff',
        justifyContent: 'flex-start'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    title: {
        fontSize: 45,
        fontFamily: 'Bungee',
        color: '#10375C',

    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25
    },
    greeting: {
        fontSize: 14,
        color: '#F3C623',
        fontFamily: 'Bungee',
        marginTop: -35
    },
    rankBox: {
        backgroundColor: '#fff',
        padding: 15,
        height: 90,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },

    rankItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    rankIcon: {
        marginRight: 10,
    },

    rankTextGroup: {
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 16,
    },

    rankLabel: {
        fontSize: 14,
        color: '#10375C',
        fontFamily: 'Bungee',
    },

    rankValue: {
        fontSize: 16,
        color: '#EB8317',
        fontFamily: 'Bungee',
    },

    playTitle: {
        fontSize: 18,
        fontFamily: 'Bungee',
        color: '#F3C623',
        marginTop: 20
    },
    menuButton: {
        backgroundColor: '#F4F6FF',
        // paddingVertical: 20,
        height: 70,
        width: "100%",
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 5,
        borderWidth: 1,
        borderColor: '#10375C',
    },
    menuText: {
        marginLeft: 10,
        fontFamily: 'Bungee',
        fontSize: 16,
        color: '#002f6c',
        textAlign: 'center',
    },
    leaderboardsTitle: {
        fontSize: 16,
        fontFamily: 'Bungee',
        textAlign: 'center',
        marginTop: 30
    },
    musicButton: {
        position: 'absolute',
        bottom: 20,        // cách mép dưới 20px
        left: 20,          // cách mép trái 20px
        backgroundColor: '#10375C',
        padding: 12,
        borderRadius: 30,
        elevation: 6,      // bóng trên Android
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
});
