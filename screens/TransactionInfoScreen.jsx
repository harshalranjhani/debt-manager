import { View, Text, ScrollView } from "react-native";
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

  return (
    <ScrollView className="h-full">
      <View className="flex flex-row p-5 justify-center">
        <View>
          <Avatar
            size="xlarge"
            rounded
            source={{ uri: auth?.currentUser?.photoURL }}
            containerStyle={{ marginHorizontal: 4 }}
          />
          <Text className="text-center my-4">
            {auth?.currentUser?.displayName}
          </Text>
        </View>
        <View>
          <Avatar
            size="xlarge"
            rounded
            source={{ uri: transactedUser?.photoURL }}
            containerStyle={{ marginHorizontal: 4 }}
          />
          <Text className="text-center my-4">
            {transactedUser?.userFullName}
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
            ? auth?.currentUser?.displayName
            : transactedUser.userFullName}
        </Text>
        <Text className="font-black text-2xl text-center">
          Financier:{" "}
          {route.params.transaction.transactionType == "financier"
            ? auth?.currentUser?.displayName
            : transactedUser.userFullName}
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
    </ScrollView>
  );
};

export default TransactionInfoScreen;
