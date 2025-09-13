// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDc6SpMeSwA5fbxeEBRTUhRmCqE5Sc384s",
    authDomain: "rhythmdancewear-a88d4.firebaseapp.com",
    projectId: "rhythmdancewear-a88d4",
    storageBucket: "rhythmdancewear-a88d4.firebasestorage.app",
    messagingSenderId: "72574916115",
    appId: "1:72574916115:web:dcbce2cc44f96327c5d1e6"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);