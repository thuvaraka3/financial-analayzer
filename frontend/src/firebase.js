import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyChIwrbALjT1j6_UALYsHmd2SJE17Lzs4E",
  authDomain: "financial-analayzer.firebaseapp.com",
  projectId: "financial-analayzer",
  storageBucket: "financial-analayzer.firebasestorage.app",
  messagingSenderId: "711529665916",
  appId: "1:711529665916:web:1e4cabdb9da3a196fc80f9",
  measurementId: "G-1VRYBYYMJS"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
