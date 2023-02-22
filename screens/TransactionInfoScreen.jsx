import { View, Text, ScrollView, StyleSheet, Alert } from "react-native";
import { Button } from "react-native-elements";
import React, { useEffect, useState } from "react";
import { useRoute } from "@react-navigation/native";
import { Avatar } from "react-native-elements";
import { auth, db } from "../firebase";

const TransactionInfoScreen = ({ navigation, route }) => {
  const [transactedUser, setTransactedUser] = useState({});
  console.log(route.params.transaction.transactionWith);
  const getTransactedUser = async () => {
    db.collection("users")
      .where("userRefId", "==", route.params.transaction.transactionWith)
      .get()
      .then((snapshot) => {
        snapshot.forEach((doc) => setTransactedUser(doc.data()));
      })
      .catch((e) => console.log(e.message));
  };

  useEffect(() => {
    getTransactedUser();
    navigation.setOptions({
      title: `Transaction Info`,
      headerBackTitle: "Back",
    });
  }, []);

  const deleteTransaction = () => {
    db.collection("users")
      .where("userRefId", "==", route.params.transaction.transactionAuthor)
      .get()
      .then((snapshot) =>
        snapshot.forEach((doc) =>
          route.params.transaction.transactionType === "debtor"
            ? doc.ref.update({
                amountBorrowed:
                  doc.data().amountBorrowed - route.params.transaction.amount,
              })
            : doc.ref.update({
                amountLent:
                  doc.data().amountLent - route.params.transaction.amount,
              })
        )
      )
      .then(() => {
        db.collection("users")
          .where("userRefId", "==", route.params.transaction.transactionWith)
          .get()
          .then((snapshot) =>
            snapshot.forEach((doc) =>
              route.params.transaction.transactionType === "debtor"
                ? doc.ref.update({
                    amountBorrowed:
                      doc.data().amountBorrowed -
                      route.params.transaction.amount,
                  })
                : doc.ref.update({
                    amountLent:
                      doc.data().amountLent - route.params.transaction.amount,
                  })
            )
          );
      })
      .then(() => {
        db.collection("transactions")
          .doc(route.params.transaction.id)
          .delete()
          .then(() => {
            navigation.navigate("Transactions");
          });
      })
      .catch((e) => Alert.alert(e.message));
  };

  return (
    <ScrollView className="h-full">
      <View className="flex flex-row p-5 justify-center">
        <View>
          <Avatar
            size="xlarge"
            rounded
            source={{ uri: route.params.transaction.transactionAuthorPhoto }}
            containerStyle={{ marginHorizontal: 4 }}
          />
          <Text className="text-center my-4">
            {route.params.transaction.transactionAuthorName}
          </Text>
        </View>
        <View>
          <Avatar
            size="xlarge"
            rounded
            source={{ uri: route.params.transaction.transactionWithPhoto }}
            containerStyle={{ marginHorizontal: 4 }}
          />
          <Text className="text-center my-4">
            {route.params.transaction.transactionWithAuthorName}
          </Text>
        </View>
      </View>
      <View>
        <Text className="font-black text-7xl text-center ">{`${`\u20B9`}${
          route.params.transaction.amount
        }`}</Text>
      </View>
      <View>
        <Text className="font-semibold text-center mt-4 p-10">
          {route.params.transaction.description.replace(/(?:\n|\n)/g, " ")}
        </Text>
      </View>
      <View>
        <Text className="font-black text-2xl text-center">
          Debtor:{" "}
          {route.params.transaction.transactionType == "debtor"
            ? route.params.transaction.transactionAuthorName
            : route.params.transaction.transactionWithAuthorName}
        </Text>
        <Text className="font-black text-2xl text-center">
          Financier:{" "}
          {route.params.transaction.transactionType == "financier"
            ? route.params.transaction.transactionAuthorName
            : route.params.transaction.transactionWithAuthorName}
        </Text>
      </View>
      <View>
        <Text className="mt-10 mb-2 text-center antialiased ">
          Transaction Initiated
        </Text>
        <Text className="text-center italic">
          {route?.params?.transaction?.created?.toDate().toDateString()}
        </Text>
        <Text className="text-center italic">
          {route?.params?.transaction?.created
            ?.toDate()
            .toLocaleTimeString("en-US")}
        </Text>
      </View>
      <View className="w-auto flex items-center" style={styles.inputContainer}>
        <Button
          containerStyle={styles.button}
          titleStyle={{
            color: "white",
          }}
          buttonStyle={{ backgroundColor: "#F25C54", marginVertical: 10 }}
          onPress={deleteTransaction}
          title="Delete Transaction"
        />
      </View>
    </ScrollView>
  );
};

export default TransactionInfoScreen;
const styles = StyleSheet.create({
  inputContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    width: 200,
    marginTop: 10,
  },
});
