import { View, Text } from "react-native";
import React from "react";

const UpdateProfileScreen = ({ navigation }) => {
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerBackTitle: "Back",
      headerShown: true,
      headerStyle: { backgroundColor: "#F25C54" },
      headerTitleStyle: { color: "black" },
      headerTintColor: "black",
    });
  }, [navigation]);

  return (
    <View>
      <Text>UpdateProfileScreen</Text>
    </View>
  );
};

export default UpdateProfileScreen;
