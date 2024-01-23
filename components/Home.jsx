import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Alert,
} from "react-native";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { TouchableOpacity } from "react-native";
import { Avatar } from "react-native-elements";
import { auth, db } from "../firebase";
import PieChart from "react-native-expo-pie-chart";
import Ionicons from "react-native-vector-icons/Ionicons";
import * as Clipboard from "expo-clipboard";

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
    await Clipboard.setStringAsync(user.userRefId);
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
    <SafeAreaView>
      <ScrollView
        className="h-[100%]"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={getUsers} />
        }
      >
        <View>
          <Text className="text-4xl mx-10 mt-10">{greeting},</Text>
          <Text className="text-4xl ml-10">
            {auth?.currentUser?.displayName?.split(" ")[0]}
          </Text>
        </View>
        <View className="mt-10">
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
        </View>
        <View className="flex flex-row space-x-14 m-5">
          <View className="flex flex-col">
            <Text className="font-bold ">Money lent so far</Text>
            <Text className="font-bold text-6xl text-center my-2">
              {"\u20B9"}
            </Text>
            <Text className="font-normal text-3xl m-0 text-center">
              {parseFloat(currentUser.amountLent).toFixed(2)}
            </Text>
          </View>
          <View className="flex flex-col ">
            <Text className="font-bold ">Money Borrowed so far</Text>
            <Text className="font-bold text-6xl text-center my-2">
              {"\u20B9"}
            </Text>
            <Text className="font-normal text-3xl m-0 text-center">
              {parseFloat(currentUser.amountBorrowed).toFixed(2)}
            </Text>
          </View>
        </View>
        <View>
          <Text className="font-black m-10 text-2xl text-center">
            Click to copy unique ID
          </Text>
          <View>
            {refreshing ? (
              <Text className="text-center text-xl mx-4">Loading data...</Text>
            ) : (
              <View>
                {users.map((user) => (
                  <View
                    key={user.userRefId}
                    className="flex justify-around m-2"
                  >
                    <Text className="text-xl font-semibold mx-4">
                      {user.userFullName}{" "}
                      <Text>
                        <Ionicons
                          onPress={copyId.bind(null, user)}
                          name={"copy"}
                          size={25}
                          color={"#F4845F"}
                        />{" "}
                      </Text>
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;
