import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {getAuth} from 'firebase/auth'
const firebaseConfig = {
  apiKey: "AIzaSyDUO8wp6pER1C0jneEYCnSRkvcc2UbQJ20",
  authDomain: "v1todo.firebaseapp.com",
  projectId: "v1todo",
  storageBucket: "v1todo.appspot.com",
  messagingSenderId: "659986184111",
  appId: "1:659986184111:web:9ae78da29ccae833a3a15a",
  measurementId: "G-DK592LBX05",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
