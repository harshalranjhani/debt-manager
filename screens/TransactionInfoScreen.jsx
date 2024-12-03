import { View, Text, ScrollView, StyleSheet, Alert, Animated } from "react-native";
import { Button } from "react-native-elements";
import React, { useEffect, useState, useRef } from "react";
import { useRoute } from "@react-navigation/native";
import { Avatar } from "react-native-elements";
import { auth, db } from "../firebase";
import * as Haptics from 'expo-haptics';
import { SharedElement } from 'react-navigation-shared-element';

const TransactionInfoScreen = ({ navigation, route }) => {
  const [transactedUser, setTransactedUser] = useState({});
  const [isLoading, setIsLoading] = useState(false);
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

  // Add animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Animate content on mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    getTransactedUser();
    navigation.setOptions({
      title: `Transaction Info`,
      headerBackTitle: "Back",
    });
  }, []);

  const deleteTransaction = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setIsLoading(true);
      if (auth?.currentUser?.uid !== route.params.transaction.transactionAuthor) {
        Alert.alert("Only transaction authors can delete the transaction.");
        setIsLoading(false);
        return;
      }
      db.collection("users")
        .where("userRefId", "==", route.params.transaction.transactionAuthor)
        .get()
        .then((snapshot) =>
          snapshot.forEach((doc) =>
            route.params.transaction.transactionType === "debtor"
              ? doc.ref.update({
                  amountBorrowed:
                    doc.data().amountBorrowed - route.params.transaction.amount,
                })
              : doc.ref.update({
                  amountLent:
                    doc.data().amountLent - route.params.transaction.amount,
                })
          )
        )
        .then(() => {
          db.collection("users")
            .where("userRefId", "==", route.params.transaction.transactionWith)
            .get()
            .then((snapshot) =>
              snapshot.forEach((doc) =>
                route.params.transaction.transactionType === "debtor"
                  ? doc.ref.update({
                      amountLent:
                        doc.data().amountLent - route.params.transaction.amount,
                    })
                  : doc.ref.update({
                      amountBorrowed:
                        doc.data().amountBorrowed -
                        route.params.transaction.amount,
                    })
              )
            );
        })
        .then(() => {
          setIsLoading(false);
          db.collection("transactions")
            .doc(route.params.transaction.id)
            .delete()
            .then(() => {
              navigation.replace('Content', {
                screen: 'Transactions'
              });
            });
        })
        .catch((e) => {
          Alert.alert(e.message);
          setIsLoading(false);
        });
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(e.message);
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarWrapper}>
            <Avatar
              size={100}
              rounded
              source={{ uri: route.params.transaction.transactionAuthorPhoto }}
              containerStyle={styles.avatar}
            />
            <Text style={styles.avatarName}>
              {route.params.transaction.transactionAuthorName}
            </Text>
          </View>
          <View style={styles.avatarWrapper}>
            <Avatar
              size={100}
              rounded
              source={{ uri: route.params.transaction.transactionWithPhoto }}
              containerStyle={styles.avatar}
            />
            <Text style={styles.avatarName}>
              {route.params.transaction.transactionWithAuthorName}
            </Text>
          </View>
        </View>

        <View style={styles.amountContainer}>
          <Text style={styles.amountText}>{`₹${route.params.transaction.amount}`}</Text>
        </View>

        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>
            {route.params.transaction.description.replace(/(?:\n|\n)/g, " ")}
          </Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>
            Debtor:{" "}
            <Text style={styles.infoValue}>
              {route.params.transaction.transactionType == "debtor"
                ? route.params.transaction.transactionAuthorName
                : route.params.transaction.transactionWithAuthorName}
            </Text>
          </Text>
          <Text style={styles.infoLabel}>
            Financier:{" "}
            <Text style={styles.infoValue}>
              {route.params.transaction.transactionType == "financier"
                ? route.params.transaction.transactionAuthorName
                : route.params.transaction.transactionWithAuthorName}
            </Text>
          </Text>
        </View>

        <View style={styles.dateContainer}>
          <Text style={styles.dateLabel}>Transaction Initiated</Text>
          <Text style={styles.dateText}>
            {route?.params?.transaction?.created?.toDate().toDateString()}
          </Text>
          <Text style={styles.timeText}>
            {route?.params?.transaction?.created?.toDate().toLocaleTimeString("en-US")}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            disabled={isLoading}
            containerStyle={styles.button}
            titleStyle={styles.buttonTitle}
            buttonStyle={styles.buttonStyle}
            onPress={deleteTransaction}
            title={`${isLoading ? "Processing..." : "Delete Transaction"}`}
          />
        </View>
      </Animated.View>
    </ScrollView>
  );
};

export default TransactionInfoScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  avatarContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginHorizontal: 16,
  },
  avatar: {
    borderWidth: 3,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarName: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  amountContainer: {
    paddingVertical: 24,
  },
  amountText: {
    fontSize: 48,
    fontWeight: '700',
    textAlign: 'center',
    color: '#2D3748',
  },
  descriptionContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: '#4A5568',
  },
  infoContainer: {
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  infoLabel: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    color: '#2D3748',
  },
  infoValue: {
    color: '#4A5568',
    fontWeight: '400',
  },
  dateContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  dateLabel: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#2D3748',
    fontWeight: '500',
  },
  timeText: {
    fontSize: 14,
    color: '#718096',
    marginTop: 4,
  },
  buttonContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  button: {
    width: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonStyle: {
    backgroundColor: '#F25C54',
    paddingVertical: 12,
    borderRadius: 12,
  },
});
