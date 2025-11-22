import React, { useState } from 'react';
import checkAndRefreshAccessToken from '../utils/checkAndRefreshAccessToken';
import {
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Alert,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { post } from '../utils/requestWrapper';
import { CommonActions } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL;

const SignUpScreen = ({ navigation }) => {
    const [old_password, setOldPassword] = useState("");
    const [new_password, setNewPassword] = useState("");
    const [re_password, setRePassword] = useState("");

    // Đăng ký + login
    const handleChangePassword = async () => {
        if (!old_password || !new_password || !re_password) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        if (new_password.trim() != re_password.trim()) {
            Alert.alert("Error", "Re-password does not match!");
            return;
        }

        try {
            // Gọi chanePassword
            let res = await post('/account/changePassword', { oldPassword: old_password.trim(), newPassword: new_password.trim() }, 'access');

            switch (res.status) {
                case 400:
                    Alert.alert("Error", "Bad request.");
                    return;
                case 401:
                    Alert.alert("Error", "Unauthorized, please log in again.");
                    navigation.dispatch(
                        CommonActions.reset({
                            index: 0,
                            routes: [{ name: "LoginScreen" }],
                        })
                    );
                    return;
                case 404:
                    Alert.alert("Error", "Account not found.");
                    return;
                case 429:
                    Alert.alert("Error", "Too many requests, please wait and try again.");
                    return;
                case 500:
                    Alert.alert("Error", "Server error.");
                    return;
            }

            const data = await res.json();

            if (res.ok) {
                Alert.alert("Success", "Password changed successfully!");
                navigation.goBack();
                return;
            }

            if (!res.ok) {
                Alert.alert("Error", data.error || "Change password failed");
                return;
            }
        } catch (err) {
            Alert.alert("Error", err);
            await AsyncStorage.removeItem('accessToken');
            await AsyncStorage.removeItem('username');
            await AsyncStorage.removeItem('refreshToken');
            navigation.replace('LoginScreen');
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.logo}>Change password</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Old password"
                    placeholderTextColor="#aaa"
                    secureTextEntry
                    value={old_password}
                    onChangeText={setOldPassword}
                    keyboardType="numeric"
                />
                <TextInput
                    style={styles.input}
                    placeholder="New password"
                    placeholderTextColor="#aaa"
                    secureTextEntry
                    value={new_password}
                    onChangeText={setNewPassword}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Re-enter new password"
                    placeholderTextColor="#aaa"
                    secureTextEntry
                    value={re_password}
                    onChangeText={setRePassword}
                />

                <TouchableOpacity style={styles.button} onPress={handleChangePassword}>
                    <Text style={styles.buttonText}>CHANGE PASSWORD</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#E6EAF5",
    },
    container: {
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    logo: {
        fontSize: width > 768 ? 60 : 40,
        fontWeight: "bold",
        color: "#FFB300",
        marginBottom: 40,
    },
    input: {
        width: "100%",
        maxWidth: 400,
        padding: 15,
        borderRadius: 10,
        backgroundColor: "#fff",
        marginBottom: 15,
        fontSize: 16,
    },
    button: {
        backgroundColor: "#6A5ACD",
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 10,
        marginBottom: 15,
    },
    buttonText: {
        color: "white",
        fontSize: 18,
        fontWeight: "bold",
    },
});

export default SignUpScreen;
