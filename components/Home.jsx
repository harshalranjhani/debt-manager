import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Alert,
  StyleSheet,
  Vibration,
} from "react-native";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { TouchableOpacity } from "react-native";
import { Avatar } from "react-native-elements";
import { auth, db } from "../firebase";
import PieChart from "react-native-expo-pie-chart";
import Ionicons from "react-native-vector-icons/Ionicons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onSnapshot } from 'firebase/firestore';

const Home = ({ navigation }) => {
  const [greeting, setGreeting] = useState("");
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState({});
  const [refreshing, setRefreshing] = useState(true);
  const [lentPercentage, setLentPercentage] = useState(50);
  const [borrowedPercentage, setBorrowedPercentage] = useState(50);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const signOutUser = () => {
    auth.signOut().then(() => {
      navigation.replace("Login");
    });
  };
  let today, curHr;

  const calculatePercentage = () => {
    const amountLent = currentUser.amountLent || 0;
    const amountBorrowed = currentUser.amountBorrowed || 0;

    const total = amountLent + amountBorrowed;
    
    if (total === 0) {
      setLentPercentage(50);
      setBorrowedPercentage(50);
      return;
    }

    // Calculate raw percentages
    let lentPercent = (amountLent / total) * 100;
    let borrowedPercent = (amountBorrowed / total) * 100;

    // Set minimum threshold of 15% for visibility
    const MIN_THRESHOLD = 15;
    
    if (lentPercent < MIN_THRESHOLD && lentPercent > 0) {
      lentPercent = MIN_THRESHOLD;
      borrowedPercent = 100 - MIN_THRESHOLD;
    } else if (borrowedPercent < MIN_THRESHOLD && borrowedPercent > 0) {
      borrowedPercent = MIN_THRESHOLD;
      lentPercent = 100 - MIN_THRESHOLD;
    }

    setLentPercentage(Math.round(lentPercent));
    setBorrowedPercentage(Math.round(borrowedPercent));
  };

  const getGreeting = () => {
    today = new Date();
    curHr = today.getHours();

    if (curHr < 12) {
      setGreeting("Good Morning");
    } else if (curHr < 18) {
      setGreeting("Good Afternoon");
    } else {
      setGreeting("Good Evening");
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      getGreeting();
      calculatePercentage();
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Listen for current user changes
    const userUnsubscribe = onSnapshot(
      db.collection("users").where("userRefId", "==", auth?.currentUser?.uid),
      (snapshot) => {
        snapshot.forEach((doc) => {
          setCurrentUser(doc.data());
          AsyncStorage.setItem('currentUser', JSON.stringify(doc.data()));
        });
      }
    );

    // Listen for all users changes
    const usersUnsubscribe = onSnapshot(
      db.collection("users"),
      (snapshot) => {
        const usersArr = snapshot.docs.map(doc => doc.data());
        setUsers(usersArr);
        AsyncStorage.setItem('users', JSON.stringify(usersArr));
        setRefreshing(false);
      }
    );

    // Load cached data on mount
    const loadCachedData = async () => {
      try {
        const [cachedUsers, cachedCurrentUser] = await Promise.all([
          AsyncStorage.getItem('users'),
          AsyncStorage.getItem('currentUser')
        ]);

        if (cachedUsers) setUsers(JSON.parse(cachedUsers));
        if (cachedCurrentUser) setCurrentUser(JSON.parse(cachedCurrentUser));
      } catch (error) {
        console.error('Error loading cached data:', error);
      }
    };

    loadCachedData();

    return () => {
      userUnsubscribe();
      usersUnsubscribe();
    };
  }, []);

  const getUsers = async () => {
    setRefreshing(true);
    try {
      const cachedUsers = await AsyncStorage.getItem('users');
      if (cachedUsers) {
        setUsers(JSON.parse(cachedUsers));
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const copyId = async (user) => {
    try {
      await Clipboard.setStringAsync(user.userRefId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "ID copied to clipboard!");
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to copy ID");
    }
  };

  useEffect(() => {
    calculatePercentage();
  }, [currentUser]);

  useLayoutEffect(() => {
    getGreeting();
    calculatePercentage();
    navigation.setOptions({
      // headerShown: false,
      title: "Debt Manager",
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

  const handleUserPress = async (userId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedUserId(expandedUserId === userId ? null : userId);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={getUsers} />
        }
      >
        <Animated.View entering={FadeIn} style={styles.greetingContainer}>
          <Text style={styles.greetingText}>{greeting},</Text>
          <Text style={styles.nameText}>
            {auth?.currentUser?.displayName?.split(" ")[0]}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown} style={styles.chartContainer}>
          <PieChart
            data={[
              {
                key: `Borrowed: ₹${parseFloat(currentUser.amountBorrowed || 0).toFixed(2)}`,
                count: borrowedPercentage,
                color: "#F7B267",
              },
              {
                key: `Lent: ₹${parseFloat(currentUser.amountLent || 0).toFixed(2)}`,
                count: lentPercentage,
                color: "#F4845F",
              },
            ]}
            length={300}
          />
        </Animated.View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Money lent so far</Text>
            <Text style={styles.currencySymbol}>{"\u20B9"}</Text>
            <Text style={styles.amount}>
              {parseFloat(currentUser.amountLent).toFixed(2)}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Money Borrowed so far</Text>
            <Text style={styles.currencySymbol}>{"\u20B9"}</Text>
            <Text style={styles.amount}>
              {parseFloat(currentUser.amountBorrowed).toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.userListContainer}>
          <Text style={styles.userListTitle}>Click to copy unique ID</Text>
          {refreshing ? (
            <Text style={styles.loadingText}>Loading data...</Text>
          ) : (
            <View>
              {users.map((user, index) => (
                <Animated.View
                  entering={FadeInDown.delay(index * 100)}
                  key={user.userRefId}
                  style={styles.userItem}
                >
                  <TouchableOpacity 
                    onPress={() => handleUserPress(user.userRefId)}
                    style={styles.userItemContent}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.userName}>{user.userFullName}</Text>
                    <View style={styles.rightContent}>
                      <TouchableOpacity 
                        onPress={(e) => {
                          e.stopPropagation();
                          copyId(user);
                        }}
                        style={styles.copyButton}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="copy-outline" size={22} color="#F4845F" />
                      </TouchableOpacity>
                      <Ionicons 
                        name={expandedUserId === user.userRefId ? "chevron-up" : "chevron-down"} 
                        size={22} 
                        color="#666" 
                      />
                    </View>
                  </TouchableOpacity>
                  
                  {expandedUserId === user.userRefId && (
                    <Animated.View 
                      entering={FadeInUp.duration(200)}
                      style={styles.userDetails}
                    >
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Email:</Text>
                        <Text style={styles.detailText}>{user.userEmail}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>ID:</Text>
                        <Text style={styles.detailText}>{user.userRefId}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Amount Lent:</Text>
                        <Text style={styles.detailText}>₹{parseFloat(user.amountLent || 0).toFixed(2)}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Amount Borrowed:</Text>
                        <Text style={styles.detailText}>₹{parseFloat(user.amountBorrowed || 0).toFixed(2)}</Text>
                      </View>
                    </Animated.View>
                  )}
                </Animated.View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    height: '100%',
  },
  greetingContainer: {
    padding: 20,
    marginTop: 20,
  },
  greetingText: {
    fontSize: 36,
    fontWeight: '600',
    color: '#333',
  },
  nameText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#F4845F',
  },
  chartContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    marginTop: 20,
  },
  statBox: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    width: '45%',
  },
  statLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
    textAlign: 'center',
  },
  currencySymbol: {
    fontSize: 48,
    fontWeight: '700',
    textAlign: 'center',
    color: '#F4845F',
    marginVertical: 10,
  },
  amount: {
    fontSize: 24,
    textAlign: 'center',
    color: '#333',
  },
  userListContainer: {
    padding: 20,
  },
  userListTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
  },
  userItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  copyButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFF5F5',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userDetails: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  detailText: {
    fontSize: 14,
    color: '#333',
  },
});

export default Home;
