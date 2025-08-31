import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';


export default function HomeScreen() {
    const navigation = useNavigation();
    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>WORDLINK</Text>
                <Image
                    source={require('../assets/oggy.jpg')} // Thay bằng ảnh avatar của bạn
                    style={styles.avatar}
                />
            </View>

            <Text style={styles.greeting}>HI OGGY, HOW ARE YOU TODAY? 👋</Text>

            {/* Rank and Point */}
            <View style={styles.rankBox}>
                {/* RANK */}
                <View style={styles.rankItem}>
                    <FontAwesome5 name="crown" size={24} color="#F3C623" style={styles.rankIcon} />
                    <View style={styles.rankTextGroup}>
                        <Text style={styles.rankLabel}>RANK</Text>
                        <Text style={styles.rankValue}>200/1000</Text>
                    </View>
                </View>

                {/* POINT */}
                <View style={styles.rankItem}>
                    <FontAwesome5 name="award" size={24} color="#F3C623" style={styles.rankIcon} />
                    <View style={styles.rankTextGroup}>
                        <Text style={styles.rankLabel}>POINT</Text>
                        <Text style={styles.rankValue}>100000</Text>
                    </View>
                </View>
            </View>

            {/* Menu */}
            <Text style={styles.playTitle}>LET’S PLAY</Text>

            <TouchableOpacity style={styles.menuButton}>
                <FontAwesome5 name="chalkboard-teacher" size={22} color="#F3C623" />
                <Text style={styles.menuText}>TRAINING MODE</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuButton}>
                <FontAwesome5 name="crosshairs" size={25} color="#F3C623" />
                <Text style={styles.menuText}>MULTIPLAYER</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuButton}>
                <MaterialIcons name="book" size={25} color="#F3C623" />
                <Text style={styles.menuText}>DICTIONARY</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuButton}>
                <Ionicons name="people" size={25} color="#F3C623" />
                <Text style={styles.menuText}>FRIENDS</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuButton}>
                <Ionicons name="settings" size={25} color="#F3C623" />
                <Text style={styles.menuText}>OPTIONS</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('Leaderboard')}>
                <FontAwesome5 name="trophy" size={20} color="#F3C623" />
                <Text style={styles.menuText}>LEADERBOARD</Text>
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
