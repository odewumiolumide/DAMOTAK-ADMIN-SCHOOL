 import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
    import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

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

    const urlParams = new URLSearchParams(window.location.search);
    const studentId = urlParams.get("id");
    const dateIssued = new Date().toLocaleDateString();
    document.getElementById("dateIssued").textContent = dateIssued;

    const resultBody = document.getElementById("resultTableBody");

    // ✅ Fetch student info
    async function loadStudentInfo() {
      if (!studentId) {
        showModal("No student ID found!");
        return;
      }
      const snapshot = await get(ref(db, `Students/${studentId}`));
      if (snapshot.exists()) {
        const data = snapshot.val();
        document.getElementById("studentName").textContent = data.name;
        document.getElementById("studentGender").textContent = data.gender;
        document.getElementById("studentClass").textContent = data.class;
      } else {
        showModal("⚠️ Student not found in database!");
      }
    }
    loadStudentInfo();

    // ✅ Add new subject row
    document.getElementById("addRow").addEventListener("click", () => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${resultBody.children.length + 1}</td>
        <td><input type="text" class="form-control form-control-sm subject-name" placeholder="Subject"></td>
        <td><input type="number" class="form-control form-control-sm ca-score" min="0" max="40" value="0"></td>
        <td><input type="number" class="form-control form-control-sm exam-score" min="0" max="60" value="0"></td>
        <td class="total">0</td>
        <td class="grade">-</td>
        <td class="remark">-</td>
        <td><button class="btn btn-sm btn-danger removeRow">X</button></td>
      `;
      resultBody.appendChild(row);
      updateTotal(row);
    });

    // ✅ Calculate totals dynamically
    function updateTotal(row) {
      const ca = row.querySelector(".ca-score");
      const exam = row.querySelector(".exam-score");
      const totalCell = row.querySelector(".total");
      const gradeCell = row.querySelector(".grade");
      const remarkCell = row.querySelector(".remark");

      const calculate = () => {
        const caScore = Number(ca.value);
        const examScore = Number(exam.value);
        const total = caScore + examScore;
        totalCell.textContent = total;

        let grade = "F", remark = "Fail";
        if (total >= 70) [grade, remark] = ["A", "Excellent"];
        else if (total >= 60) [grade, remark] = ["B", "Very Good"];
        else if (total >= 50) [grade, remark] = ["C", "Good"];
        else if (total >= 45) [grade, remark] = ["D", "Fair"];
        else if (total >= 40) [grade, remark] = ["E", "Pass"];
        gradeCell.textContent = grade;
        remarkCell.textContent = remark;
      };
      ca.addEventListener("input", calculate);
      exam.addEventListener("input", calculate);
    }

    // ✅ Save result
    document.getElementById("saveResult").addEventListener("click", async () => {
      const term = document.getElementById("studentTerm").value;
      const rows = document.querySelectorAll("#resultTableBody tr");
      if (!rows.length) return showModal("Please add at least one subject!");

      const subjects = {};
      rows.forEach(row => {
        const name = row.querySelector(".subject-name").value.trim();
        if (name) {
          subjects[name] = {
            ca: Number(row.querySelector(".ca-score").value),
            exam: Number(row.querySelector(".exam-score").value),
            total: Number(row.querySelector(".total").textContent),
            grade: row.querySelector(".grade").textContent,
            remark: row.querySelector(".remark").textContent
          };
        }
      });

      const resultData = {
        name: document.getElementById("studentName").textContent,
        gender: document.getElementById("studentGender").textContent,
        class: document.getElementById("studentClass").textContent,
        subjects,
        classTeacherRemark: document.getElementById("classTeacherRemark").value,
        headTeacherRemark: document.getElementById("headTeacherRemark").value,
        dateIssued
      };

      await set(ref(db, `Results/${studentId}/${term}`), resultData);
      showModal("✅ Result saved successfully!");
    });

    // ✅ Print result confirmation
    document.getElementById("PrintResult").addEventListener("click", () => {
      const modal = new bootstrap.Modal(document.getElementById("printConfirmModal"));
      modal.show();
    });

    document.getElementById("confirmPrintBtn").addEventListener("click", async () => {
      const modal = bootstrap.Modal.getInstance(document.getElementById("printConfirmModal"));
      modal.hide();

      const term = document.getElementById("studentTerm").value;
      const snapshot = await get(ref(db, `Results/${studentId}/${term}`));
      if (!snapshot.exists()) return showModal("No saved result found to print!");

      const resultData = snapshot.val();
      const printWindow = window.open("", "_blank", "width=900,height=650");
      printWindow.document.write(`
        <html><head><title>${resultData.name}</title>
        <link href='https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css' rel='stylesheet'>
        <style>body{font-family:Poppins;padding:20px}</style></head>
        <body>
        <h4 class='text-center'>Damotak International School</h4><hr>
        <p><b>Name:</b> ${resultData.name}<br><b>Class:</b> ${resultData.class}<br><b>Gender:</b> ${resultData.gender}</p>
        <table class='table table-bordered text-center'>
        <thead><tr><th>#</th><th>Subject</th><th>CA</th><th>Exam</th><th>Total</th><th>Grade</th><th>Remark</th></tr></thead>
        <tbody>${Object.entries(resultData.subjects||{}).map(([sub,v],i)=>`
          <tr><td>${i+1}</td><td>${sub}</td><td>${v.ca}</td><td>${v.exam}</td><td>${v.total}</td><td>${v.grade}</td><td>${v.remark}</td></tr>`).join('')}
        </tbody></table>
        <p class='text-muted small text-center'>Generated by Damotak Result System ©2025</p>
        <script>window.onload=()=>window.print()</script>
        </body></html>
      `);
      printWindow.document.close();
    });

    // ✅ Helper: modal messages
    function showModal(message) {
      document.getElementById("notificationMessage").textContent = message;
      const modal = new bootstrap.Modal(document.getElementById("notificationModal"));
      modal.show();
    }

    // ✅ Back button
    document.getElementById("backBtn").addEventListener("click", () => {
      window.location.href = "result-list.html";
    });