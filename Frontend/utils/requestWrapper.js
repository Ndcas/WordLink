import AsyncStorage from "@react-native-async-storage/async-storage";
import checkAndRefreshAccessToken from "./checkAndRefreshAccessToken";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

async function get(endpoint, query = {}, requiredToken = '') {
    let queryParams = new URLSearchParams(query).toString();
    let url = `${API_URL}${endpoint}?${queryParams}`;
    let headers = {};
    switch (requiredToken) {
        case 'access': {
            await checkAndRefreshAccessToken();
            let token = await AsyncStorage.getItem('accessToken');
            headers['Authorization'] = `Bearer ${token}`;
            break;
        }
        case 'refresh': {
            let token = await AsyncStorage.getItem('refreshToken');
            if (!token) {
                throw new Error('Không có refresh token');
            }
            headers['Authorization'] = `Bearer ${token}`;
            break;
        }
        default:
            break;
    }
    return await fetch(url, {
        method: 'GET',
        headers: headers
    });
}

async function post(endpoint, body = {}, requiredToken = '') {
    let url = `${API_URL}${endpoint}`;
    let headers = {
        'Content-Type': 'application/json'
    };
    switch (requiredToken) {
        case 'access': {
            await checkAndRefreshAccessToken();
            let token = await AsyncStorage.getItem('accessToken');
            headers['Authorization'] = `Bearer ${token}`;
            break;
        }
        case 'refresh': {
            let token = await AsyncStorage.getItem('refreshToken');
            if (!token) {
                throw new Error('Không có refresh token');
            }
            headers['Authorization'] = `Bearer ${token}`;
            break;
        }
        default:
            break;
    }
    return await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    });
}

export { get, post };