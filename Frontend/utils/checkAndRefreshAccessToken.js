import AsyncStorage from "@react-native-async-storage/async-storage";

export default async function checkAndRefreshAccessToken() {
    let token = await AsyncStorage.getItem('accessToken');
    if (!token) {
        throw new Error('Không có access token');
    }
    let expireTime = global.expireMs || 0;
    if (Date.now() >= expireTime - 5000) {
        let refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
            throw new Error('Không có refresh token');
        }
        let apiUrl = `${process.env.EXPO_PUBLIC_API_URL}/account/refreshAccessToken`;
        let response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${refreshToken}`
            }
        });
        if (response.ok) {
            let data = await response.json();
            await AsyncStorage.setItem('accessToken', data.accessToken);
            global.expireMs = Date.now() + data.expireMs;
        } else {
            throw new Error('Làm mới access token thất bại');
        }
    }
}