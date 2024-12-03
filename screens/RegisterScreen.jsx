import { KeyboardAvoidingView, StyleSheet, View, Animated } from "react-native";
import React, { useEffect, useRef } from "react";
import { Button, Input, Image, Text } from "react-native-elements";
import { StatusBar } from "expo-status-bar";
import { auth, db } from "../firebase";
import { Alert } from "react-native";
import axios from "axios";
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      if (authUser) {
        navigation.replace("Content");
      }
    });

    return unsubscribe;
  }, []);

  const register = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const authUser = await auth.createUserWithEmailAndPassword(email, password);
      await authUser.user.updateProfile({
        displayName: name,
        photoURL: imageUrl || "https://static.vecteezy.com/system/resources/thumbnails/002/318/271/small/user-profile-icon-free-vector.jpg",
      });

      await db.collection("users").add({
        userRefId: auth?.currentUser?.uid,
        userFullName: name,
        userEmail: auth?.currentUser?.email,
        amountLent: 0.0,
        amountBorrowed: 0.0,
        photoURL: imageUrl || "https://static.vecteezy.com/system/resources/thumbnails/002/318/271/small/user-profile-icon-free-vector.jpg",
      });

      await axios.post("https://harshalranjhaniapi.vercel.app/mail/welcome", {
        mailObj: {
          appName: "Debt Manager",
          email,
          appAdjective: "Stocker!",
        },
      });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", e.message);
    }
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerBackTitle: "Login",
    });
  }, [navigation]);

  return (
    <LinearGradient
      colors={['#ffffff', '#f8f8f8']}
      style={styles.gradient}
    >
      <KeyboardAvoidingView behavior="padding" style={styles.container}>
        <StatusBar style="dark" />
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text h3 style={styles.title}>
            Create an Account
          </Text>
          <View style={styles.inputContainer}>
            <Input
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
              containerStyle={styles.inputWrapper}
              inputStyle={styles.input}
              leftIcon={{ type: 'feather', name: 'user', color: '#666' }}
            />
            <Input
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              containerStyle={styles.inputWrapper}
              inputStyle={styles.input}
              leftIcon={{ type: 'feather', name: 'mail', color: '#666' }}
            />
            <Input
              placeholder="Password"
              value={password}
              secureTextEntry
              onChangeText={setPassword}
              containerStyle={styles.inputWrapper}
              inputStyle={styles.input}
              leftIcon={{ type: 'feather', name: 'lock', color: '#666' }}
            />
            <Input
              placeholder="Profile Picture URL (Optional)"
              value={imageUrl}
              onChangeText={setImageUrl}
              onSubmitEditing={register}
              containerStyle={styles.inputWrapper}
              inputStyle={styles.input}
              leftIcon={{ type: 'feather', name: 'image', color: '#666' }}
            />
          </View>

          <Button
            title="Register"
            onPress={register}
            containerStyle={styles.button}
            buttonStyle={styles.primaryButton}
            titleStyle={styles.buttonText}
          />
        </Animated.View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    maxWidth: 340,
  },
  title: {
    marginBottom: 30,
    fontWeight: "bold",
    color: "#333",
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputWrapper: {
    paddingHorizontal: 0,
    marginBottom: 10,
  },
  input: {
    paddingLeft: 10,
    fontSize: 16,
  },
  button: {
    width: '100%',
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  primaryButton: {
    backgroundColor: "#F25C54",
    paddingVertical: 15,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
