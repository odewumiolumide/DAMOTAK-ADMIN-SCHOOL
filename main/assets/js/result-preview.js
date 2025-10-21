// preview.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// 🔥 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDcrh8wVfeVwnOKnt-AcWDMOmxqNWe_0Uw",
  authDomain: "damotak-result-database.firebaseapp.com",
  databaseURL: "https://damotak-result-database-default-rtdb.firebaseio.com/",
  projectId: "damotak-result-database",
  storageBucket: "damotak-result-database.firebasestorage.app",
  messagingSenderId: "413754960869",
  appId: "1:413754960869:web:b3f51b6aaa0c667af0dd0c"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 🧠 Helper: Get student ID & term from URL
const urlParams = new URLSearchParams(window.location.search);
const studentId = urlParams.get("id");
const term = urlParams.get("term");

// 🧾 Get DOM elements
const nameEl = document.querySelector(".student-name");
const genderEl = document.querySelector(".student-gender");
const classEl = document.querySelector(".student-class");
const termEl = document.querySelector(".student-term");
const tableBody = document.getElementById("subjectTableBody");
const daysMissedEl = document.getElementById("days-missed");
const daysAttendedEl = document.getElementById("days-attended");
const headReportEl = document.getElementById("head-report");
const classRemarkEl = document.getElementById("class-remark");
const studentIdEl = document.getElementById("student-id");
const dateIssuedEl = document.getElementById("date-issued");

// ⚙️ Load Result Data
async function loadResult() {
  try {
    if (!studentId || !term) {
      alert("⚠️ Missing student ID or term in URL!");
      return;
    }

    console.log("📦 Fetching result for:", studentId, term);
    const dbRef = ref(db, `Results/${studentId}/${term}`);
    const snapshot = await get(dbRef);

    if (!snapshot.exists()) {
      alert("❌ No result found for this student.");
      return;
    }

    const data = snapshot.val();
    console.log("✅ Data fetched:", data);

    // 🧩 Fill student info
    nameEl.textContent = data.name || "N/A";
    genderEl.textContent = data.gender || "N/A";
    classEl.textContent = data.class || "N/A";
    termEl.textContent = data.term || term;
    studentIdEl.textContent = studentId;
    dateIssuedEl.textContent = new Date().toLocaleDateString();

    // 📚 Subjects Table
    tableBody.innerHTML = ""; // Clear table before inserting new rows
    if (Array.isArray(data.subjects) && data.subjects.length > 0) {
      let i = 1;
      data.subjects.forEach(sub => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${i++}</td>
          <td>${sub.subject || "-"}</td>
          <td>${sub.ca || 0}</td>
          <td>${sub.exam || 0}</td>
          <td>${sub.total || 0}</td>
          <td>${sub.grade || "-"}</td>
          <td>${sub.remark || "-"}</td>
        `;
        tableBody.appendChild(tr);
      });
    } else {
      tableBody.innerHTML = `<tr><td colspan="7">No subjects found.</td></tr>`;
    }

    // 🗒️ Remarks
    daysMissedEl.textContent = data.daysMissed || "--";
    daysAttendedEl.textContent = data.daysAttended || "--";
    headReportEl.textContent = data.headTeacherRemark || "--";
    classRemarkEl.textContent = data.classTeacherRemark || "--";

  } catch (error) {
    console.error("🔥 Error loading result:", error);
    alert("⚠️ Failed to load result: " + error.message);
  }
}

// 🖨️ Print function (for Print button)
window.printInvoice = function () {
  window.print();
};

// 🚀 Load result on page ready
document.addEventListener("DOMContentLoaded", loadResult);
