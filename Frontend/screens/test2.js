import { Text, StyleSheet, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function App() {
    const navigation = useNavigation();

    return (
        <Pressable style={styles.screen} onPress={() => navigation.navigate('Test1')}>
            <Text>Test screen 2</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
});