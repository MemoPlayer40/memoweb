import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export async function saveProfile(user, realName, nickname) {
  await setDoc(doc(db, "users", user.uid), {
    realName,
    nickname,
    email: user.email || "",
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export async function loadProfile(user) {
  const snap = await getDoc(doc(db, "users", user.uid));
  return snap.exists() ? snap.data() : null;
}

export { auth, db, onAuthStateChanged };
