import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';

export default function HomeScreen() {

    const navigation = useNavigation();
    const [username, setUsername] = useState("Guest");
    const [avatar, setAvatar] = useState();
    const [score, setScore] = useState(0);
    const [rank, setRank] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUserInfo = async () => {
            try {
                const accessToken = await AsyncStorage.getItem("accessToken");
                const storedUsername = await AsyncStorage.getItem("username");
                if (storedUsername) setUsername(storedUsername);

                if (!accessToken) {
                    setLoading(false);
                    return;
                }

                // Lấy thông tin account
                const infoUrl = `${process.env.EXPO_PUBLIC_API_URL}/account/getAccountInfo`;
                const infoRes = await fetch(infoUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (infoRes.ok) {
                    const infoData = await infoRes.json();
                    setUsername(infoData.Username || "Guest");
                    setScore(infoData.Score || 0);
                    if (infoData.AvatarImage) setAvatar({ uri: infoData.AvatarImage });
                }

                // Lấy xếp hạng
                const rankUrl = `${process.env.EXPO_PUBLIC_API_URL}/account/getAccountRank`;
                const rankRes = await fetch(rankUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (rankRes.ok) {
                    const rankData = await rankRes.json();
                    setRank(rankData.rank || null);
                }
            } catch (err) {
                console.error("Lỗi lấy thông tin hoặc xếp hạng tài khoản:", err);
            } finally {
                setLoading(false);
            }
        };
        loadUserInfo();
    }, []);

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
                    <Image source={avatar} style={styles.avatar} />
                </TouchableOpacity>
            </View>

            <Text style={styles.greeting}>HI {username.toUpperCase()}, HOW ARE YOU TODAY?</Text>

            {/* Rank and Point */}
            <View style={styles.rankBox}>
                {/* RANK */}
                <View style={styles.rankItem}>
                    <FontAwesome5 name="crown" size={24} color="#F3C623" style={styles.rankIcon} />
                    <View style={styles.rankTextGroup}>
                        <Text style={styles.rankLabel}>RANK</Text>
                        <Text style={styles.rankValue}>{rank !== null ? rank : '-'}</Text>
                    </View>
                </View>

                {/* POINT */}
                <View style={styles.rankItem}>
                    <FontAwesome5 name="award" size={24} color="#F3C623" style={styles.rankIcon} />
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
            {/* Leaderboards */}
            {/* <Text style={styles.leaderboardsTitle}>LEADERBOARDS</Text>
      <View style={styles.leaderboards}>
        <View style={styles.podium}>
          <Image source={require('./assets/oggy.png')} style={styles.podiumAvatar} />
          <Text style={styles.podiumRank}>2</Text>
        </View>
        <View style={styles.podium}>
          <Image source={require('./assets/oggy.png')} style={styles.podiumAvatar} />
          <Text style={styles.podiumRank}>1</Text>
        </View>
        <View style={styles.podium}>
          <Image source={require('./assets/oggy.png')} style={styles.podiumAvatar} />
          <Text style={styles.podiumRank}>3</Text>
        </View>
      </View> */}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#fffff',
        justifyContent: 'center'
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
});
