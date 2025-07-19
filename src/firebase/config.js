// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDfobOef6fbn49YaQGvwM7rBCFNkuIdfck",
  authDomain: "ichthustech-38142.firebaseapp.com",
  projectId: "ichthustech-38142",
  storageBucket: "ichthustech-38142.appspot.com",
  messagingSenderId: "270827746562",
  appId: "1:270827746562:web:3ae8bb269fae192a28fe1b",
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
