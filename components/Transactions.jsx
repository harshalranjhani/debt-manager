import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Animated,
  Platform,
} from "react-native";
import React, { useEffect, useState, useLayoutEffect, useRef } from "react";
import { auth, db } from "../firebase";
import { List, MD3Colors } from "react-native-paper";
import { Avatar } from "react-native-elements";
import * as Haptics from 'expo-haptics';
import { SharedElement } from 'react-navigation-shared-element';

const Transactions = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [awayTransactions, setAwayTransactions] = useState([]);
  const signOutUser = () => {
    auth.signOut().then(() => {
      navigation.replace("Login");
    });
  };

  const scrollY = useRef(new Animated.Value(0)).current;

  const handleTransactionPress = (transaction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("TransactionInfo", { transaction });
  };

  useLayoutEffect(() => {
    getAllTransactions();
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
    const unsubscribe = navigation.addListener("focus", () => {
      getTransactions();
      getAllTransactions();
      getAwayTransactions();
    });

    return unsubscribe;
  }, []);

  return (
    <Animated.ScrollView
      style={{ backgroundColor: '#fff' }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            getAllTransactions();
          }}
          tintColor="#F25C54"
        />
      }
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: true }
      )}
      contentContainerStyle={styles.scrollViewContent}
    >
      <List.Section style={styles.listSection}>
        {!refreshing && (
          <Text style={styles.subheader}>
            {transactions.length === 0 && awayTransactions.length === 0
              ? "No transactions available"
              : "Your current transactions"}
          </Text>
        )}
        {refreshing ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading data...</Text>
          </View>
        ) : (
          <View style={styles.transactionsContainer}>
            {transactions.map((transaction) => (
              <Animated.View
                key={transaction.id}
                style={[
                  styles.transactionCard,
                  {
                    transform: [
                      {
                        scale: scrollY.interpolate({
                          inputRange: [-50, 0, 100 * transactions.indexOf(transaction), 100 * (transactions.indexOf(transaction) + 2)],
                          outputRange: [1, 1, 1, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => handleTransactionPress(transaction)}
                  style={styles.transactionItem}
                >
                  <SharedElement id={`transaction.${transaction.id}.image`}>
                    <Image
                      source={{
                        uri: "https://cdn-icons-png.flaticon.com/512/33/33308.png",
                      }}
                      style={styles.transactionImage}
                    />
                  </SharedElement>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.amount}>{`₹${transaction.amount}`}</Text>
                    <Text style={styles.description}>{transaction.description}</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
            {awayTransactions.map((transaction) => (
              <Animated.View
                key={transaction.id}
                style={[
                  styles.transactionCard,
                  {
                    transform: [
                      {
                        scale: scrollY.interpolate({
                          inputRange: [-50, 0, 100 * awayTransactions.indexOf(transaction), 100 * (awayTransactions.indexOf(transaction) + 2)],
                          outputRange: [1, 1, 1, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => handleTransactionPress(transaction)}
                  style={styles.transactionItem}
                >
                  <SharedElement id={`transaction.${transaction.id}.image`}>
                    <Image
                      source={{
                        uri: "https://cdn-icons-png.flaticon.com/512/33/33308.png",
                      }}
                      style={styles.transactionImage}
                    />
                  </SharedElement>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.amount}>{`₹${transaction.amount}`}</Text>
                    <Text style={styles.description}>{transaction.description}</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}
      </List.Section>
    </Animated.ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
    backgroundColor: '#fff',
  },
  listSection: {
    backgroundColor: '#fff',
  },
  subheader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    padding: 16,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
  },
  transactionsContainer: {
    paddingHorizontal: 16,
  },
  transactionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  transactionImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
  },
  transactionDetails: {
    marginLeft: 16,
    flex: 1,
  },
  amount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F25C54',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
  },
});

export default Transactions;
