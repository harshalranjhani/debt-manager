import { KeyboardAvoidingView, StyleSheet, Text, View } from "react-native";
import React, { useState } from "react";
import { Button, Input, Image } from "react-native-elements";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { auth } from "../firebase";
import { Alert } from "react-native";

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      if (authUser) {
        navigation.replace("Content");
      }
    });

    return unsubscribe;
  }, []);

  const signIn = () => {
    auth
      .signInWithEmailAndPassword(email, password)
      .catch((e) => Alert.alert(e.message));
  };

  return (
    <KeyboardAvoidingView behavior="padding" enabled style={styles.container}>
      <StatusBar style="light" />
      <Image
        source={{
          uri: "https://i0.wp.com/www.gloryofthesnow.com/wp-content/uploads/2022/06/Wallet-Peach.png?fit=700%2C700&ssl=1",
        }}
        style={{ width: 200, height: 200, borderRadius: 20 }}
      />
      <View style={styles.inputContainer}>
        <Input
          placeholder="Email"
          type="email"
          value={email}
          onChangeText={(text) => setEmail(text)}
        />
        <Input
          placeholder="Password"
          secureTextEntry
          type="password"
          value={password}
          onChangeText={(password) => setPassword(password)}
          onSubmitEditing={signIn}
        />
      </View>
      <Button
        containerStyle={styles.button}
        buttonStyle={{ backgroundColor: "#F25C54" }}
        onPress={signIn}
        title="Login"
      />
      <Button
        onPress={() => navigation.navigate("Register")}
        titleStyle={{
          color: "black",
          marginHorizontal: 20,
        }}
        containerStyle={styles.button}
        type="outline"
        title="Register"
      />
      <View style={{ height: 150 }}></View>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  inputContainer: {
    width: 300,
  },
  button: {
    width: 200,
    marginTop: 10,
  },
});
