// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration

const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: "chat--application-158a5.firebaseapp.com",
  projectId: "chat--application-158a5",
  storageBucket: "chat--application-158a5.appspot.com",
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID_KEY,
  appId: "1:138139203489:web:b35ec663510b55d2777de0",
  measurementId: "G-PG080PGR5X",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth();
export const storage = getStorage(app);
