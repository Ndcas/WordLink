import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry';
import { getAvatarList, getAvatarImage } from '../utils/getAvatarImage';
import { post } from '../utils/requestWrapper';

const { width } = Dimensions.get('window');

// Map avatar images với key string (sẽ gửi lên server)
const avatars = getAvatarList();;
console.log(avatars);

const ChooseAvatarScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { nickname, token } = route.params || {};

  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);

  const handleComplete = async () => {
    if (!selectedAvatar) {
      Alert.alert('Error', 'Please select an avatar.');
      return;
    }

    try {
      let res = await post(`/account/changeUsernameAndAvatarImage`, { avatarName: selectedAvatar }, 'access');
      switch (res.status) {
        case 400:
          Alert.alert("Error", "Invalid username or avatar.");
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
        case 429:
          Alert.alert("Error", "Too many requests, please wait and try again.");
          return;
        case 500:
          Alert.alert("Error", "Server error.");
          return;
      }
      if (!res.ok) {
        Alert.alert("Error", "Cannot connect to server.");
        return;
      }
      const data = await res.json();

      if (res.ok) {
        Alert.alert('Success', 'Profile successfully updated!');
        navigation.navigate("MainTabs", {
                screen: "Home",
              });
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', "Can't connect to the server.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.screen}>
          <Text style={styles.logo}>Wordlink</Text>

          <View style={styles.profileSection}>
            <View style={styles.selectedAvatarContainer}>
              <Image source={getAvatarImage(selectedAvatar)} style={styles.selectedAvatarImage} />
            </View>
            <Text style={styles.userName}>{nickname}</Text>
          </View>

          <View style={styles.avatarGrid}>
            {avatars.map((avatar, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.avatarItem,
                  selectedAvatar.key === avatar.key && styles.avatarItemSelected,
                ]}
                onPress={() => setSelectedAvatar(avatar)}
              >
                <Image source={getAvatarImage(avatar)} style={styles.avatarItemImage} />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
            <Text style={styles.completeButtonText}>COMPLETE 2/2</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#E6EAF5' },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingBottom: 20,
  },
  screen: { flex: 1, alignItems: 'center', width: '100%' },
  logo: {
    fontFamily: 'Cochin',
    fontSize: width > 768 ? 80 : 50,
    color: '#FFB300',
    marginBottom: 10,
    marginTop: 20,
  },
  profileSection: { alignItems: 'center', marginVertical: 10 },
  selectedAvatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#6A5ACD',
    marginBottom: 10,
  },
  selectedAvatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  userName: { color: '#555', fontSize: 24, fontWeight: 'bold', letterSpacing: 2 },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
    width: width * 0.9,
    maxWidth: 500,
    marginBottom: 20,
  },
  avatarItem: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ccc',
  },
  avatarItemImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  avatarItemSelected: { borderColor: '#6A5ACD', elevation: 5 },
  completeButton: {
    backgroundColor: '#6A5ACD',
    paddingVertical: 20,
    paddingHorizontal: 60,
    borderRadius: 15,
    marginTop: 10,
    elevation: 10,
  },
  completeButtonText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
});

export default ChooseAvatarScreen;
