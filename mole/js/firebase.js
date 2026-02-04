import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDOLOV-JRU5iKKyM2BMHS794mkuRuBHIRI",
  authDomain: "mole-lederboard.firebaseapp.com",
  projectId: "mole-lederboard",
  storageBucket: "mole-lederboard.firebasestorage.app",
  messagingSenderId: "178724392884",
  appId: "1:178724392884:web:e8fb56533306967e06ace1"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const LB_COLLECTION = "leaderboard";
