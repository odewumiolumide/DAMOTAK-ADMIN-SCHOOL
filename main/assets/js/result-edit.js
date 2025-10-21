<script type="module">
  import { db } from "./result-save.js";
  import { ref, get, update } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

  // ✅ Get student ID from URL (e.g. edit-result.html?id=ST123)
  const urlParams = new URLSearchParams(window.location.search);
  const studentId = urlParams.get("id");

  // ✅ DOM Elements
  const nameEl = document.getElementById("studentName");
  const classEl = document.getElementById("studentClass");
  const genderEl = document.getElementById("studentGender");
  const termEl = document.getElementById("studentTerm");
  const tableBody = document.getElementById("resultTableBody");
  const headRemarkEl = document.getElementById("headTeacherRemark");
  const classRemarkEl = document.getElementById("classTeacherRemark");
  const saveBtn = document.getElementById("saveResult");

  // ✅ Fetch and populate student result
  async function loadStudentData() {
    if (!studentId) return;

    const studentRef = ref(db, "results/" + studentId);
    const snapshot = await get(studentRef);

    if (snapshot.exists()) {
      const data = snapshot.val();

      // Basic info
      document.getElementById("studentID").textContent = studentId;
      document.getElementById("dateIssued").textContent = new Date().toLocaleDateString();
      nameEl.textContent = data.name || "--";
      classEl.textContent = data.class || "--";
      genderEl.textContent = data.gender || "--";
      termEl.textContent = data.term || "--";

      // Remarks
      headRemarkEl.value = data.headRemark || "";
      classRemarkEl.value = data.classRemark || "";

      // Subjects
      tableBody.innerHTML = "";
      Object.entries(data.subjects || {}).forEach(([subject, info], index) => {
        const row = `
          <tr data-subject="${subject}">
            <td>${index + 1}</td>
            <td>${subject}</td>
            <td><input type="number" class="form-control form-control-sm ca" value="${info.ca || 0}"></td>
            <td><input type="number" class="form-control form-control-sm exam" value="${info.exam || 0}"></td>
            <td><input type="number" class="form-control form-control-sm total" value="${info.total || 0}" readonly></td>
            <td><input type="text" class="form-control form-control-sm grade" value="${info.grade || ''}"></td>
            <td><input type="text" class="form-control form-control-sm remark" value="${info.remark || ''}"></td>
          </tr>
        `;
        tableBody.insertAdjacentHTML("beforeend", row);
      });

      // Auto-calc total when CA/Exam changes
      tableBody.querySelectorAll("input.ca, input.exam").forEach(input => {
        input.addEventListener("input", () => {
          const row = input.closest("tr");
          const ca = parseFloat(row.querySelector(".ca").value) || 0;
          const exam = parseFloat(row.querySelector(".exam").value) || 0;
          row.querySelector(".total").value = ca + exam;
        });
      });

    } else {
      showNotification("No data found for this student!");
    }
  }

  loadStudentData();

  // ✅ Save updated data
  saveBtn.addEventListener("click", async () => {
    const subjects = {};
    document.querySelectorAll("#resultTableBody tr").forEach(row => {
      const subject = row.dataset.subject;
      const ca = parseFloat(row.querySelector(".ca").value) || 0;
      const exam = parseFloat(row.querySelector(".exam").value) || 0;
      const total = ca + exam;
      const grade = row.querySelector(".grade").value;
      const remark = row.querySelector(".remark").value;

      subjects[subject] = { ca, exam, total, grade, remark };
    });

    const updatedData = {
      name: nameEl.textContent,
      class: classEl.textContent,
      gender: genderEl.textContent,
      term: termEl.textContent,
      headRemark: headRemarkEl.value,
      classRemark: classRemarkEl.value,
      subjects
    };

    try {
      await update(ref(db, "results/" + studentId), updatedData);
      showNotification("✅ Result updated successfully!");
    } catch (error) {
      showNotification("❌ Error updating result: " + error.message);
    }
  });

  // ✅ Modal Notification
  function showNotification(message) {
    document.getElementById("notificationMessage").textContent = message;
    const modal = new bootstrap.Modal(document.getElementById("notificationModal"));
    modal.show();
  }

  // ✅ Back and Preview Buttons
  document.getElementById("backBtn").addEventListener("click", () => {
    window.location.href = "result-list.html";
  });

  document.getElementById("previewBtn").addEventListener("click", () => {
    window.location.href = `result-preview.html?id=${studentId}`;
  });
</script>
