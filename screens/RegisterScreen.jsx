import { KeyboardAvoidingView, StyleSheet, View } from "react-native";
import React, { useEffect } from "react";
import { Button, Input, Image, Text } from "react-native-elements";
import { StatusBar } from "expo-status-bar";
import { auth, db } from "../firebase";
import { Alert } from "react-native";
import axios from "axios";

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      if (authUser) {
        navigation.replace("Content");
      }
    });

    return unsubscribe;
  }, []);

  const register = () => {
    auth
      .createUserWithEmailAndPassword(email, password)
      .then((authUser) => {
        authUser.user.updateProfile({
          displayName: name,
          photoURL:
            imageUrl ||
            "https://static.vecteezy.com/system/resources/thumbnails/002/318/271/small/user-profile-icon-free-vector.jpg",
        });
      })
      .then(() => {
        db.collection("users").add({
          userRefId: auth?.currentUser?.uid,
          userFullName: name,
          userEmail: auth?.currentUser?.email,
          amountLent: 0.0,
          amountBorrowed: 0.0,
          photoURL:
            imageUrl ||
            "https://static.vecteezy.com/system/resources/thumbnails/002/318/271/small/user-profile-icon-free-vector.jpg",
        });
      })
      .then(async () => {
        const response = await axios.post(
          "https://harshalranjhaniapi.vercel.app/mail/welcome",
          {
            mailObj: {
              appName: "Debt Manager",
              email,
              appAdjective: "Stocker!",
            },
          }
        );
      })
      .catch((e) => Alert.alert(e.message));
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerBackTitle: "Back to Login",
    });
  }, [navigation]);

  return (
    <KeyboardAvoidingView behavior="padding" enabled style={styles.container}>
      <StatusBar style="light" />
      <Text h3 style={{ marginBottom: 50, fontWeight: "bold" }}>
        Create an Account
      </Text>
      <View style={styles.inputContainer}>
        <Input
          placeholder="Full Name"
          value={name}
          type="text"
          onChangeText={(name) => setName(name)}
        />
        <Input
          placeholder="Email"
          value={email}
          type="email"
          onChangeText={(email) => setEmail(email)}
        />
        <Input
          placeholder="Password"
          value={password}
          type="password"
          secureTextEntry
          onChangeText={(password) => setPassword(password)}
        />
        <Input
          placeholder="Profile Picture Url (Optional)"
          value={imageUrl}
          type="url"
          onChangeText={(imageUrl) => setImageUrl(imageUrl)}
          onSubmitEditing={register}
        />
      </View>

      <Button
        title="Register"
        buttonStyle={{ backgroundColor: "#F25C54" }}
        onPress={register}
        raised
        containerStyle={styles.button}
      />
      <View style={{ height: 150 }}></View>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    backgroundColor: "white",
  },
  button: {
    width: 200,
    marginTop: 10,
  },
  inputContainer: {
    width: 300,
  },
});
