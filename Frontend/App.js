import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesome5 } from '@expo/vector-icons';
import HomeScreen from './screens/HomeScreen';
import Leaderboard from './screens/LeaderBoard';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import Dictionary from './screens/Dictionary';
import SplashScreen from './screens/SplashScreen';
import { useFonts } from 'expo-font';
import NicknameScreen from './screens/NicknameScreen';
import ChooseAvatarScreen from './screens/ChooseAvatarScreen';
import AccountInfoScreen from './screens/AccountInfoScreen';
import PlayWithBotScreen from './screens/PlayWithBotScreen';
import MultiplayerScreen from './screens/MultiplayerScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import ChangePasswordScreen from './screens/ChangePasswordScreen';
import BookmarkScreen from './screens/BookmarkScreen';


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();


// Tab Navigator cho Main App
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Home') {
            return <FontAwesome5 name="home" size={size} color={color} />;
          } else if (route.name === 'Dictionary') {
            return <FontAwesome5 name="book" size={size} color={color} />;
          } else if (route.name === 'Leaderboard') {
            return <FontAwesome5 name="trophy" size={size} color={color} />;
          } else if (route.name === 'AccountInfo') {
            return <FontAwesome5 name="users-cog" size={size} color={color} />;
          }

        },
        tabBarActiveTintColor: '#10375C',
        tabBarInactiveTintColor: 'gray',
        tabBarLabelStyle: {
          fontSize: 7,
          fontFamily: 'Bungee',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Dictionary" component={Dictionary} />
      <Tab.Screen name="Leaderboard" component={Leaderboard} />
      <Tab.Screen name="AccountInfo" component={AccountInfoScreen} />
    </Tab.Navigator>
  );
}

// Stack Navigator quản lý Login/Signup + Tabs
export default function App() {
  const [fontsLoaded] = useFonts({
    'Bungee': require('./assets/Bungee-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Auth Screens */}
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
        <Stack.Screen name="NicknameScreen" component={NicknameScreen} />
        <Stack.Screen name="ChooseAvatarScreen" component={ChooseAvatarScreen} />
        <Stack.Screen name="SplashScreen" component={SplashScreen} />
        <Stack.Screen name="AccountInfoScreen" component={AccountInfoScreen} />
        <Stack.Screen name="PlayWithBotScreen" component={PlayWithBotScreen} />
        <Stack.Screen name="MultiplayerScreen" component={MultiplayerScreen} />
        <Stack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} />
        <Stack.Screen name="ChangePasswordScreen" component={ChangePasswordScreen} />
        <Stack.Screen name="BookmarkScreen" component={BookmarkScreen} />

        {/* Main App (có Tab Navigator) */}
        <Stack.Screen name="MainTabs" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
