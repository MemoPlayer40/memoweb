import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const status = document.getElementById("userStatus");
const logoutBtn = document.getElementById("logoutBtn");
const authLinks = document.getElementById("authLinks");

onAuthStateChanged(auth, (user) => {
  if (user) {
    status.textContent = `Logged in as ${user.email}`;
    logoutBtn.style.display = "inline-block";
    authLinks.style.display = "none";
  } else {
    status.textContent = "Not logged in";
    logoutBtn.style.display = "none";
    authLinks.style.display = "block";
  }
});

logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    location.reload();
  } catch (error) {
    alert(error.message);
  }
});
