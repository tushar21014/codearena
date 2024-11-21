// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth,GoogleAuthProvider} from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAf3Zqv1yZZvp65lzvMHQsJykjprOpZrcU",
  authDomain: "zomaggy-383610.firebaseapp.com",
  projectId: "zomaggy-383610",
  storageBucket: "zomaggy-383610.appspot.com",
  messagingSenderId: "763938473855",
  appId: "1:763938473855:web:450aeec15c405fb8c3fc4a",
  measurementId: "G-8JDCY2XS0H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app)
const provider = new GoogleAuthProvider();
export {auth,provider}