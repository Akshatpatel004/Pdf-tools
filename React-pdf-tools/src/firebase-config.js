import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"; // Add this

const firebaseConfig = {
  apiKey: "AIzaSyA0DKvNNSDpLqu34E9HqtwqOxTdXGAMU6A",
  authDomain: "flexxpdf-57939.firebaseapp.com",
  projectId: "flexxpdf-57939",
  storageBucket: "flexxpdf-57939.firebasestorage.app",
  messagingSenderId: "276989829150",
  appId: "1:276989829150:web:d4f4303a548d0282640e0f",
  measurementId: "G-B3SKMJCD22"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize and export Auth
export const auth = getAuth(app);
