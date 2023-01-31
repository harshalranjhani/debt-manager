import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBk8HAf5ITGJLpqLa3JgY88sr5ApZqxg2k",
  authDomain: "debt-manager-c99a3.firebaseapp.com",
  projectId: "debt-manager-c99a3",
  storageBucket: "debt-manager-c99a3.appspot.com",
  messagingSenderId: "836099664339",
  appId: "1:836099664339:web:0f183e1eab75b612ef2726",
};

let app;

if (firebase.apps.length === 0) {
  app = firebase.initializeApp(firebaseConfig);
} else {
  app = firebase.app();
}

const db = app.firestore();
const auth = firebase.auth();

export { db, auth };
