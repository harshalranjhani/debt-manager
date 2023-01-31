import { View, Text, SafeAreaView, ScrollView } from "react-native";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { TouchableOpacity } from "react-native";
import { Avatar } from "react-native-elements";
import { auth } from "../firebase";
import PieChart from "react-native-expo-pie-chart";

const Home = ({ navigation }) => {
  const [greeting, setGreeting] = useState("");
  const signOutUser = () => {
    auth.signOut().then(() => {
      navigation.replace("Login");
    });
  };
  let today, curHr;

  useEffect(() => {
    today = new Date();
    curHr = today.getHours();

    if (curHr < 12) {
      setGreeting("Good Morning");
    } else if (curHr < 18) {
      setGreeting("Good Afternoon");
    } else {
      setGreeting("Good Evening");
    }
  }, [today, curHr]);

  useLayoutEffect(() => {
    navigation.setOptions({
      // headerShown: false,
      title: "Debt Manager",
      headerStyle: { backgroundColor: "#38B000" },
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
      <ScrollView className="h-[100%]">
        <View>
          <Text className="text-4xl mx-10 mt-10">{greeting},</Text>
          <Text className="text-4xl ml-10">
            {auth?.currentUser?.displayName.split(" ")[0]}
          </Text>
        </View>
        <View className="mt-10">
          <PieChart
            data={[
              // {
              //   key: "First Data",
              //   count: 20,
              //   color: "#004B23",
              // },
              {
                key: "Second Data",
                count: 33,
                color: "#70E000",
              },
              {
                key: "Third Data",
                count: 40,
                color: "#004B23",
              },
            ]}
            length={300}
          />
        </View>
        <View className="flex flex-row space-x-20 m-5">
          <View className="flex flex-col">
            <Text className="font-bold ">Money lent so far</Text>
            <Text className="font-bold text-6xl text-center my-2">
              {"\u20B9"}
            </Text>
            <Text className="font-normal text-3xl m-0 text-center">0.00</Text>
          </View>
          <View className="flex flex-col">
            <Text className="font-bold ">Money Borrowed so far</Text>
            <Text className="font-bold text-6xl text-center my-2">
              {"\u20B9"}
            </Text>
            <Text className="font-normal text-3xl m-0 text-center">0.00</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;
