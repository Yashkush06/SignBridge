import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAmQHVa9moE6Q3pHdbyXYXMMzWP6kvDmiI",
  authDomain: "signbridge-e17a9.firebaseapp.com",
  databaseURL: "https://signbridge-e17a9-default-rtdb.firebaseio.com",
  projectId: "signbridge-e17a9",
  storageBucket: "signbridge-e17a9.firebasestorage.app",
  messagingSenderId: "140365294849",
  appId: "1:140365294849:web:6e6e6e7ca6da2a268a7f00",
  measurementId: "G-PREB3GPCGQ"
};

// Initialize Firebase (Singleton pattern to prevent re-initialization in Next.js dev mode)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
