import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAXDbbjor008QU8ugT321cWYY14MfJEuWY",
  authDomain: "student-notes-app-65c4b.firebaseapp.com",
  projectId: "student-notes-app-65c4b",
  storageBucket: "student-notes-app-65c4b.firebasestorage.app",
  messagingSenderId: "873750830182",
  appId: "1:873750830182:web:c87e73faaa6d3f483b61a7",
  measurementId: "G-QWNN2JGCLE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase Services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);