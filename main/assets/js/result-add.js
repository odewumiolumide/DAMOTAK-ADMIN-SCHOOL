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
// Notification Helper (Updated)
// ---------------------------
function showNotification(message, success) {
  const msgDiv = document.getElementById("notificationMessage");
  if (!msgDiv) return alert(message);

  msgDiv.textContent = message;
  msgDiv.style.color = success ? "green" : "red";

  const modalEl = document.getElementById("notificationModal");
  let modal = bootstrap.Modal.getInstance(modalEl);

  if (!modal) modal = new bootstrap.Modal(modalEl);

  modal.show();

  // Remove lingering backdrop when modal closes
  modalEl.addEventListener('hidden.bs.modal', () => {
    document.body.classList.remove('modal-open');
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) backdrop.remove();
  }, { once: true }); // ensure this runs only once per show
}

// ---------------------------
// Term Change Logic (Updated)
// ---------------------------
document.getElementById("studentTerm").addEventListener("change", async (e) => {
    const term = e.target.value;

    // Hide sections for attendance and remarks
    const attendanceDetailsContainer = document.querySelector('.p-3.mt-4.border-top'); // Attendance details
    const remarksContainer = document.querySelectorAll('.p-3.mt-4.border-top')[1]; // Remarks section

    if (term === "Yearly Summary") {
        yearlySummaryContainer.style.display = "block"; // Show yearly summary
        document.getElementById("resultTable").parentElement.style.display = "none"; // Hide term table
        await loadYearlySummary(); // Load yearly summary
        document.getElementById("printButton").style.display = "block"; // Show print button
        document.getElementById("addRow").style.display = "none"; // Hide add row button
        attendanceDetailsContainer.style.display = "none"; // Hide attendance details
        remarksContainer.style.display = "none"; // Hide remarks
    } else {
        yearlySummaryContainer.style.display = "none"; // Hide yearly summary
        document.getElementById("printButton").style.display = "none"; // Hide print button
        document.getElementById("addRow").style.display = "block"; // Show add row button
        document.getElementById("resultTable").parentElement.style.display = "block"; // Show term table
        await loadPreviousResults(term); // Load selected term
        attendanceDetailsContainer.style.display = "block"; // Show attendance details
        remarksContainer.style.display = "block"; // Show remarks
    }
});
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
   <td><input type="number" class="form-control mark-ca" value="30" readonly></td>
   <td><input type="number" class="form-control ca-input" value="${ca}" min="0" max="30" ${readOnly ? "readonly" : ""}></td>
   <td><input type="number" class="form-control mark-exam" value="70" readonly></td>
   <td><input type="number" class="form-control exam-input" value="${exam}" min="0" max="70" ${readOnly ? "readonly" : ""}></td>
   <td class="total-score">${total}</td>
   <td class="grade">${grade}</td>
   <td class="remark">${remark}</td>
   <td class="text-center">${readOnly ? "" : '<button class="btn btn-danger btn-sm remove-row">✕</button>'}</td>
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
// Grade & Score Validation
// ---------------------------
tbody.addEventListener("input", (e) => {
  const target = e.target;
  const row = target.closest("tr");
  const caInput = row.querySelector(".ca-input");
  const examInput = row.querySelector(".exam-input");
  const totalCell = row.querySelector(".total-score");

  // CA Input Validation
  if (target.classList.contains("ca-input")) {
    let val = parseInt(caInput.value) || 0;
    if (val < 0) val = 0;
    if (val > 30) {
      alert("❌ CA cannot be more than 30. Resetting to 0.");
      caInput.value = 0;
      examInput.value = 0;
      totalCell.textContent = 0;
      row.querySelector(".grade").textContent = "-";
      row.querySelector(".remark").textContent = "-";
      return;
    }
    caInput.value = val;
    totalCell.textContent = val + (parseInt(examInput.value) || 0);
  }

  // Exam Input Validation
  if (target.classList.contains("exam-input")) {
    let val = parseInt(examInput.value) || 0;
    if (val < 0) val = 0;
    if (val > 70) {
      alert("❌ Exam cannot be more than 70. Resetting to 0.");
      examInput.value = 0;
      caInput.value = 0;
      totalCell.textContent = 0;
      row.querySelector(".grade").textContent = "-";
      row.querySelector(".remark").textContent = "-";
      return;
    }
    examInput.value = val;
    totalCell.textContent = val + (parseInt(caInput.value) || 0);
  }
});

