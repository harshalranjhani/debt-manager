import { View, Text, ScrollView } from "react-native";
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

const NewTransaction = ({ navigation }) => {
  const [transactionType, setTransactionType] = useState("financier");
  const [amount, setAmount] = useState(0.0);
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
      if (
        description.trim() == "" ||
        transactionWith.trim() == "" ||
        amount == 0
      ) {
        Alert.alert("No fields must remain empty. Amount cannot be 0.");
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
          amount: amount,
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
                      amount,
                    })
                  : (mailObj = {
                      email: doc.data().userEmail,
                      appName: "Debt Manager",
                      transactionType: "lent",
                      initiatedUser: auth?.currentUser?.displayName,
                      amount,
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
                      amountBorrowed: doc.data().amountBorrowed + amount,
                    })
                  : doc.ref.update({
                      amountLent: doc.data().amountLent + amount,
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
                      amountLent: doc.data().amountLent + amount,
                    })
                  : doc.ref.update({
                      amountBorrowed: doc.data().amountBorrowed + amount,
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
  return (
    <ScrollView>
      <KeyboardAvoidingView
        behavior={"height"}
        style={styles.container}
        keyboardVerticalOffset={height + 47}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <SafeAreaView>
            <Text className="text-center font-bold text-4xl m-5 leading-10">
              New Transaction
            </Text>
            <View>
              <RadioButton.Group>
                <View className="flex flex-row  justify-center align-center">
                  <Text
                    className="font-black text-2xl"
                    onPress={() => setTransactionType("debtor")}
                  >
                    Debtor
                  </Text>
                  <RadioButton
                    color="#F25C54"
                    value="debtor"
                    status={
                      transactionType === "debtor" ? "checked" : "unchecked"
                    }
                    onPress={() => setTransactionType("debtor")}
                  />
                </View>
                <View className="flex flex-row text-center justify-center align-center">
                  <Text
                    className="font-black text-2xl"
                    onPress={() => setTransactionType("financier")}
                  >
                    Financier
                  </Text>
                  <RadioButton
                    color="#F25C54"
                    value="financier"
                    status={
                      transactionType === "financier" ? "checked" : "unchecked"
                    }
                    onPress={() => setTransactionType("financier")}
                  />
                </View>
              </RadioButton.Group>
            </View>
            <View className="flex justify-center items-center mt-10 flex-row">
              <Text className="text-xl font-bold p-4">Enter Amount</Text>
              <NumericInput
                type="up-down"
                value={amount}
                minValue={0}
                onChange={(value) => setAmount(value)}
                onLimitReached={(isMax, msg) => Alert.alert(isMax, msg)}
                totalWidth={150}
                totalHeight={50}
                iconSize={25}
                step={1.5}
                valueType="real"
                rounded
                textColor="#F79D65"
                iconStyle={{ color: "F25C54" }}
                rightButtonBackgroundColor="#F79D65"
                leftButtonBackgroundColor="#F79D65"
              />
            </View>
            <Text className="text-xl font-bold p-4 text-center">
              Add a description
            </Text>
            <TextInput
              value={description}
              className="border border-[#fb9b60] p-5 border-1 h-20 flex justify-start mx-10"
              underlineColorAndroid="transparent"
              placeholder="@grizzlybear paid for my bus ticket"
              placeholderTextColor="grey"
              numberOfLines={4}
              multiline={true}
              onChangeText={(value) => setDescription(value)}
            />
            <Text className="text-xl font-bold p-4 text-center">
              Lending To / Borrowing From
            </Text>
            <TextInput
              value={transactionWith}
              className="border border-[#fb9b60] p-5 border-1 flex justify-start mx-10"
              height={60}
              underlineColorAndroid="transparent"
              placeholder="The unique id you just copied."
              placeholderTextColor="grey"
              onChangeText={(value) => {
                setTransactionWith(value);
              }}
            />
            <View className="m-10 bg-[#fb9b60]">
              <Button
                disabled={isProcessing}
                title={`${
                  isProcessing ? "Processing..." : "Complete Transaction"
                }`}
                color="white"
                onPress={completeTransaction}
              />
            </View>
          </SafeAreaView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ScrollView>
  );
};

export default NewTransaction;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: "auto",
  },
});
