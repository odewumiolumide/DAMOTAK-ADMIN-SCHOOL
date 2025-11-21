// ----------------- IMPORTS -----------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// ----------------- FIREBASE CONFIG -----------------
const firebaseConfig = {
  apiKey: "AIzaSyCiy2VaTfnuO7eEPL0_kD_WIHcDMB2T6Xs",
  authDomain: "damotak-international-da-230d5.firebaseapp.com",
  databaseURL: "https://damotak-international-da-230d5-default-rtdb.firebaseio.com",
  projectId: "damotak-international-da-230d5",
  storageBucket: "damotak-international-da-230d5.firebasestorage.app",
  messagingSenderId: "947496867501",
  appId: "1:947496867501:web:44857bbf3d3ac0ada2d824"
};

// ----------------- INITIALIZE -----------------
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ----------------- LOGIN HANDLER -----------------
const loginForm = document.getElementById("loginForm");
const modal = document.getElementById("errorModal");
const closeModal = document.getElementById("closeModal");

// Show green success text
const successBox = document.createElement("p");
successBox.style.color = "green";
successBox.style.textAlign = "center";
successBox.style.fontWeight = "600";
successBox.style.marginTop = "15px";
successBox.style.display = "none";
successBox.textContent = "Login successful!";
document.querySelector(".login-section").appendChild(successBox);

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
      await signInWithEmailAndPassword(auth, email, password);

      // Show green success message
      successBox.style.display = "block";

      sessionStorage.setItem("adminLoggedIn", "true");

      setTimeout(() => {
        window.location.href = "admin-dashboard.html";
      }, 1200); // small delay so user can see message
    } catch (error) {
      if (modal) modal.style.display = "flex";
    }
  });
}

// ----------------- CLOSE MODAL -----------------
if (closeModal) {
  closeModal.addEventListener("click", () => {
    modal.style.display = "none";
  });
}

window.addEventListener("click", (e) => {
  if (e.target === modal) modal.style.display = "none";
});

// ----------------- REDIRECT LOGGED USERS -----------------
onAuthStateChanged(auth, (user) => {
  const page = window.location.pathname.split("/").pop().toLowerCase();

  if (user && page === "index.html") {
    window.location.href = "admin-dashboard.html";
  }
});

// ----------------------------------------------------------
// 🔐 AUTO LOGOUT AFTER 1 MINUTE INACTIVITY
// ----------------------------------------------------------

const AUTO_LOGOUT_TIME = 1 * 60 * 1000; // 1 minute
let inactivityTimer;

const currentPage = window.location.pathname.split("/").pop().toLowerCase();

// Only protect dashboard pages (not login)
if (currentPage !== "index.html" && currentPage !== "") {

  function resetTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(autoLogout, AUTO_LOGOUT_TIME);
  }

  function autoLogout() {
    sessionStorage.removeItem("adminLoggedIn");

    signOut(auth)
      .then(() => {
        alert("You have been logged out due to inactivity.");
        window.location.href = "index.html";
      })
      .catch(() => {
        window.location.href = "index.html";
      });
  }

  // Reset timer on all user activity
  window.onload = resetTimer;
  document.onmousemove = resetTimer;
  document.onkeydown = resetTimer;
  document.onclick = resetTimer;
  document.onscroll = resetTimer;
}