// ---------------------------
// Prevent Saving if Invalid Grade
// ---------------------------
document.getElementById("saveResult").addEventListener("click", () => {
  let invalidGrade = false;
  tbody.querySelectorAll(".grade-input").forEach(input => {
    const val = input.value.toUpperCase();
    if (val && !["A","B","C","D","E"].includes(val)) invalidGrade = true;
  });

  if (invalidGrade) {
    return alert("❌ Cannot save. Some grade inputs are invalid! Only A, B, C, D, E are allowed.");
  }

  // ... your save logic here ...
});

// ---------------------------
// Attendance Input Validation
// ---------------------------
const attendanceInputs = ["daysOpened", "daysPresent", "daysAbsent", "studentHeight", "studentWeight"];
attendanceInputs.forEach(id => {
  const input = document.getElementById(id);

  input.addEventListener("input", (e) => {
    let val = e.target.value.replace(/\D/g, ""); // remove non-digit chars
    if (val.length > 3) val = val.slice(0, 3);   // max 3 digits
    e.target.value = val;
  });

  input.addEventListener("blur", (e) => {
    if (e.target.value !== "") e.target.value = parseInt(e.target.value, 10);
  });
});

// Attendance calculation: Days Opened = Present + Absent
const daysOpenedInput = document.getElementById("daysOpened");
const daysPresentInput = document.getElementById("daysPresent");
const daysAbsentInput = document.getElementById("daysAbsent");

function validateAttendance() {
  const opened = parseInt(daysOpenedInput.value) || 0;
  const present = parseInt(daysPresentInput.value) || 0;
  const absent = parseInt(daysAbsentInput.value) || 0;

  if (opened !== (present + absent)) {
    daysOpenedInput.setCustomValidity("Days Opened must equal Days Present + Days Absent");
    daysOpenedInput.reportValidity();
  } else {
    daysOpenedInput.setCustomValidity("");
  }
}

[daysOpenedInput, daysPresentInput, daysAbsentInput].forEach(input => {
  input.addEventListener("input", validateAttendance);
});

// ---------------------------
// Affective & Psychomotor Domain Validation
// ---------------------------
const remarkFields = [
  "Neatness", "Politeness", "Punctuality", "Responsibility",
  "Teamwork", "Leadership", "Helping", "Honesty", "Participation"
];

