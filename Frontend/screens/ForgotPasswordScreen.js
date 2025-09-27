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
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL;

const SignUpScreen = ({ navigation }) => {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [re_password, setRePassword] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);

    // Gửi OTP
    const handleGetOTP = async () => {
        if (!email.trim()) {
            Alert.alert("Lỗi", "Vui lòng nhập email");
            return;
        }
        try {
            const res = await fetch(`${API_URL}/account/getOTPResetPassword`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim() }), // Backend yêu cầu "Email"
            });
            const data = await res.json();
            if (res.ok) {
                Alert.alert("Thành công", "OTP đã được gửi về email");
                setOtpSent(true);
            } else {
                Alert.alert("Lỗi", data.error || "Không thể gửi OTP");
            }
        } catch (err) {
            Alert.alert("Lỗi", "Không thể kết nối server");
        }
    };

    // Đăng ký + login
    const handleResetPassword = async () => {
        if (!password || !re_password || !email || !otp) {
            Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
            return;
        }

        if(password.trim() != re_password.trim()){
            Alert.alert("Lỗi", "Xác nhận mật khẩu không khớp!");
            return;
        }

        try {
            // Gọi signUp
            const res = await fetch(`${API_URL}/account/resetPassword`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email.trim(),
                    newPassword: password.trim(),
                    otp: otp.trim(),
                }),
            });
            const data = await res.json();

            if (res.ok) {
                Alert.alert("Cài lại mật khẩu thành công");
                navigation.replace("LoginScreen");
                return;
            }

            if (!res.ok) {
                Alert.alert("Lỗi", data.message || "Cài lại mật khẩu thất bại");
                return;
            }
        } catch (err) {
            Alert.alert("Lỗi", "Không thể kết nối server");
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
                    <Text style={styles.buttonText}>LẤY OTP</Text>
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
                            placeholder="Mật khẩu"
                            placeholderTextColor="#aaa"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Xác nhận mật khẩu"
                            placeholderTextColor="#aaa"
                            secureTextEntry
                            value={re_password}
                            onChangeText={setRePassword}
                        />


                        <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
                            <Text style={styles.buttonText}>CÀI LẠI MẬT KHẨU</Text>
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

export default SignUpScreen;
