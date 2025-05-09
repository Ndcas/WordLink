import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Test1 from './screens/test1';
import Test2 from './screens/test2';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name='Test1' component={Test1}></Stack.Screen>
        <Stack.Screen name='Test2' component={Test2}></Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
