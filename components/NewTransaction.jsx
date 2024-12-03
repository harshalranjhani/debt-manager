import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import React, { useLayoutEffect, useState } from "react";
import {
  SafeAreaView,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  Button,
  Alert,
  Input,
  KeyboardAvoidingView,
  StyleSheet,
} from "react-native";
import { RadioButton } from "react-native-paper";
import NumericInput from "react-native-numeric-input";
import { auth, db } from "../firebase";
import { useHeaderHeight } from "@react-navigation/elements";
import firebase from "firebase/compat/app";
import axios from "axios";
import { Vibration } from "react-native";
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

const NewTransaction = ({ navigation }) => {
  const [transactionType, setTransactionType] = useState("financier");
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState("");
  const [transactionWith, setTransactionWith] = useState("");
  const [transactionWithUser, setTransactionWithUser] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const height = useHeaderHeight();
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);
  const getTransactionWithUserData = async () => {
    try {
      const responseRef = await db
        .collection("users")
        .where("userRefId", "==", transactionWith)
        .get();
  
      let userData = null;
  
      responseRef.forEach((doc) => {
        userData = doc.data();
      });
  
      if (!userData) {
        Alert.alert("User not found");
        setIsProcessing(false);
        return null;
      }
  
      setTransactionWithUser(userData);
      console.log(userData);
      return userData;
    } catch (e) {
      Alert.alert(e.message);
      setIsProcessing(false);
      return null;
    }
  };
  

  const completeTransaction = async () => {
    setIsProcessing(true);
    try {
      const numAmount = parseFloat(amount);
      if (
        description.trim() === "" ||
        transactionWith.trim() === "" ||
        !amount || 
        isNaN(numAmount) || 
        numAmount <= 0
      ) {
        Alert.alert("Please check your inputs", "All fields are required and amount must be greater than 0.");
        setIsProcessing(false);
        return;
      }
      if (transactionWith == auth?.currentUser?.uid) {
        Alert.alert("You cannot make a transaction with yourself.");
        setTransactionType("financier");
        setAmount(0);
        setDescription("");
        setTransactionWith("");
        setIsProcessing(false);
        return;
      }
      const userData = await getTransactionWithUserData();
      await db
        .collection("transactions")
        .add({
          transactionWithAuthorName: userData.userFullName,
          transactionWithPhoto: userData.photoURL,
          transactionAuthorPhoto: auth?.currentUser?.photoURL,
          transactionAuthor: auth?.currentUser?.uid,
          transactionAuthorName: auth?.currentUser?.displayName,
          transactionType: transactionType,
          amount: parseFloat(amount),
          description: description,
          transactionWith: transactionWith,
          created: firebase.firestore.FieldValue.serverTimestamp(),
        })
        .then(async () => {
          let mailObj = {};
          await db
            .collection("users")
            .where("userRefId", "==", transactionWith)
            .get()
            .then((snapshot) =>
              snapshot.forEach((doc) =>
                transactionType === "debtor"
                  ? (mailObj = {
                      email: doc.data().userEmail,
                      appName: "Debt Manager",
                      transactionType: "borrowed",
                      initiatedUser: auth?.currentUser?.displayName,
                      amount: parseFloat(amount),
                    })
                  : (mailObj = {
                      email: doc.data().userEmail,
                      appName: "Debt Manager",
                      transactionType: "lent",
                      initiatedUser: auth?.currentUser?.displayName,
                      amount: parseFloat(amount),
                    })
              )
            );
          console.log(mailObj);
          const response = await axios.post(
            "https://harshalranjhaniapi.vercel.app/mail/transaction/new",
            {
              mailObj,
            }
          );
          console.log(response);
        })
        .then(() => {
          db.collection("users")
            .where("userRefId", "==", auth?.currentUser?.uid)
            .get()
            .then((snapshot) =>
              snapshot.forEach((doc) =>
                transactionType == "debtor"
                  ? doc.ref.update({
                      amountBorrowed: doc.data().amountBorrowed + parseFloat(amount),
                    })
                  : doc.ref.update({
                      amountLent: doc.data().amountLent + parseFloat(amount),
                    })
              )
            )
            .catch((e) => {
              Alert.alert(e.message);
              setIsProcessing(false);
            });
        })
        .then(() => {
          db.collection("users")
            .where("userRefId", "==", transactionWith)
            .get()
            .then((snapshot) =>
              snapshot.forEach((doc) =>
                transactionType == "debtor"
                  ? doc.ref.update({
                      amountLent: doc.data().amountLent + parseFloat(amount),
                    })
                  : doc.ref.update({
                      amountBorrowed: doc.data().amountBorrowed + parseFloat(amount),
                    })
              )
            )
            .catch((e) => {
              Alert.alert(e.message);
              setIsProcessing(false);
            });
        })
        .then(() => {
          setTransactionType("financier");
          setAmount(0);
          setDescription("");
          setTransactionWith("");
          setIsProcessing(false);
          Alert.alert("Transaction Complete :)");
        })
        .catch((e) => {
          Alert.alert(e.message);
          setIsProcessing(false);
        });
    } catch (e) {
      Alert.alert("Uh Oh! Something went wrong. Please try again?");
      setIsProcessing(false);
    }
  };

  const handleRadioPress = (type) => {
    setTransactionType(type);
    Haptics.selectionAsync();
  };

  const handleSubmit = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await completeTransaction();
  };

  const handleAmountChange = (text) => {
    if (text === '' || text === '.') {
      setAmount(text);
      return;
    }

    const regex = /^\d*\.?\d{0,2}$/;
    if (regex.test(text)) {
      setAmount(text);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={"padding"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={height + 47}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <SafeAreaView style={styles.safeArea}>
            {isProcessing && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#F79D65" />
                <Text style={styles.loadingText}>Processing Transaction...</Text>
              </View>
            )}

            <Animated.Text 
              entering={FadeIn}
              style={styles.headerText}
            >
              New Transaction
            </Animated.Text>

            <Animated.View 
              entering={FadeInDown.delay(100)}
              style={styles.radioContainer}
            >
              <RadioButton.Group
                onValueChange={handleRadioPress}
                value={transactionType}
              >
                <View style={styles.radioOption}>
                  <Text
                    style={styles.radioLabel}
                    onPress={() => handleRadioPress("debtor")}
                  >
                    Debtor
                  </Text>
                  <RadioButton
                    color="#F25C54"
                    value="debtor"
                    status={transactionType === "debtor" ? "checked" : "unchecked"}
                    onPress={() => handleRadioPress("debtor")}
                  />
                </View>
                <View style={styles.radioOption}>
                  <Text
                    style={styles.radioLabel}
                    onPress={() => handleRadioPress("financier")}
                  >
                    Financier
                  </Text>
                  <RadioButton
                    color="#F25C54"
                    value="financier"
                    status={transactionType === "financier" ? "checked" : "unchecked"}
                    onPress={() => handleRadioPress("financier")}
                  />
                </View>
              </RadioButton.Group>
            </Animated.View>

            <Animated.View 
              entering={FadeInDown.delay(200)}
              style={styles.amountContainer}
            >
              <Text style={styles.inputLabel}>Amount ({transactionType === 'debtor' ? 'Borrowing' : 'Lending'})</Text>
              <View style={styles.amountInputContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={handleAmountChange}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  placeholderTextColor="grey"
                  maxLength={10}
                />
              </View>
              <Text style={styles.helperText}>
                Enter the amount you are {transactionType === 'debtor' ? 'borrowing' : 'lending'}
              </Text>
            </Animated.View>

            <Animated.View 
              entering={FadeInDown.delay(300)}
              style={styles.inputContainer}
            >
              <Text style={styles.inputLabel}>Add a description</Text>
              <TextInput
                value={description}
                style={styles.textInput}
                underlineColorAndroid="transparent"
                placeholder="@grizzlybear paid for my bus ticket"
                placeholderTextColor="grey"
                numberOfLines={4}
                multiline={true}
                onChangeText={(value) => setDescription(value)}
              />
            </Animated.View>

            <Animated.View 
              entering={FadeInDown.delay(400)}
              style={styles.inputContainer}
            >
              <Text style={styles.inputLabel}>Lending To / Borrowing From</Text>
              <TextInput
                value={transactionWith}
                style={styles.textInput}
                underlineColorAndroid="transparent"
                placeholder="The unique id you just copied."
                placeholderTextColor="grey"
                onChangeText={(value) => setTransactionWith(value)}
              />
            </Animated.View>

            <Animated.View 
              entering={FadeInDown.delay(500)}
              style={styles.buttonContainer}
            >
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  isProcessing && styles.submitButtonDisabled
                ]}
                disabled={isProcessing}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>
                  {isProcessing ? "Processing..." : "Complete Transaction"}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </SafeAreaView>
        </TouchableWithoutFeedback>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  container: {
    flex: 1,
  },
  safeArea: {
    padding: 24,
    paddingTop: 40,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  headerText: {
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
    marginVertical: 30,
    color: '#333',
  },
  radioContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginVertical: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  radioLabel: {
    fontSize: 20,
    fontWeight: '700',
    marginRight: 10,
    color: '#333',
  },
  amountContainer: {
    marginVertical: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F79D65',
    paddingHorizontal: 15,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginRight: 5,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    padding: 15,
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    marginVertical: 20,
  },
  textInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#F79D65',
    color: '#333',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonContainer: {
    marginVertical: 30,
  },
  submitButton: {
    backgroundColor: '#F79D65',
    padding: 18,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default NewTransaction;
