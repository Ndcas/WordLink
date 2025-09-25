import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TextInput, TouchableOpacity, FlatList, SafeAreaView, ActivityIndicator } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const LeaderboardScreen = () => {
    const navigation = useNavigation();
    const [allData, setAllData] = useState([]); // toàn bộ dữ liệu từ backend
    const [visibleData, setVisibleData] = useState([]); // dữ liệu hiển thị theo trang
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const limit = 6; // mỗi trang hiển thị 10 user

    const totalPages = Math.ceil(allData.length / limit);

    const API_URL=process.env.EXPO_PUBLIC_API_URL;;

    async function getLeaderboard() {
        try {
            let res = await fetch(API_URL + "/account/getLeaderboard");
            if (res.ok) {
                let data = await res.json();
                setAllData(data);
                setVisibleData(data.slice(0, limit)); 
            } else {
                console.error("Lỗi server:", res.status);
            }
        } catch (err) {
            console.error("Fetch lỗi:", err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getLeaderboard();
    }, []);

    // cập nhật data hiển thị mỗi khi đổi trang hoặc search
    useEffect(() => {
        let filtered = allData;
        if (searchQuery.trim() !== "") {
            filtered = allData.filter((item) =>
                item.Username.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        const start = (currentPage - 1) * limit;
        const end = start + limit;
        setVisibleData(filtered.slice(start, end));
    }, [allData, currentPage, searchQuery]);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color="#10375C" />
            </View>
        );
    }


    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleGroup}>
                    {/* <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <FontAwesome5 name="chevron-circle-left" size={30} color="#10375C" />
                    </TouchableOpacity> */}
                    <Text style={styles.title}>LEADERBOARD</Text>
                </View>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchBox}>
                    <View style={{flex:1,alignItems:'center',justifyContent:'center'}}>
                    <FontAwesome5 name="search" size={20} color="#999" style={styles.searchIcon} />
                    </View>
                    <View style={{flex:9}}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="SEARCH FOR PLAYER..."
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    </View>
                </View>
            </View>

            <View style={styles.listWrapper}>
                <FlatList
                    data={visibleData}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.userBox}>
                            <Text style={styles.rank}>#{item.Rank}</Text>
                            {/* <Image source={item.avatar} style={styles.avatar} /> */}
                            <View style={styles.userInfo}>
                                <Text style={styles.name}>{item.Username}</Text>
                                <Text style={styles.points}>{item.Score} pts</Text>
                            </View>
                        </View>
                    )}
                    contentContainerStyle={styles.listContainer}
                />

                {/* Pagination Controls */}
                <View style={styles.pagination}>
                    {/* Previous */}
                    <TouchableOpacity
                        style={[styles.chevronBtn, currentPage === 1 && styles.disabled]}
                        onPress={() => setCurrentPage(p => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        <FontAwesome5 name="chevron-left" size={22} color="#fff" />
                    </TouchableOpacity>

                    {/* Page info */}
                    <View style={styles.pageBox}>
                        <Text style={styles.pageNumber}>{currentPage}</Text>
                        <Text style={styles.pageSlash}>/</Text>
                        <Text style={styles.pageTotal}>{totalPages}</Text>
                    </View>

                    {/* Next */}
                    <TouchableOpacity
                        style={[styles.chevronBtn, currentPage === totalPages && styles.disabled]}
                        onPress={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    >
                        <FontAwesome5 name="chevron-right" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
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

    headerRightGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginLeft: 20,
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
        marginTop:-10
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
    listWrapper: {
        // backgroundColor:'white',
        // borderRadius:20,
        // borderLeftWidth:3,
        // borderTopColor:'#10375C',
        // borderTopWidth:3,
        // borderRightWidth:3,
        // borderLeftColor:'#F3C623',
        // borderRightColor: '#F3C623',
        // marginTop:20,
        // paddingHorizontal: 5
    },
    rank: {
        fontFamily: 'Bungee',
        fontSize: 16,
        color: '#F3C623',
        width: 40,
        textAlign: 'center',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginHorizontal: 10,
    },
    userInfo: {
        justifyContent: 'center',
    },
    name: {
        fontFamily: 'Bungee',
        fontSize: 16,
        color: '#10375C',
        marginTop: 17
    },
    points: {
        fontSize: 14,
        color: '#EB8317',
        fontFamily: 'Bungee',

    },

    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 18,
        gap: 14,
    },

    chevronBtn: {
        backgroundColor: '#10375C',
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
    },

    pageBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingHorizontal: 22,
        paddingVertical: 8,
        borderRadius: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },

    pageNumber: {
        fontFamily: 'Bungee',
        fontSize: 16,
        color: '#10375C',
    },

    pageSlash: {
        fontFamily: 'Bungee',
        fontSize: 16,
        color: '#10375C',
        marginHorizontal: 4,
    },

    pageTotal: {
        fontFamily: 'Bungee',
        fontSize: 16,
        color: '#888',
    },

    disabled: {
        opacity: 0.4,
    },

});


export default LeaderboardScreen;
