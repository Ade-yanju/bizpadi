// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBH2iC2v7R4W2ilKUT4FwLzIV5FgaQK698",
  authDomain: "shopy-75c98.firebaseapp.com",
  projectId: "shopy-75c98",
  storageBucket: "shopy-75c98.firebasestorage.app",
  messagingSenderId: "994556097383",
  appId: "1:994556097383:web:beb36bdacac9b8e51575c2",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
