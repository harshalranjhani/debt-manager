import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import React, { useEffect, useState, useLayoutEffect } from "react";
import { auth, db } from "../firebase";
import { List, MD3Colors } from "react-native-paper";
import { Avatar } from "react-native-elements";

const Transactions = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [awayTransactions, setAwayTransactions] = useState([]);
  const signOutUser = () => {
    auth.signOut().then(() => {
      navigation.replace("Login");
    });
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerStyle: { backgroundColor: "#F25C54" },
      headerTitleStyle: { color: "black" },
      headerTintColor: "black",
      headerRight: () => (
        <View style={{ margin: 15 }}>
          <TouchableOpacity onPress={signOutUser} activeOpacity={0.5}>
            <Avatar rounded source={{ uri: auth?.currentUser?.photoURL }} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  const getTransactions = () => {
    setRefreshing(true);
    let transactionsArray = [];
    db.collection("transactions")
      .where("transactionAuthor", "==", auth?.currentUser?.uid)
      //   .orderBy("created")
      .get()
      .then((querySnapshot) =>
        querySnapshot.forEach((doc) => {
          console.log(doc.data());
          console.log({ ...doc.data(), id: doc.id });
          transactionsArray.push({ ...doc.data(), id: doc.id });
        })
      )
      .then(() => {
        setTransactions(transactionsArray);
        setRefreshing(false);
      })
      .catch((e) => console.log(e.message));
  };

  const getAwayTransactions = () => {
    setRefreshing(true);
    let awayTransactionsArray = [];
    db.collection("transactions")
      .where("transactionWith", "==", auth?.currentUser?.uid)
      //   .orderBy("created")
      .get()
      .then((querySnapshot) =>
        querySnapshot.forEach((doc) => {
          console.log(doc.data());
          console.log({ ...doc.data(), id: doc.id });
          awayTransactionsArray.push({ ...doc.data(), id: doc.id });
        })
      )
      .then(() => {
        setAwayTransactions(awayTransactionsArray);
        setRefreshing(false);
      })
      .catch((e) => console.log(e.message));
  };

  const getAllTransactions = () => {
    getTransactions();
    getAwayTransactions();
  };
  useEffect(() => {
    getTransactions();
    getAwayTransactions();
  }, []);

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={getAllTransactions}
        />
      }
    >
      <List.Section>
        <List.Subheader>Your current transactions</List.Subheader>
        {transactions.map((transaction) => (
          <List.Item
            key={transaction.id}
            onPress={() =>
              navigation.navigate("TransactionInfo", { transaction })
            }
            className="px-10"
            title={`${`\u20B9`}${transaction.amount}`}
            description={transaction.description}
            left={() => (
              <Image
                source={{
                  uri: "https://cdn-icons-png.flaticon.com/512/33/33308.png",
                }}
                style={{ width: 50, height: 50, borderRadius: 20 }}
              />
            )}
          />
        ))}
        {awayTransactions.map((transaction) => (
          <List.Item
            key={transaction.id}
            onPress={() =>
              navigation.navigate("TransactionInfo", { transaction })
            }
            className="px-10"
            title={`${`\u20B9`}${transaction.amount}`}
            description={transaction.description}
            left={() => (
              <Image
                source={{
                  uri: "https://cdn-icons-png.flaticon.com/512/33/33308.png",
                }}
                style={{ width: 50, height: 50, borderRadius: 20 }}
              />
            )}
          />
        ))}
      </List.Section>
    </ScrollView>
  );
};

export default Transactions;