remarkFields.forEach(id => {
  const textarea = document.getElementById(id);
  textarea.addEventListener("input", (e) => {
    let val = e.target.value.toUpperCase();
    if (val.length > 1 || !["A", "B", "C", "D", "E"].includes(val)) {
      alert(`❌ Invalid input for ${id}! Only a single character A, B, C, D, or E is allowed.`);
      e.target.value = "";
    } else {
      e.target.value = val;
    }
  });
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
       document.getElementById("Neatness").value = data.Neatness || "";
        document.getElementById("Politeness").value = data.Politeness || "";
        document.getElementById("Punctuality").value = data.Punctuality || "";
         document.getElementById("Responsibility").value = data.Responsibility || "";
          document.getElementById("Teamwork").value = data.Teamwork || "";
           document.getElementById("Leadership").value = data.Leadership || "";
            document.getElementById("Helping").value = data.Helping || "";
             document.getElementById("Honesty").value = data.Honesty || "";
               document.getElementById("Participation").value = data.Participation || "";
                document.getElementById("daysOpened").value = data.daysOpened || "";
                 document.getElementById("daysPresent").value = data.daysPresent || "";
                  document.getElementById("daysAbsent").value = data.daysAbsent || "";
                   document.getElementById("studentHeight").value = data.studentHeight || "";
                    document.getElementById("studentWeight").value = data.studentWeight || "";
                     document.getElementById("nextTermDate").value = data.nextTermDate || "";
        
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
  const Neatness = document.getElementById("Neatness").value.trim();
  const Politeness = document.getElementById("Politeness").value.trim();
  const Punctuality = document.getElementById("Punctuality").value.trim();
   const Responsibility = document.getElementById("Responsibility").value.trim();
    const Teamwork = document.getElementById("Teamwork").value.trim();
     const Leadership = document.getElementById("Leadership").value.trim();
      const Helping = document.getElementById("Helping").value.trim();
       const Honesty = document.getElementById("Honesty").value.trim();
        const Participation = document.getElementById("Participation").value.trim();
        const daysOpened = document.getElementById("daysOpened").value.trim();
        const daysPresent = document.getElementById("daysPresent").value.trim();
        const daysAbsent = document.getElementById("daysAbsent").value.trim();
        const studentHeight = document.getElementById("studentHeight").value.trim();
        const studentWeight = document.getElementById("studentWeight").value.trim();
         const nextTermDate = document.getElementById("nextTermDate").value.trim();
        


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

  if (!subjects.length && !classTeacherRemark.length) {
    return showNotification("⚠️ Add at least one new subject or comment before saving.", false);
  }
  
 

  const resultData = {
    studentID,
    term,
    classTeacherRemark,
    headTeacherRemark,
    Neatness,
    Politeness,
    Punctuality,
    Responsibility,
    Teamwork,
    Leadership,
    Helping,
    Honesty,
    Participation,
    daysOpened,
    daysPresent,
    daysAbsent,
    studentHeight,
    studentWeight,
    nextTermDate,
    dateIssued: new Date().toLocaleDateString(),
    subjects
  };

  const res = await saveResult(studentID, term, resultData);
  showNotification(res.message, res.success);
  if (res.success) setTimeout(loadPreviousResults, 400);
});

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
    const Neatness = document.getElementById("Neatness")?.value || "-";
    const Politeness = document.getElementById("Politeness")?.value || "-";
    const Punctuality = document.getElementById("Punctuality")?.value || "-";
    const Responsibility = document.getElementById("Responsibility")?.value || "-";
    const Leadership = document.getElementById("Leadership")?.value || "-";
    const Helping = document.getElementById("Helping")?.value || "-";
    const Honesty = document.getElementById("Honesty")?.value || "-";
    const Teamwork = document.getElementById("Teamwork")?.value || "-";
    const daysOpened = document.getElementById("daysOpened")?.value || "-";
    const daysPresent = document.getElementById("daysPresent")?.value || "-";
    const daysAbsent = document.getElementById("daysAbsent")?.value || "-";
    const studentHeight = document.getElementById("studentHeight")?.value || "-";
    const studentWeight = document.getElementById("studentWeight")?.value || "-";
    const nextTermDate = document.getElementById("nextTermDate")?.value || "-";

    // Calculate total and average
    const totals = Array.from(resultTable.querySelectorAll(".total-score")).map(td => parseInt(td.textContent) || 0);
    const totalScore = totals.reduce((a, b) => a + b, 0);
    const avgScore = totals.length ? (totalScore / totals.length).toFixed(2) : "0.00";

    // Build print window
    const printWindow = window.open("", "_blank", "width=900,height=1000");
    printWindow.document.open();
    printWindow.document.write(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Student Result | Damotak International School</title>
<style>
  body {
    font-family: "Segoe UI", "Calibri", sans-serif;
    background: linear-gradient(135deg, #f7f9fc, #eef2f7);
    color: #2c3e50;
    margin: 30px;
    line-height: 1.6;
    position: relative;
  }

  /* Watermark */
  body::before {
    content: "";
    position: fixed;
    top: 50%;
    left: 50%;
    width: 750px;
    height: 750px;
    background: url('assets/images/auth/Damotak Logo.png') no-repeat center center;
    background-size: 60%;
    opacity: 0.05;
    transform: translate(-50%, -50%);
    z-index: -1;
  }

  .school-logo {
  border: 3px solid #0047AB; /* change color as you like */
  border-radius: 12px;        /* rounded corners, 0 for sharp edges */
  padding: 5px;               /* space between border and image */
  width: 150px;               /* adjust size */
  height: auto;               /* maintain aspect ratio */
  box-shadow: 0 4px 8px rgba(0,0,0,0.2); /* subtle shadow for sharp look */
  display: block;             /* center with margin if needed */
  margin: 20px auto;          /* centers image horizontally */
}

  .header {
    text-align: center;
    margin-bottom: 35px;
    position: relative;
  }
  .header img { width: 100px; margin-bottom: 10px; }
  .header h3 { margin: 5px 0; color: #1c3d72; text-transform: uppercase; letter-spacing: 1px; }
  .header p { margin: 2px 0; font-size: 13px; }

  .header::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 80%;
    height: 3px;
    background: linear-gradient(to right, #1c3d72, #2a4d69);
    border-radius: 5px;
  }
  
  .col h4,
.col ul {
  text-transform: uppercase; /* Make text uppercase */
}
 

  .row { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 25px; }
  .col {
    flex: 1; min-width: 250px; background: #fff;
    border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.07);
    padding: 15px 20px;
  }
  .col h4 { margin-bottom: 8px; font-size: 14px; text-transform: uppercase; color: #fff; background: #1c3d72; padding: 5px 10px; border-radius: 5px 5px 0 0; }
  .col ul { list-style: none; padding: 10px 0 0 0; margin: 0; }
  .col ul li { margin: 4px 0; font-size: 13px; }
  .col ul li strong { color: #1c3d72; }

  table {
    width: 100%; border-collapse: collapse; margin-bottom: 25px;
    background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  }
  th {
    background: #1c3d72; color: #fff; padding: 6px; font-size: 13px; text-align: center;
  }
  td {
    text-align: center; padding: 6px; border-bottom: 1px solid #eef2f7; font-size: 13px;
  }
  tr:nth-child(even) td { background: #f9fbff; }
  .grade-tick { color: #1c3d72; font-size: 16px; }

  .section-title {
    font-weight: 700; margin: 25px 0 10px 0; font-size: 16px;
    color: #1c3d72; text-transform: uppercase; letter-spacing: 0.5px;
    border-left: 5px solid #1c3d72; padding-left: 10px;
  }

  .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
  .sign {
    border-top: 2px solid #1c3d72; width: 45%; text-align: center;
    padding-top: 8px; font-size: 13px; color: #1c3d72; font-weight: 600;
  }

  @media print {
    body { background: #fff; -webkit-print-color-adjust: exact; }
    @page { size: A4; margin: 1cm; }
  }
    
  #resultTable td:nth-child(2),
  #resultTable th:nth-child(2),
  #resultTableBody input[name="subject"],
  #resultTableBody select[name="subject"] {
    text-transform: uppercase !important;
  }

</style>
</head>
<body>

<div class="header">
  <img src="assets/images/auth/Damotak Logo.png" alt="School Logo" class="school-logo">

  <h3>Damotak International School</h3>
  <p>ADDRESS 1: NEW OBA ROAD, ILE-IDANDE AREA, OKE-ONITEA</p>
  <p>ADDRESS 2: AYEKALE IYALODE ROAD, ILE-IDANDE AREA, OKE-ONITEA</p>
  <p>Email: DamotakInc@gmail.com | 08033880730</p>
  <p><strong>Academic Session:</strong> ${sessionYear}</p>
</div>

<div class="row">
  <div class="col">
    <h4>Student Details</h4>
    <ul>
      <li><strong>Name:</strong> ${studentName}</li>
      <li><strong>Gender:</strong> ${studentGender}</li>
      <li><strong>Class:</strong> ${studentClass}</li>
      <li><strong>Term:</strong> ${term}</li>
      <li><strong>Student ID:</strong> ${studentID}</li>
      <li><strong>Date Issued:</strong> ${dateIssued}</li>
    </ul>
  </div>
  <div class="col">
    <h4>Attendance & Physical Record</h4>
    <ul>
      <li><strong>Days Opened:</strong> ${daysOpened}</li>
      <li><strong>Days Present:</strong> ${daysPresent}</li>
      <li><strong>Days Absent:</strong> ${daysAbsent}</li>
      <li><strong>Height:</strong> ${studentHeight} cm</li>
      <li><strong>Weight:</strong> ${studentWeight} kg</li>
      <li><strong>Next Term Begins:</strong> ${nextTermDate}</li>
    </ul>
  </div>
</div>

<div class="section-title">Subjects and Scores</div>
${resultTable.outerHTML}

<div class="row">
  <div class="col">
    <h4>Summary</h4>
    <ul>
      <li><strong>Total Marks:</strong> ${totalScore}</li>
      <li><strong>Average Score:</strong> ${avgScore}%</li>
    </ul>
  </div>
  <div class="col">
    <h4>Remarks</h4>
    <ul>
      <li><strong>Class Teacher:</strong> ${classRemark}</li>
      <li><strong>Head Teacher:</strong> ${headRemark}</li>
    </ul>
  </div>
</div>

<!-- AFFECTIVE & PSYCHOMOTOR -->

<div class="section-title">Affective & Psychomotor Domain (A - E)</div>

<table>

<thead>

<tr>

<th>Area</th>

<th>A</th>

<th>B</th>

<th>C</th>

<th>D</th>

<th>E</th>

</tr>

</thead>

<tbody>

<tr>

<td>Neatness</td>

<td class="grade-tick">${Neatness=='A'?'✔️':''}</td>

<td class="grade-tick">${Neatness=='B'?'✔️':''}</td>

<td class="grade-tick">${Neatness=='C'?'✔️':''}</td>

<td class="grade-tick">${Neatness=='D'?'✔️':''}</td>

<td class="grade-tick">${Neatness=='E'?'✔️':''}</td>

</tr>

<tr>

<td>Politeness</td>

<td class="grade-tick">${Politeness=='A'?'✔️':''}</td>

<td class="grade-tick">${Politeness=='B'?'✔️':''}</td>

<td class="grade-tick">${Politeness=='C'?'✔️':''}</td>

<td class="grade-tick">${Politeness=='D'?'✔️':''}</td>

<td class="grade-tick">${Politeness=='E'?'✔️':''}</td>

</tr>

<tr>

<td>Punctuality</td>

<td class="grade-tick">${Punctuality=='A'?'✔️':''}</td>

<td class="grade-tick">${Punctuality=='B'?'✔️':''}</td>

<td class="grade-tick">${Punctuality=='C'?'✔️':''}</td>

<td class="grade-tick">${Punctuality=='D'?'✔️':''}</td>

<td class="grade-tick">${Punctuality=='E'?'✔️':''}</td>

</tr>

<tr>

<td>Responsibility</td>

<td class="grade-tick">${Responsibility=='A'?'✔️':''}</td>

<td class="grade-tick">${Responsibility=='B'?'✔️':''}</td>

<td class="grade-tick">${Responsibility=='C'?'✔️':''}</td>

<td class="grade-tick">${Responsibility=='D'?'✔️':''}</td>

<td class="grade-tick">${Responsibility=='E'?'✔️':''}</td>

</tr>

<tr>

<td>Teamwork</td>

<td class="grade-tick">${Teamwork=='A'?'✔️':''}</td>

<td class="grade-tick">${Teamwork=='B'?'✔️':''}</td>

<td class="grade-tick">${Teamwork=='C'?'✔️':''}</td>

<td class="grade-tick">${Teamwork=='D'?'✔️':''}</td>

<td class="grade-tick">${Teamwork=='E'?'✔️':''}</td>

</tr>

<tr>

<td>Leadership</td>

<td class="grade-tick">${Leadership=='A'?'✔️':''}</td>

<td class="grade-tick">${Leadership=='B'?'✔️':''}</td>

<td class="grade-tick">${Leadership=='C'?'✔️':''}</td>

<td class="grade-tick">${Leadership=='D'?'✔️':''}</td>

<td class="grade-tick">${Leadership=='E'?'✔️':''}</td>

</tr>

<tr>

<td>Helping Others</td>

<td class="grade-tick">${Helping=='A'?'✔️':''}</td>

<td class="grade-tick">${Helping=='B'?'✔️':''}</td>

<td class="grade-tick">${Helping=='C'?'✔️':''}</td>

<td class="grade-tick">${Helping=='D'?'✔️':''}</td>

<td class="grade-tick">${Helping=='E'?'✔️':''}</td>

</tr>

</tbody>

</table>

<!-- ADDITIONAL GRADING TABLES -->

<div class="section-title">System Grading</div>

<table>

<thead>

<tr>

<th>Grade</th>

<th>Score Range</th>

<th>Description</th>

</tr>

</thead>

<tbody>

<tr><td>A</td><td>75-100</td><td>Excellent</td></tr>

<tr><td>B</td><td>60-74</td><td>Very Good</td></tr>

<tr><td>C</td><td>50-59</td><td>Good</td></tr>

<tr><td>D</td><td>40-49</td><td>Pass</td></tr>

<tr><td>E</td><td>0-39</td><td>Fail</td></tr>

</tbody>

</table>

<BR>

<BR>

<div class="signatures">
  <div class="sign">Class Teacher’s Signature</div>
  <div class="sign">Headmaster’s Signature</div>
</div>

</body>
</html>
    `);
    printWindow.document.close();

    // Print logic
    printWindow.onload = () => {
      const fileTitle = `${studentName.replace(/\s+/g, "_")}_${studentID}_Result`;
      printWindow.document.title = fileTitle;

      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 2000);

      printWindow.onafterprint = printWindow.onbeforeunload = () => {
        printWindow.close();
        location.href = "result-add.html";
      };
    };

    setTimeout(() => {
      if (addSubjectBtn) addSubjectBtn.style.display = "inline-block";
    }, 3000);
  };
});

// ---------------------------
// Global Variables
// ---------------------------
let studentName = "";
let studentGender = "";
let studentClass = "";
let sessionYear = "";
let term = "Yearly Summary";
let avgScore = 0;
let totalScoreValue = 0;
let promotionStatus = "";

// ---------------------------
// Print Result Function
// ---------------------------
document.getElementById("printButton").addEventListener("click", () => {
   // Ensure all student info is populated
    studentName = document.getElementById("studentName")?.value || document.getElementById("studentName")?.textContent || "-";
    studentGender = document.getElementById("studentGender")?.value || document.getElementById("studentGender")?.textContent || "-";
    studentClass = document.getElementById("studentClass")?.value || document.getElementById("studentClass")?.textContent || "-";
    sessionYear = document.getElementById("sessionYear")?.value || document.getElementById("sessionYear")?.textContent || "-";
    promotionStatus = document.getElementById("promotionStatus")?.value || "-";
    
    const resultTable = document.getElementById("yearlySummaryTable").cloneNode(true);

    const printWindow = window.open("", "_blank", "width=900,height=1000");
    printWindow.document.open();
    printWindow.document.write(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Student Result | Damotak International School</title>
   <style>
  body {
    font-family: "Segoe UI", "Calibri", sans-serif;
    background: linear-gradient(135deg, #f7f9fc, #eef2f7);
    color: #2c3e50;
    margin: 30px;
    line-height: 1.6;
    position: relative;
  }

  /* Watermark */
  body::before {
    content: "";
    position: fixed;
    top: 50%;
    left: 50%;
    width: 750px;
    height: 750px;
    background: url('assets/images/auth/Damotak Logo.png') no-repeat center center;
    background-size: 60%;
    opacity: 0.05;
    transform: translate(-50%, -50%);
    z-index: -1;
  }

  .school-logo {
  border: 3px solid #0047AB; /* change color as you like */
  border-radius: 12px;        /* rounded corners, 0 for sharp edges */
  padding: 5px;               /* space between border and image */
  width: 150px;               /* adjust size */
  height: auto;               /* maintain aspect ratio */
  box-shadow: 0 4px 8px rgba(0,0,0,0.2); /* subtle shadow for sharp look */
  display: block;             /* center with margin if needed */
  margin: 20px auto;          /* centers image horizontally */
}

  .header {
    text-align: center;
    margin-bottom: 35px;
    position: relative;
  }
  .header img { width: 100px; margin-bottom: 10px; }
  .header h3 { margin: 5px 0; color: #1c3d72; text-transform: uppercase; letter-spacing: 1px; }
  .header p { margin: 2px 0; font-size: 13px; }

  .header::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 80%;
    height: 3px;
    background: linear-gradient(to right, #1c3d72, #2a4d69);
    border-radius: 5px;
  }
  
  .col h4,
.col ul {
  text-transform: uppercase; /* Make text uppercase */
}
 

  .row { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 25px; }
  .col {
    flex: 1; min-width: 250px; background: #fff;
    border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.07);
    padding: 15px 20px;
  }
  .col h4 { margin-bottom: 8px; font-size: 14px; text-transform: uppercase; color: #fff; background: #1c3d72; padding: 5px 10px; border-radius: 5px 5px 0 0; }
  .col ul { list-style: none; padding: 10px 0 0 0; margin: 0; }
  .col ul li { margin: 4px 0; font-size: 13px; }
  .col ul li strong { color: #1c3d72; }

  table {
    width: 100%; border-collapse: collapse; margin-bottom: 25px;
    background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  }
  th {
    background: #1c3d72; color: #fff; padding: 6px; font-size: 13px; text-align: center;
  }
  td {
    text-align: center; padding: 6px; border-bottom: 1px solid #eef2f7; font-size: 13px;
  }
  tr:nth-child(even) td { background: #f9fbff; }
  .grade-tick { color: #1c3d72; font-size: 16px; }

  .section-title {
    font-weight: 700; margin: 25px 0 10px 0; font-size: 16px;
    color: #1c3d72; text-transform: uppercase; letter-spacing: 0.5px;
    border-left: 5px solid #1c3d72; padding-left: 10px;
  }

  .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
  .sign {
    border-top: 2px solid #1c3d72; width: 45%; text-align: center;
    padding-top: 8px; font-size: 13px; color: #1c3d72; font-weight: 600;
  }

  @media print {
    body { background: #fff; -webkit-print-color-adjust: exact; }
    @page { size: A4; margin: 1cm; }
  }
    
  #resultTable td:nth-child(2),
  #resultTable th:nth-child(2),
  #resultTableBody input[name="subject"],
  #resultTableBody select[name="subject"] {
    text-transform: uppercase !important;
  }

</style>
</head>
<body>
    <div class="header">
        <img src="assets/images/auth/Damotak Logo.png" alt="School Logo" class="school-logo">
        <h3>Damotak International School</h3>
        <p>ADDRESS 1: NEW OBA ROAD, ILE-IDANDE AREA, OKE-ONITEA</p>
        <p>ADDRESS 2: AYEKALE IYALODE ROAD, ILE-IDANDE AREA, OKE-ONITEA</p>
        <p>Email: DamotakInc@gmail.com | 08033880730</p>
        <p><strong>Academic Session:</strong> ${sessionYear}</p>
    </div>

    <div class="row">
        <div class="col">
            <h4>Student Details</h4>
            <ul>
               <li><strong>Name:</strong> ${studentName}</li>
<li><strong>Gender:</strong> ${studentGender}</li>
<li><strong>Class:</strong> ${studentClass}</li>
<li><strong>Term:</strong> ${term}</li>
<li><strong>Student ID:</strong> ${studentID}</li>
<li><strong>Date Issued:</strong> ${new Date().toLocaleDateString()}</li>
            </ul>
        </div>
    </div>

    <div class="section-title">Subjects and Scores</div>
    ${resultTable.outerHTML}

    <div class="row">
        <div class="col">
            <h4>Summary</h4>
            <ul>
                <li><strong>Total Marks:</strong> ${totalScoreValue}</li>
<li><strong>Average Score:</strong> ${avgScore}%</li>
            </ul>
        </div>
        <div class="col">
            <h4>Promotion Status</h4>
            <ul>
               <li><strong>Promotion Status:</strong> ${promotionStatus}</li>
            </ul>
        </div>
    </div>

    <div class="signatures">
        <div class="sign">Class Teacher’s Signature</div>
        <div class="sign">Headmaster’s Signature</div>
    </div>
</body>
</html>
    `);
    printWindow.document.close();

    printWindow.onload = () => {
        const fileTitle = `${studentName.replace(/\s+/g, "_")}_${studentID}_Result`;
        printWindow.document.title = fileTitle;
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 1000);

        printWindow.onafterprint = printWindow.onbeforeunload = () => {
            printWindow.close();
            location.href = "result-add.html";
        };
    };
});


// ---------------------------
// Load Yearly Summary
// ---------------------------
async function loadYearlySummary() {
    yearlySummaryBody.innerHTML = ""; // Clear old rows
    const terms = ["First Term","Second Term","Third Term"];
    const termResults = {};
    let totalScore = 0;
    let subjectCount = 0;

    // Fetch results for each term
    for (let t of terms) {
        const snapshot = await get(ref(resultDb, `Results/${studentID}/${t}`));
        termResults[t] = snapshot.exists() ? snapshot.val().Subjects : {};
    }

    // Collect unique subjects
    const subjectSet = new Set();
    terms.forEach(term => {
        Object.keys(termResults[term] || {}).forEach(sub => {
            subjectSet.add(sub.trim().toLowerCase());
        });
    });
    const allSubjects = Array.from(subjectSet);

    allSubjects.forEach((subjectKey, index) => {
        const firstTermSub = Object.keys(termResults["First Term"] || {}).find(s => s.trim().toLowerCase()===subjectKey) || "";
        const secondTermSub = Object.keys(termResults["Second Term"] || {}).find(s => s.trim().toLowerCase()===subjectKey) || "";
        const thirdTermSub = Object.keys(termResults["Third Term"] || {}).find(s => s.trim().toLowerCase()===subjectKey) || "";

        const firstTerm = termResults["First Term"][firstTermSub]?.total || 0;
        const secondTerm = termResults["Second Term"][secondTermSub]?.total || 0;
        const thirdTerm = termResults["Third Term"][thirdTermSub]?.total || 0;

        const avgTotal = ((firstTerm+secondTerm+thirdTerm)/3).toFixed(2);

        totalScore += parseFloat(avgTotal);
        subjectCount++;

        // Assign grade & remark
        let grade, remark;
        if(avgTotal>=70){ grade="A"; remark="Excellent"; }
        else if(avgTotal>=60){ grade="B"; remark="Very Good"; }
        else if(avgTotal>=50){ grade="C"; remark="Good"; }
        else if(avgTotal>=40){ grade="D"; remark="Fair"; }
        else{ grade="F"; remark="Fail"; }

        const row = document.createElement("tr");
        row.innerHTML = `
        <td>${index+1}</td>
        <td>${firstTermSub || secondTermSub || thirdTermSub || subjectKey}</td>
        <td>${firstTerm}</td>
        <td>${secondTerm}</td>
        <td>${thirdTerm}</td>
        <td>${avgTotal}</td>
        <td>${grade}</td>
        <td>${remark}</td>
        `;
        yearlySummaryBody.appendChild(row);
    });

    if(allSubjects.length===0){
        yearlySummaryBody.innerHTML=`
        <tr>
        <td colspan="8" style="text-align:center;color:#d9534f;font-weight:bold;">ℹ️ No previous result found.</td>
        </tr>`;
    }

    const overallAverage=(totalScore/subjectCount).toFixed(2);

    if(overallAverage>=80){ promotionStatus="Promoted to the Next Class with Distinction"; }
    else if(overallAverage>=50){ promotionStatus="Promoted to the Next Class"; }
    else if(overallAverage>=40){ promotionStatus="Promotion on Trial"; }
    else{ promotionStatus="Fail"; }

    // Update globals for printing
    totalScoreValue = totalScore;
    avgScore = overallAverage;

    document.getElementById("promotionStatus").value=promotionStatus;
}

// ---------------------------
// Navigation Buttons
// ---------------------------
document.getElementById("backBtn").addEventListener("click", () => window.location.href = "result-list.html");