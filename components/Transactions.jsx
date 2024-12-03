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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onSnapshot } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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

  useEffect(() => {
    const loadCachedTransactions = async () => {
      try {
        const [cachedTransactions, cachedAwayTransactions] = await Promise.all([
          AsyncStorage.getItem('transactions'),
          AsyncStorage.getItem('awayTransactions')
        ]);

        if (cachedTransactions) setTransactions(JSON.parse(cachedTransactions));
        if (cachedAwayTransactions) setAwayTransactions(JSON.parse(cachedAwayTransactions));
      } catch (error) {
        console.error('Error loading cached transactions:', error);
      }
    };

    loadCachedTransactions();

    const transactionsUnsubscribe = onSnapshot(
      db.collection("transactions").where("transactionAuthor", "==", auth?.currentUser?.uid),
      (snapshot) => {
        const transactionsArr = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setTransactions(transactionsArr);
        AsyncStorage.setItem('transactions', JSON.stringify(transactionsArr));
        setRefreshing(false);
      }
    );

    const awayTransactionsUnsubscribe = onSnapshot(
      db.collection("transactions").where("transactionWith", "==", auth?.currentUser?.uid),
      (snapshot) => {
        const awayTransactionsArr = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setAwayTransactions(awayTransactionsArr);
        AsyncStorage.setItem('awayTransactions', JSON.stringify(awayTransactionsArr));
        setRefreshing(false);
      }
    );

    return () => {
      transactionsUnsubscribe();
      awayTransactionsUnsubscribe();
    };
  }, []);

  const getAllTransactions = async () => {
    setRefreshing(true);
    try {
      const [cachedTransactions, cachedAwayTransactions] = await Promise.all([
        AsyncStorage.getItem('transactions'),
        AsyncStorage.getItem('awayTransactions')
      ]);

      if (cachedTransactions) setTransactions(JSON.parse(cachedTransactions));
      if (cachedAwayTransactions) setAwayTransactions(JSON.parse(cachedAwayTransactions));
    } catch (error) {
      console.error('Error refreshing transactions:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      getAllTransactions();
    });

    return unsubscribe;
  }, []);

  const getTransactionIcon = (amount, description) => {
    if (description.toLowerCase().includes('food')) {
      return ['food', '#FF8C00'];
    } else if (description.toLowerCase().includes('travel')) {
      return ['airplane', '#4169E1'];
    } else if (amount > 1000) {
      return ['currency-inr', '#32CD32'];
    } else if (amount < 100) {
      return ['coffee', '#8B4513'];
    }
    return ['cash-multiple', '#F25C54'];
  };

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
                  <Animated.View
                    style={[
                      styles.iconContainer,
                      {
                        transform: [
                          {
                            rotate: scrollY.interpolate({
                              inputRange: [
                                100 * (transactions.indexOf(transaction) - 1),
                                100 * transactions.indexOf(transaction),
                              ],
                              outputRange: ['0deg', '360deg'],
                              extrapolate: 'clamp',
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    {(() => {
                      const [iconName, iconColor] = getTransactionIcon(
                        transaction.amount,
                        transaction.description
                      );
                      return (
                        <MaterialCommunityIcons
                          name={iconName}
                          size={30}
                          color={iconColor}
                        />
                      );
                    })()}
                  </Animated.View>
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
                  <Animated.View
                    style={[
                      styles.iconContainer,
                      {
                        transform: [
                          {
                            rotate: scrollY.interpolate({
                              inputRange: [
                                100 * (awayTransactions.indexOf(transaction) - 1),
                                100 * awayTransactions.indexOf(transaction),
                              ],
                              outputRange: ['0deg', '360deg'],
                              extrapolate: 'clamp',
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    {(() => {
                      const [iconName, iconColor] = getTransactionIcon(
                        transaction.amount,
                        transaction.description
                      );
                      return (
                        <MaterialCommunityIcons
                          name={iconName}
                          size={30}
                          color={iconColor}
                        />
                      );
                    })()}
                  </Animated.View>
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
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
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
