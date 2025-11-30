// =============================
// result.js - Updated to match current database
// =============================
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
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

// Fix for duplicate app error: Check if app already exists
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}
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
// Generate Full NECO/WASSCE PDF HTML (Updated with complete template)
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

    // Affective & Psychomotor (assuming stored as properties in resultData)
    const Neatness = resultData.Neatness || "-";
    const Politeness = resultData.Politeness || "-";
    const Punctuality = resultData.Punctuality || "-";
    const Responsibility = resultData.Responsibility || "-";
    const Teamwork = resultData.Teamwork || "-";
    const Leadership = resultData.Leadership || "-";
    const Helping = resultData.Helping || "-";

    // Class Teacher Remark
    const classRemark = resultData.classTeacherRemark || "-";

    // Full HTML with your provided template
    return `
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

  .signatures {
    display: flex;
    justify-content: space-around;
    margin-top: 20px;
}

.sign {
    text-align: center;
}

.signature-img {
    width: 80px;
    height: auto;
    display: block;
    margin: 0 auto 5px auto; /* logo on top, small spacing */
    opacity: 0.9;
}

.signature-line {
    width: 150px;
    height: 2px;
    background: #000;
    margin: 0 auto 5px auto;
}

.signature-title {
    font-size: 13px;
    font-weight: bold;
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
        <p>PRIMARY & JUNIOR SECONDARY : NEW OBA ROAD, ILE-IDANDE AREA, OKE-ONITEA</p>
        <p>JUNIOR SECONDARY & SENIOR SECONDARY : OFF AYEKALE LAROTIMELIHINE,SCHEME. OSOGBO.</p>
       <p>EMAIL: Damotakint@gmail.com </p>
       <p>NUMBERS: 08033880730 | 08082870544 | 08132687701 </p>
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
      <li><strong>Class Teacher:</strong> ${classRemark}</li>
      <li><strong>Head Teacher:</strong> ${headRemarkAuto}</li>
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

<td class="grade-tick">${Neatness=='D'?'✔️':''}</td
// Continuation of the generateNECOPDF function

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

    <div class="sign">
        <img id="classTeacherSignatureImg" class="signature-img">
        <div class="signature-line"></div>
        <div class="signature-title">Class Teacher’s Signature</div>
    </div>

    <div class="sign">
        <img id="proprietorSignatureImg" class="signature-img">
        <div class="signature-line"></div>
        <div class="signature-title">Proprietor’s Signature</div>
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

  // Get selected class and term for file naming
  const selectedClass = classFilter.value === "Classes" ? "All" : classFilter.value;
  const selectedTerm = termFilter.value === "Terms" ? "All" : termFilter.value;
  const fileName = `All_Results_${selectedClass}_${selectedTerm}.pdf`;

  for (let row of allRows) {
    const studentID = row.querySelector(".clickable").textContent;
    const studentSnap = await get(ref(db, `Students/${studentID}`));
    if (!studentSnap.exists()) continue;
    const student = studentSnap.val();

    // Fetch term-specific result data
    const resultSnap = await get(ref(db, `Results/${studentID}/${student.term}`));
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

  pdf.save(fileName);
  showNotification("✅ All student results downloaded successfully!", true);
});

// -----------------------------
// Initial Load
// -----------------------------
renderResults();
