import AsyncStorage from "@react-native-async-storage/async-storage";

export default async function deleteLoginInformation() {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('rememberMe');
    global.expireMs = 0;
}