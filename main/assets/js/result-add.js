// result-add.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { saveResult } from "./result-save.js";

// ---------------------------
// Firebase Configs
// ---------------------------
const studentFirebaseConfig = {
  apiKey: "AIzaSyCz8GoyOi7wviejSPG2CGkOYvEwsaAWX0w",
  authDomain: "damotak-students-database.firebaseapp.com",
  databaseURL: "https://damotak-students-database-default-rtdb.firebaseio.com/",
  projectId: "damotak-students-database",
  storageBucket: "damotak-students-database.firebasestorage.app",
  messagingSenderId: "806502646085",
  appId: "1:806502646085:web:36a97f1d1e0ff4bab6be2c"
};

const resultFirebaseConfig = {
  apiKey: "AIzaSyDcrh8wVfeVwnOKnt-AcWDMOmxqNWe_0Uw",
  authDomain: "damotak-result-database.firebaseapp.com",
  databaseURL: "https://damotak-result-database-default-rtdb.firebaseio.com/",
  projectId: "damotak-result-database",
  storageBucket: "damotak-result-database.firebasestorage.app",
  messagingSenderId: "413754960869",
  appId: "1:413754960869:web:b3f51b6aaa0c667af0dd0c"
};

// ---------------------------
// Initialize Firebase Apps
// ---------------------------
const studentApp = initializeApp(studentFirebaseConfig, "studentDB");
const studentDb = getDatabase(studentApp);

const resultApp = initializeApp(resultFirebaseConfig, "resultDB");
const resultDb = getDatabase(resultApp);

// ---------------------------
// Page Setup
// ---------------------------
const urlParams = new URLSearchParams(window.location.search);
const studentID = urlParams.get("id");
document.getElementById("dateIssued").textContent = new Date().toLocaleDateString();

const tbody = document.getElementById("resultTableBody");

// ---------------------------
// Notification Helper
// ---------------------------
function showNotification(message, success) {
  const msgDiv = document.getElementById("notificationMessage");
  if (!msgDiv) return alert(message);
  msgDiv.textContent = message;
  msgDiv.style.color = success ? "green" : "red";
  new bootstrap.Modal(document.getElementById("notificationModal")).show();
}

// ---------------------------
// Load Student Info
// ---------------------------
async function loadStudent() {
  try {
    const snap = await get(ref(studentDb, `Students/${studentID}`));
    if (snap.exists()) {
      const data = snap.val();
      document.getElementById("studentName").textContent = data.name || "N/A";
      document.getElementById("studentClass").textContent = data.studentClass || "N/A";
      document.getElementById("studentGender").textContent = data.gender || "N/A";
    } else {
      showNotification("❌ Student not found!", false);
    }
  } catch (err) {
    showNotification("⚠️ Error loading student info: " + err.message, false);
  }
}
loadStudent();

