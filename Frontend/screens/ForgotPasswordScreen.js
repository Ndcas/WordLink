import React, { useState } from 'react';
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
import { post } from '../utils/requestWrapper';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL;

const ForgotPasswordScreen = ({ navigation }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [re_password, setRePassword] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);

    // Gửi OTP
    const handleGetOTP = async () => {
        if (!email.trim()) {
            Alert.alert("Error", "Please enter your email");
            return;
        }
        try {
            let res = await post('/account/getOTPResetPassword', { email: email.trim() });

            switch (res.status) {
                case 400:
                    Alert.alert("Error", "Invalid email.");
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
                Alert.alert("Succcess", "OTP has been sent to your email");
                setOtpSent(true);
            } else {
                Alert.alert("Error", data.error || "Can't send OTP");
            }
        } catch (err) {
            Alert.alert("Error", "Can't connect to server");
        }
    };

    // Đăng ký + login
    const handleResetPassword = async () => {
        if (!password || !re_password || !email || !otp) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        if (password.trim() != re_password.trim()) {
            Alert.alert("Error", "Re-password does not match!");
            return;
        }

        try {
            // Gọi signUp
            let res = await post('/account/resetPassword', {
                email: email.trim(),
                newPassword: password.trim(),
                otp: otp.trim(),
            });

            switch (res.status) {
                case 400:
                    Alert.alert("Error", "Invalid credenntials.");
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
                Alert.alert("Success", "Reset password successful");
                navigation.replace("LoginScreen");
                return;
            }

            if (!res.ok) {
                Alert.alert("Error", data.message || "Reset password failed");
                return;
            }
        } catch (err) {
            Alert.alert("Error", "Can't connect to server");
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.logo}>Wordlink</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#aaa"
                    value={email}
                    onChangeText={setEmail}
                />

                <TouchableOpacity style={styles.button} onPress={handleGetOTP}>
                    <Text style={styles.buttonText}>SEND OTP</Text>
                </TouchableOpacity>

                {otpSent && (
                    <>
                        <TextInput
                            style={styles.input}
                            placeholder="OTP"
                            placeholderTextColor="#aaa"
                            value={otp}
                            onChangeText={setOtp}
                            keyboardType="numeric"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#aaa"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Re-enter password"
                            placeholderTextColor="#aaa"
                            secureTextEntry
                            value={re_password}
                            onChangeText={setRePassword}
                        />


                        <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
                            <Text style={styles.buttonText}>RESET PASSWORD</Text>
                        </TouchableOpacity>
                    </>
                )}
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

export default ForgotPasswordScreen;
