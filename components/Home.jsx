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
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

const Home = ({ navigation }) => {
  const [greeting, setGreeting] = useState("");
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState({});
  const [refreshing, setRefreshing] = useState(true);
  const [lentPercentage, setLentPercentage] = useState(50);
  const [borrowedPercentage, setBorrowedPercentage] = useState(50);
  const signOutUser = () => {
    auth.signOut().then(() => {
      navigation.replace("Login");
    });
  };
  let today, curHr;

  const calculatePercentage = () => {
    const amountLent = currentUser.amountLent;
    const amountBorrowed = currentUser.amountBorrowed;

    const total = amountLent + amountBorrowed;
    const currentlentPercentage = (amountLent / total) * 100;
    const currentborrowedPercentage = (amountBorrowed / total) * 100;

    setLentPercentage(Math.ceil(currentlentPercentage));
    setBorrowedPercentage(Math.ceil(currentborrowedPercentage));
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
    getCurrentUser();
    getGreeting();
    calculatePercentage();
  }, [today, curHr]);

  const getCurrentUser = async () => {
    db.collection("users")
      .where("userRefId", "==", auth?.currentUser?.uid)
      .get()
      .then((snapshot) => {
        snapshot.forEach((doc) => setCurrentUser(doc.data()));
      })
      .catch((e) => Alert.alert(e.message));
  };

  const getUsers = async () => {
    setRefreshing(true);
    getCurrentUser();
    getGreeting();
    calculatePercentage();
    let usersArr = [];
    await db
      .collection("users")
      .get()
      .then((querySnapshot) =>
        querySnapshot.forEach((doc) => usersArr.push(doc.data()))
      )
      .then(() => {
        setUsers(usersArr);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      getUsers();
      calculatePercentage();
      getCurrentUser();
    });

    return unsubscribe;
  }, []);

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

  useEffect(()=>{
    calculatePercentage();
  },[lentPercentage, borrowedPercentage])

  useLayoutEffect(() => {
    getCurrentUser();
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
                key: "Money Borrowed",
                count: borrowedPercentage || 50,
                color: "#F7B267",
              },
              {
                key: "Money Lent",
                count: lentPercentage || 50,
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
                  <View style={styles.userItemContent}>
                    <Text style={styles.userName}>{user.userFullName}</Text>
                    <TouchableOpacity 
                      onPress={() => copyId(user)}
                      style={styles.copyButton}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="copy-outline" size={22} color="#F4845F" />
                    </TouchableOpacity>
                  </View>
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
});

export default Home;
