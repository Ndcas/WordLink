import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Alert, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const NicknameScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { token } = route.params || {}; // lấy accessToken từ bước signup/login

  const [nickname, setNickname] = useState('');

  const handleContinue = () => {
    if (!nickname.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập nickname.');
      return;
    }

    // Điều hướng sang ChooseAvatarScreen, truyền nickname + token
    navigation.navigate('ChooseAvatar', {
      nickname: nickname.trim(),
      token,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.screen}>
          <Text style={styles.logo}>Wordlink</Text>
          <View style={styles.nicknameSection}>
            <TextInput
              style={styles.nicknameInput}
              placeholder="nickname"
              placeholderTextColor="#A0A5B5"
              value={nickname}
              onChangeText={setNickname}
              autoCapitalize="none"
            />
          </View>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>CONTINUE 1/2</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#E6EAF5' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 20,
  },
  logo: {
    fontFamily: 'Cochin',
    fontSize: width > 768 ? 80 : 50,
    color: '#FFB300',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginBottom: 40,
  },
  nicknameSection: {
    marginTop: 50,
    marginBottom: 50,
    width: '100%',
    alignItems: 'center',
  },
  nicknameInput: {
    width: width * 0.9,
    maxWidth: 400,
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderWidth: 0,
    borderRadius: 15,
    backgroundColor: '#F0F4FA',
    fontSize: width > 768 ? 24 : 18,
    textAlign: 'center',
    color: '#555',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  continueButton: {
    backgroundColor: '#6A5ACD',
    paddingVertical: 20,
    paddingHorizontal: 60,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  continueButtonText: {
    color: 'white',
    fontSize: width > 768 ? 20 : 18,
    fontWeight: 'bold',
  },
});

export default NicknameScreen;
