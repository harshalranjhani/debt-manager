import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Home from "./components/Home";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import { auth } from "./firebase";
import { useLayoutEffect } from "react";
import { TouchableOpacity } from "react-native";
import { Avatar } from "react-native-elements";
import NewTransaction from "./components/NewTransaction";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Provider as PaperProvider } from "react-native-paper";
import Transactions from "./components/Transactions";
import TransactionInfoScreen from "./screens/TransactionInfoScreen";

const globalScreenOptions = {
  headerStyle: { backgroundColor: "#F27059" },
  headerTitleStyle: { color: "white" },
  headerTintColor: "white",
};

const signOutUser = () => {
  auth.signOut().then(() => {
    navigation.replace("Login");
  });
};

export default function App() {
  const Stack = createStackNavigator();
  const Tab = createBottomTabNavigator();

  function Content({ navigation }) {
    useLayoutEffect(() => {
      navigation.setOptions({
        headerShown: false,
      });
    }, [navigation]);

    return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === "Home") {
              iconName = focused ? "ios-home" : "home-outline";
            } else if (route.name === "NewTransaction") {
              iconName = focused ? "add-circle-sharp" : "add-circle-outline";
            } else if (route.name == "Transactions") {
              iconName = focused ? "ios-list-circle-sharp" : "ios-list-outline";
            }

            // You can return any component that you like here!
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#F25C54",
          tabBarInactiveTintColor: "gray",
        })}
      >
        <Tab.Screen name="Home" component={Home} />
        <Tab.Screen name="NewTransaction" component={NewTransaction} />
        <Tab.Screen name="Transactions" component={Transactions} />
      </Tab.Navigator>
    );
  }

  return (
    <PaperProvider>
      <NavigationContainer>
        <SafeAreaProvider>
          <Stack.Navigator
            screenOptions={globalScreenOptions}
            initialRouteName="Login"
          >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Content" component={Content} />
            <Stack.Screen
              name="TransactionInfo"
              component={TransactionInfoScreen}
            />
          </Stack.Navigator>
        </SafeAreaProvider>
      </NavigationContainer>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
