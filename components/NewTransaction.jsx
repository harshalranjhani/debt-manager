import { View, Text } from "react-native";
import React, { useLayoutEffect } from "react";
import { FaHome } from "react-icons/fa";
import { SafeAreaView } from "react-native";

const NewTransaction = ({ navigation }) => {
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);
  return (
    <View>
      <SafeAreaView>
        <Text>NewTransaction</Text>
      </SafeAreaView>
    </View>
  );
};

export default NewTransaction;
