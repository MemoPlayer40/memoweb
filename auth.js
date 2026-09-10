import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

const status = document.getElementById("userStatus");
const logoutBtn = document.getElementById("logoutBtn");
const authLinks = document.getElementById("authLinks");

onAuthStateChanged(auth, async (user) => {

  if (user) {

    let displayName = user.displayName || user.email || "User";

    try {

      const profileRef = doc(db, "users", user.uid);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {

        const profile = profileSnap.data();

        if (profile.nickname) {
          displayName = profile.nickname;
        }

      }

    } catch (error) {

      console.error("Error loading profile:", error);

    }

    if (status) {
      status.textContent = `Logged in as ${displayName}`;
    }

    if (logoutBtn) {
      logoutBtn.style.display = "inline-block";
    }

    if (authLinks) {
      authLinks.style.display = "none";
    }

  } else {

    if (status) {
      status.textContent = "Not logged in";
    }

    if (logoutBtn) {
      logoutBtn.style.display = "none";
    }

    if (authLinks) {
      authLinks.style.display = "block";
    }

  }

});

if (logoutBtn) {

  logoutBtn.addEventListener("click", async () => {

    try {

      await signOut(auth);

      location.reload();

    } catch (error) {

      alert(error.message);

    }

  });

}
