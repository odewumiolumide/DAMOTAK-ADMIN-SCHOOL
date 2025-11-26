// =============================
// result.js - Updated to match current database
// =============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, get, child, remove } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// -----------------------------
// Firebase Config
// -----------------------------
const firebaseConfig = {
  apiKey: "AIzaSyCz8GoyOi7wviejSPG2CGkOYvEwsaAWX0w",
  authDomain: "damotak-students-database.firebaseapp.com",
  databaseURL: "https://damotak-students-database-default-rtdb.firebaseio.com/",
  projectId: "damotak-students-database",
  storageBucket: "damotak-students-database.firebasestorage.app",
  messagingSenderId: "806502646085",
  appId: "1:806502646085:web:36a97f1d1e0ff4bab6be2c"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// -----------------------------
// DOM Elements
// -----------------------------
const tableBody = document.getElementById("resultsTableBody");
const classFilter = document.getElementById("classFilter");
const termFilter = document.getElementById("termFilter");
const searchInput = document.getElementById("searchInput");
const printAllBtn = document.getElementById("printAllBtn"); // Download button

// -----------------------------
// Fetch Students
// -----------------------------
async function fetchStudents() {
  try {
    const snapshot = await get(child(ref(db), "Students"));
    return snapshot.exists() ? snapshot.val() : {};
  } catch (error) {
    console.error(error);
    return {};
  }
}

// -----------------------------
// Render Student List
// -----------------------------
async function renderResults() {
  const allStudents = await fetchStudents();
  const searchTerm = searchInput.value.toLowerCase();
  const classVal = classFilter.value;
  const termVal = termFilter.value;

  const students = Object.values(allStudents).filter(student => {
    const matchSearch = student.name.toLowerCase().includes(searchTerm);
    const matchClass = classVal === "Classes" || !classVal ? true : student.studentClass === classVal;
    const matchTerm = termVal === "Terms" || !termVal ? true : student.term === termVal;
    return matchSearch && matchClass && matchTerm;
  });

  tableBody.innerHTML = "";
  if (students.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">No records found.</td></tr>`;
    return;
  }

  let count = 1;
  students.forEach(student => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${count++}</td>
      <td class="clickable">${student.studentID}</td>
      <td class="clickable">${student.name}</td>
      <td class="clickable">${student.studentClass}</td>
      <td class="clickable">${student.gender}</td>
      <td class="clickable">${student.term}</td>
      <td>
        <span class="badge ${student.active ? "bg-success" : "bg-secondary"}">
          ${student.active ? "Active" : "Inactive"}
        </span>
      </td>
      <td>
        <button class="btn btn-sm btn-info view-btn">Add</button>
        <button class="btn btn-sm btn-success edit-btn">Edit</button>
        <button class="btn btn-sm btn-danger delete-btn">Delete</button>
      </td>
    `;

    tr.querySelectorAll(".clickable").forEach(cell => {
      cell.addEventListener("click", () => {
        window.location.href = `result-add.html?id=${student.studentID}`;
      });
      cell.style.cursor = "pointer";
    });

    tr.querySelector(".view-btn").addEventListener("click", e => { 
      e.stopPropagation(); 
      window.location.href = `result-add.html?id=${student.studentID}`; 
    });
    tr.querySelector(".edit-btn").addEventListener("click", e => { 
      e.stopPropagation(); 
      window.location.href = `result-edit.html?id=${student.studentID}`; 
    });
    tr.querySelector(".delete-btn").addEventListener("click", async e => { 
      e.stopPropagation();
      if (confirm(`Are you sure you want to delete ${student.name}'s record?`)) await deleteResult(student.studentID);
    });

    tableBody.appendChild(tr);
  });
}

// -----------------------------
// Delete Student
// -----------------------------
async function deleteResult(studentID) {
  try {
    await remove(ref(db, "Students/" + studentID));
    showNotification("✅ Record deleted successfully!", true);
    renderResults();
  } catch (error) {
    console.error(error);
    showNotification("❌ Error deleting record: " + error.message, false);
  }
}

// -----------------------------
// Notification
// -----------------------------
function showNotification(message, success) {
  const msgDiv = document.getElementById("notificationMessage");
  if (!msgDiv) return;
  msgDiv.textContent = message;
  msgDiv.style.color = success ? "green" : "red";
  new bootstrap.Modal(document.getElementById("notificationModal")).show();
}

// -----------------------------
// Event Listeners
// -----------------------------
searchInput.addEventListener("input", renderResults);
classFilter.addEventListener("change", renderResults);
termFilter.addEventListener("change", renderResults);

