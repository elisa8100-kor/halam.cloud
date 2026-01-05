// Firebase 기본
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";

// Firestore (게임 데이터용)
import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// 🔑 당신의 Firebase 설정 (이미 정확함)
const firebaseConfig = {
  apiKey: "AIzaSyBncmDAfEEOlcHGn8D7FtJmg0gU04IrsII",
  authDomain: "carcassonne-henrry.firebaseapp.com",
  projectId: "carcassonne-henrry",
  storageBucket: "carcassonne-henrry.firebasestorage.app",
  messagingSenderId: "377078203300",
  appId: "1:377078203300:web:aad3af4e8075ad9e3bf731"
};

// Firebase 시작
export const app = initializeApp(firebaseConfig);

// Firestore 연결
export const db = getFirestore(app);

// 🎲 가족 게임 방 ID
export const ROOM_ID = "family-room";

// 방이 없으면 자동 생성
export async function initRoom() {
  const roomRef = doc(db, "rooms", ROOM_ID);
  const snap = await getDoc(roomRef);

  if (!snap.exists()) {
    await setDoc(roomRef, {
      board: {
        "0,0": { type: 0, rot: 0 }
      },
      turn: "A",
      scores: {
        A: 0,
        B: 0
      }
    });
  }

  return roomRef;
}
