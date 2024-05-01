import { initializeApp } from "firebase/app";
import { getAuth } from "@firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCk62N766ezBiMM4iFTHEdub2pZMQ19f-U",
  authDomain: "shipshapechatapp.firebaseapp.com",
  projectId: "shipshapechatapp",
  storageBucket: "shipshapechatapp.appspot.com",
  messagingSenderId: "102874816209",
  appId: "1:102874816209:web:4f5d945df4e78fe067eff0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth()
export const db = getFirestore()
export const storage = getStorage()