import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"; // Add this

const firebaseConfig = {
  apiKey: "AIzaSyDHs-2Xrur-Zg0kWeOG68XsZLYW2baP68g",
  authDomain: "flexxpdf-a3800.firebaseapp.com",
  projectId: "flexxpdf-a3800",
  storageBucket: "flexxpdf-a3800.firebasestorage.app",
  messagingSenderId: "2657036383",
  appId: "1:2657036383:web:b023fd1e5c3c423b2693ea",
  measurementId: "G-YW7DPVDGHS"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize and export Auth
export const auth = getAuth(app);