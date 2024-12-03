import { KeyboardAvoidingView, StyleSheet, Text, View, Animated, ActivityIndicator } from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { Button, Input, Image } from "react-native-elements";
import { StatusBar } from "expo-status-bar";
import { auth } from "../firebase";
import { Alert } from "react-native";
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Fade in animation when screen loads
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

  const signIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", e.message);
    }
  };

  return (
    <LinearGradient
      colors={['#ffffff', '#f8f8f8']}
      style={styles.gradient}
    >
      <KeyboardAvoidingView behavior="padding" style={styles.container}>
        <StatusBar style="dark" />
        <Animated.View style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          <Image
            source={{
              uri: "https://i0.wp.com/www.gloryofthesnow.com/wp-content/uploads/2022/06/Wallet-Peach.png?fit=700%2C700&ssl=1",
            }}
            style={styles.logo}
            PlaceholderContent={<ActivityIndicator />}
          />
          <View style={styles.inputContainer}>
            <Input
              placeholder="Email"
              type="email"
              value={email}
              onChangeText={setEmail}
              containerStyle={styles.inputWrapper}
              inputStyle={styles.input}
              leftIcon={{ type: 'feather', name: 'mail', color: '#666' }}
            />
            <Input
              placeholder="Password"
              secureTextEntry
              type="password"
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={signIn}
              containerStyle={styles.inputWrapper}
              inputStyle={styles.input}
              leftIcon={{ type: 'feather', name: 'lock', color: '#666' }}
            />
          </View>
          <View style={styles.buttonContainer}>
            <Button
              containerStyle={styles.button}
              buttonStyle={styles.primaryButton}
              onPress={signIn}
              title="Login"
              titleStyle={styles.buttonText}
            />
            <Button
              onPress={() => {
                Haptics.selectionAsync();
                navigation.navigate("Register");
              }}
              containerStyle={styles.button}
              buttonStyle={styles.secondaryButton}
              titleStyle={styles.secondaryButtonText}
              title="Register"
            />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default LoginScreen;

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
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 20,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputContainer: {
    width: '100%',
    maxWidth: 340,
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
  buttonContainer: {
    width: '100%',
    maxWidth: 340,
  },
  button: {
    width: '100%',
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  primaryButton: {
    backgroundColor: "#F25C54",
    paddingVertical: 15,
    borderRadius: 12,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: "#F25C54",
    paddingVertical: 15,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: "#F25C54",
    fontSize: 16,
    fontWeight: '600',
  },
});