// -----------------------------
// Generate NECO/WASSCE PDF HTML (Print-Ready) - Fixed Margins
// -----------------------------
function generateNECOPDF(student, resultData) {
    const sessionYear = resultData.sessionYear || new Date().getFullYear();
    const studentName = student.name || "-";
    const studentGender = student.gender || "-";
    const studentClass = student.studentClass || "-";
    const term = student.term || "-";
    const studentID = student.studentID || "-";
    const dateIssued = resultData.dateIssued || new Date().toLocaleDateString();
    const daysOpened = resultData.daysOpened || "-";
    const daysPresent = resultData.daysPresent || "-";
    const daysAbsent = resultData.daysAbsent || "-";
    const studentHeight = resultData.height || "-";
    const studentWeight = resultData.weight || "-";
    const nextTermDate = resultData.nextTermDate || "-";

    // Subjects Table
    let subjectsHTML = `<table id="resultTable"><thead>
    <tr>
      <th>Subjects</th>
      <th>CA</th>
      <th>Exam</th>
      <th>Total</th>
      <th>Grade</th>
      <th>Remark</th>
    </tr>
  </thead><tbody>`;
    if (resultData.Subjects && Array.isArray(resultData.Subjects)) {
        resultData.Subjects.forEach(sub => {
            subjectsHTML += `
      <tr>
        <td>${sub.name || sub}</td>
        <td>${sub.ca || "-"}</td>
        <td>${sub.exam || "-"}</td>
        <td class="total-score">${sub.total || "-"}</td>
        <td>${sub.grade || "-"}</td>
        <td>${sub.remark || "-"}</td>
      </tr>`;
        });
    }
    subjectsHTML += `</tbody></table>`;

    // Calculate total and average
    const totals = resultData.Subjects?.map(sub => parseInt(sub.total) || 0) || [];
    const totalScore = totals.reduce((a, b) => a + b, 0);
    const avgScore = totals.length ? (totalScore / totals.length).toFixed(2) : "0.00";

    // Head Teacher Remark
    let headRemarkAuto = "-";
    if (avgScore >= 75) headRemarkAuto = "Outstanding achievement! Keep up the excellent work and continue striving for success.";
    else if (avgScore >= 60) headRemarkAuto = "Very good performance. Well done! Maintain this effort to reach higher goals.";
    else if (avgScore >= 50) headRemarkAuto = "Good performance. Keep working consistently to improve further.";
    else if (avgScore >= 40) headRemarkAuto = "Satisfactory performance. There is room for improvement with more focus and effort.";
    else headRemarkAuto = "Performance needs attention. Extra effort and dedication are recommended to improve in the next term.";

    // Affective & Psychomotor
    const Neatness = resultData.Neatness || "-";
    const Politeness = resultData.Politeness || "-";
    const Punctuality = resultData.Punctuality || "-";
    const Responsibility = resultData.Responsibility || "-";
    const Teamwork = resultData.Teamwork || "-";
    const Leadership = resultData.Leadership || "-";
    const Helping = resultData.Helping || "-";

    // -----------------------------
    // Return Full HTML with Fixed Margins
    // -----------------------------
    return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Student Result | ${studentName}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: "Segoe UI", "Calibri", sans-serif;
    background: #fff;
    color: #2c3e50;
    margin: 0;
    padding: 40px;
    line-height: 1.6;
    width: calc(100% - 80px); /* padding left + right */
    min-height: 100vh;
  }
  .header, .row, table, .section-title { width: 100%; }
  table { width: 100%; max-width: 100%; border-collapse: collapse; word-break: break-word; margin-bottom:25px; }
  th, td { text-align:center; padding:6px; border:1px solid #eef2f7; font-size:13px; }
  th { background:#1c3d72; color:#fff; }
  tr:nth-child(even) td { background:#f9fbff; }
  .row { display:flex; gap:20px; flex-wrap:wrap; margin-bottom:25px; }
  .col { flex:1; min-width:250px; background:#fff; border-radius:10px; box-shadow:0 2px 5px rgba(0,0,0,0.07); padding:15px 20px; }
  .col h4 { margin-bottom:8px; font-size:14px; text-transform:uppercase; color:#fff; background:#1c3d72; padding:5px 10px; border-radius:5px 5px 0 0; }
  .col ul { list-style:none; padding:10px 0 0 0; margin:0; }
  .col ul li { margin:4px 0; font-size:13px; }
  .col ul li strong { color:#1c3d72; }
  .section-title { font-weight:700; margin:25px 0 10px 0; font-size:16px; color:#1c3d72; text-transform:uppercase; border-left:5px solid #1c3d72; padding-left:10px; }
  .signatures { display:flex; justify-content:space-between; margin-top:40px; }
  .sign { border-top:2px solid #1c3d72; width:45%; text-align:center; padding-top:8px; font-size:13px; color:#1c3d72; font-weight:600; }
  .signature-img { width:80px; height:auto; display:block; margin:0 auto 5px auto; opacity:0.9; }
  @media print { body { -webkit-print-color-adjust: exact; } @page { size:A4; margin:1in; } }
</style>
</head>
<body>

<!-- Header -->
<div class="header">
  <h2>Damotak International School</h2>
  <p><strong>Academic Session:</strong> ${sessionYear}</p>
</div>

<!-- Student Details -->
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
${subjectsHTML}

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
      <li><strong>Class Teacher:</strong> ${student.classTeacherRemark || "-"}</li>
      <li><strong>Head Teacher:</strong> ${headRemarkAuto}</li>
    </ul>
  </div>
</div>

</body>
</html>
`;
}


// -----------------------------
// Download All Displayed Students as PDF
// -----------------------------
printAllBtn.addEventListener("click", async () => {
  const allRows = tableBody.querySelectorAll("tr");
  if (!allRows.length) {
    alert("No students to download!");
    return;
  }

  const pdf = new jspdf.jsPDF("p", "pt", "a4");
  let firstPage = true;

  for (let row of allRows) {
    const studentID = row.querySelector(".clickable").textContent;
    const studentSnap = await get(ref(db, `Students/${studentID}`));
    if (!studentSnap.exists()) continue;
    const student = studentSnap.val();

    const resultSnap = await get(ref(db, `Results/${studentID}`));
    const resultData = resultSnap.exists() ? resultSnap.val() : {};

    const htmlContent = generateNECOPDF(student, resultData);

    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    const canvas = await html2canvas(container, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    if (!firstPage) pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

    document.body.removeChild(container);
    firstPage = false;
  }

  pdf.save(`All_Students_Results.pdf`);
  showNotification("✅ All student results downloaded successfully!", true);
});

// -----------------------------
// Initial Load
// -----------------------------
renderResults();