// ---------------------------
// Table Functions
// ---------------------------
function addSubjectRow(subject = "", ca = "", exam = "", total = "0", grade = "-", remark = "-", readOnly = false) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td class="sl">${tbody.children.length + 1}</td>
    <td><input type="text" class="form-control subject-input" value="${subject}" ${readOnly ? "readonly" : ""}></td>
    <td><input type="number" class="form-control ca-input" value="${ca}" min="0" max="30" ${readOnly ? "readonly" : ""}></td>
    <td><input type="number" class="form-control exam-input" value="${exam}" min="0" max="70" ${readOnly ? "readonly" : ""}></td>
    <td class="total-score">${total}</td>
    <td class="grade">${grade}</td>
    <td class="remark">${remark}</td>
    <td class="text-center">
      ${readOnly ? "" : '<button class="btn btn-danger btn-sm remove-row">✕</button>'}
    </td>
  `;
  tbody.appendChild(row);
  refreshRowNumbers();
}

function refreshRowNumbers() {
  Array.from(tbody.children).forEach((tr, i) => tr.querySelector(".sl").textContent = i + 1);
}

// ---------------------------
// Add / Remove Rows
// ---------------------------
document.getElementById("addRow").addEventListener("click", () => addSubjectRow());
tbody.addEventListener("click", (e) => {
  if (e.target.classList.contains("remove-row")) {
    e.target.closest("tr").remove();
    refreshRowNumbers();
  }
});

// ---------------------------
// Auto Calculate Grades
// ---------------------------
tbody.addEventListener("input", (e) => {
  if (e.target.classList.contains("ca-input") || e.target.classList.contains("exam-input")) {
    const tr = e.target.closest("tr");
    const ca = parseInt(tr.querySelector(".ca-input").value) || 0;
    const exam = parseInt(tr.querySelector(".exam-input").value) || 0;
    const total = ca + exam;
    let grade = "-", remark = "-";
    if (total >= 70) { grade = "A"; remark = "Excellent"; }
    else if (total >= 60) { grade = "B"; remark = "Very Good"; }
    else if (total >= 50) { grade = "C"; remark = "Good"; }
    else if (total >= 40) { grade = "D"; remark = "Fair"; }
    else { grade = "F"; remark = "Fail"; }
    tr.querySelector(".total-score").textContent = total;
    tr.querySelector(".grade").textContent = grade;
    tr.querySelector(".remark").textContent = remark;
  }
});

// ---------------------------
// Load Previous Results
// ---------------------------
async function loadPreviousResults() {
  const term = document.getElementById("studentTerm")?.value?.trim();
  if (!term || !studentID) return;

  try {
    const snapshot = await get(ref(resultDb, `Results/${studentID}/${term}`));
    tbody.innerHTML = "";

    if (snapshot.exists()) {
      const data = snapshot.val();
      const subjects = data.Subjects || {};
      Object.keys(subjects).forEach(sub => {
        const s = subjects[sub];
        addSubjectRow(s.subject || sub, s.ca || 0, s.exam || 0, s.total || 0, s.grade || "-", s.remark || "-", true);
      });

      document.getElementById("classTeacherRemark").value = data.classTeacherRemark || "";
      document.getElementById("headTeacherRemark").value = data.headTeacherRemark || "";
       document.getElementById("workEdu").value = data.workEdu || "";
        document.getElementById("artEdu").value = data.artEdu || "";
        document.getElementById("healthEdu").value = data.healthEdu || "";
        
      showNotification("✅ Loaded previous results!", true);
    } else {
      addSubjectRow();
      showNotification("ℹ️ No previous result found.", false);
    }
  } catch (err) {
    console.error(err);
    showNotification("⚠️ Failed to load results: " + err.message, false);
  }
}

document.getElementById("studentTerm").addEventListener("change", loadPreviousResults);
window.addEventListener("load", () => setTimeout(loadPreviousResults, 200));

// ---------------------------
// Save Result
// ---------------------------
document.getElementById("saveResult").addEventListener("click", async () => {
  const term = document.getElementById("studentTerm").value.trim();
  const classTeacherRemark = document.getElementById("classTeacherRemark").value.trim();
  const headTeacherRemark = document.getElementById("headTeacherRemark").value.trim();
  const workEdu = document.getElementById("workEdu").value.trim();
  const artEdu = document.getElementById("artEdu").value.trim();
  const healthEdu = document.getElementById("healthEdu").value.trim();


  const subjects = [];
  tbody.querySelectorAll("tr").forEach(tr => {
    const subject = tr.querySelector(".subject-input").value.trim();
    const ca = parseInt(tr.querySelector(".ca-input").value) || 0;
    const exam = parseInt(tr.querySelector(".exam-input").value) || 0;
    const total = ca + exam;
    const grade = tr.querySelector(".grade").textContent || "-";
    const remark = tr.querySelector(".remark").textContent || "-";
    if (subject && !tr.querySelector(".subject-input").readOnly) {
      subjects.push({ subject, ca, exam, total, grade, remark });
    }
  });

  if (!subjects.length) return showNotification("⚠️ Add at least one new subject.", false);

  const resultData = {
    studentID,
    term,
    classTeacherRemark,
    headTeacherRemark,
    workEdu,
    artEdu,
    healthEdu,
    dateIssued: new Date().toLocaleDateString(),
    subjects
  };

  const res = await saveResult(studentID, term, resultData);
  showNotification(res.message, res.success);
  if (res.success) setTimeout(loadPreviousResults, 400);
});

//Print code //

// ---------------------------
// Print Result Function (Auto Print After 2s + Dynamic File Name)
// ---------------------------
document.getElementById("PrintResult").addEventListener("click", () => {
  const modal = new bootstrap.Modal(document.getElementById("printConfirmModal"));
  modal.show();

  document.getElementById("confirmPrintBtn").onclick = () => {
    modal.hide();

    // Hide "Add New Subject" button temporarily
    const addSubjectBtn = document.getElementById("addRow");
    if (addSubjectBtn) addSubjectBtn.style.display = "none";

    // Clone and clean result table
    const resultTable = document.getElementById("resultTable").cloneNode(true);

    // Remove "Action" column
    const headerRow = resultTable.querySelector("thead tr");
    if (headerRow && headerRow.lastElementChild.textContent.trim().toLowerCase() === "action") {
      headerRow.removeChild(headerRow.lastElementChild);
    }

    // Remove "Action" cells in body
    resultTable.querySelectorAll("tbody tr").forEach(row => {
      if (row.lastElementChild) row.removeChild(row.lastElementChild);
    });

    // Convert inputs to plain text
    resultTable.querySelectorAll("input, select").forEach(el => {
      const td = el.parentElement;
      td.textContent = el.value || "-";
    });

    // Get student info
    const studentName = document.getElementById("studentName").textContent.trim();
    const studentGender = document.getElementById("studentGender").textContent.trim();
    const studentClass = document.getElementById("studentClass").textContent.trim();
    const term = document.getElementById("studentTerm").value || document.getElementById("studentTerm").textContent.trim();
    const dateIssued = document.getElementById("dateIssued").textContent.trim();
    const sessionYear = document.getElementById("sessionYear")?.textContent.trim() || "2025/2026";
    const classRemark = document.getElementById("classTeacherRemark").value || "-";
    const headRemark = document.getElementById("headTeacherRemark").value || "-";
    const workEdu = document.getElementById("workEdu")?.value || "-";
    const artEdu = document.getElementById("artEdu")?.value || "-";
    const healthEdu = document.getElementById("healthEdu")?.value || "-";
    

    // Calculate total and average
    const totals = Array.from(resultTable.querySelectorAll(".total-score")).map(td => parseInt(td.textContent) || 0);
    const totalScore = totals.reduce((a, b) => a + b, 0);
    const avgScore = totals.length ? (totalScore / totals.length).toFixed(2) : "0.00";

    // Build print window
    const printWindow = window.open("", "_blank", "width=900,height=1000");
    printWindow.document.open();
    printWindow.document.write(`
     <html>
  <head>
    <title>Student Result | Damotak International School</title>
    <style>
      /* ====== PAGE BASE ====== */
      body {
        font-family: "Segoe UI", "Calibri", sans-serif;
        margin: 40px;
        background: linear-gradient(135deg, #f7f9fc, #eef2f7);
        color: #2c3e50;
        line-height: 1.6;
      }

      /* ====== HEADER ====== */
      .header {
        text-align: center;
        padding-bottom: 15px;
        margin-bottom: 35px;
        position: relative;
      }

      .header::after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 80%;
        height: 3px;
        background: linear-gradient(to right, #b89b5e, #2a4d69, #b89b5e);
        border-radius: 5px;
      }

      .header img {
        width: 100px;
        display: block;
        margin: 0 auto 10px;
        border-radius: 8px;
      }

      .header h3 {
        margin: 5px 0;
        font-size: 28px;
        text-transform: uppercase;
        color: #1c3d72;
        letter-spacing: 1px;
      }

      .header p {
        margin: 2px 0;
        font-size: 14px;
        color: #555;
      }

      /* ====== SECTION TITLES ====== */
      .section-title {
        font-weight: 700;
        margin-top: 25px;
        margin-bottom: 10px;
        font-size: 15.5px;
        color: #1c3d72;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        border-left: 6px solid #b89b5e;
        padding-left: 12px;
      }

      /* ====== TABLE STYLES ====== */
      .info-table,
      .table,
      .summary-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
        font-size: 13.5px;
        background: #ffffff;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.07);
      }

      .info-table td {
        padding: 8px 12px;
        color: #2c3e50;
      }

      .table th {
        background: linear-gradient(90deg, #1c3d72, #325fa4);
        color: #fff;
        padding: 10px;
        text-align: center;
        font-weight: 600;
        border: 1px solid #d0d7e4;
        letter-spacing: 0.5px;
      }

      .table td {
        border: 1px solid #e2e6ec;
        padding: 8px;
        text-align: center;
      }

      .table tr:nth-child(even) td {
        background-color: #f7faff;
      }

      .summary-table td {
        padding: 8px 12px;
      }

      .summary-table tr:nth-child(odd) td {
        background-color: #f8f9fb;
      }

      /* ====== SIGNATURES ====== */
      .signatures {
        display: flex;
        justify-content: space-between;
        margin-top: 50px;
      }

      .sign {
        border-top: 2px solid #1c3d72;
        padding-top: 8px;
        font-size: 13px;
        text-align: center;
        width: 45%;
        color: #1c3d72;
        font-weight: 600;
      }

      /* ====== HIGHLIGHTED TEXT ====== */
      strong {
        color: #1c3d72;
      }

      /* ====== WATERMARK ====== */
      body::before {
        content: "";
        position: fixed;
        top: 50%;
        left: 50%;
        width: 450px;
        height: 450px;
        background: url('assets/images/auth/Damotak Logo.png') no-repeat center center;
        background-size: 60%;
        opacity: 0.05;
        transform: translate(-50%, -50%);
        z-index: -1;
      }

      /* ====== PRINT ====== */
      @media print {
        body {
          background: #fff;
        }
        @page {
          size: A4;
          margin: 1cm;
        }
        .table th {
          background-color: #000 !important;
          color: #fff !important;
          -webkit-print-color-adjust: exact;
        }
      }
    </style>
  </head>

  <body>
    <div class="header">
      <img src="assets/images/auth/Damotak Logo.png" alt="School Logo">
      <h3>Damotak International School</h3>
      <p>Ring Road, Old Oba Road | Email: admin@gmail.com | +23456789</p>
      <p><strong>Academic Session:</strong> ${sessionYear}</p>
    </div>

    <table class="info-table">
      <tr><td><strong>Name:</strong> ${studentName}</td><td><strong>Gender:</strong> ${studentGender}</td></tr>
      <tr><td><strong>Class:</strong> ${studentClass}</td><td><strong>Term:</strong> ${term}</td></tr>
      <tr><td><strong>Student ID:</strong> ${studentID}</td><td><strong>Date Issued:</strong> ${dateIssued}</td></tr>
      <tr><td colspan="2"><strong>Issued By:</strong> Damotak Admin</td></tr>
    </table>

    <div class="section-title">Subjects and Scores</div>
    ${resultTable.outerHTML}

    <div class="section-title">Summary</div>
    <table class="summary-table">
      <tr><td><strong>Total Marks:</strong></td><td>${totalScore}</td></tr>
      <tr><td><strong>Average Score:</strong></td><td>${avgScore}</td></tr>
    </table>

    <div class="section-title">Remarks</div>
    <table class="table">
      <tr><th>Class Teacher Remark</th><td>${classRemark}</td></tr>
      <tr><th>Head Teacher Remark</th><td>${headRemark}</td></tr>
    </table>

    <div class="section-title">Co-Scholastic Areas (A–C Grade)</div>
    <table class="table">
      <tr><th>Area</th><th>Grade</th></tr>
      <tr><td>Work Education / Prevocational Education</td><td>${workEdu}</td></tr>
      <tr><td>Art Education</td><td>${artEdu}</td></tr>
      <tr><td>Health & Physical Education</td><td>${healthEdu}</td></tr>
    </table>

    <br><br>
    <div class="signatures">
      <div class="sign">Class Teacher’s Signature</div>
      <div class="sign">Headmaster’s Signature</div>
    </div>
  </body>
</html>

    `);
    printWindow.document.close();

    // ✅ Print logic after delay with dynamic file name
    printWindow.onload = () => {
      const fileTitle = `${studentName.replace(/\s+/g, "_")}_${studentID}_Result`;
      printWindow.document.title = fileTitle;

      // Wait 2 seconds before showing print dialog
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 2000);

      printWindow.onafterprint = () => {
        printWindow.close();
        location.href = "result-add.html";
      };
      printWindow.onbeforeunload = () => {
        location.href = "result-add.html";
      };
    };

    // Restore Add New Subject button after print
    setTimeout(() => {
      if (addSubjectBtn) addSubjectBtn.style.display = "inline-block";
    }, 3000);
  };
});

// ---------------------------
// Navigation Buttons
// ---------------------------
document.getElementById("backBtn").addEventListener("click", () => window.location.href = "result-list.html");
