// student.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, set, get, child, remove } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// ===============================
// 🚫 BLOCK NUMBERS IN studentName
// ===============================
const studentNameInput = document.getElementById("studentName");
if (studentNameInput) {
  studentNameInput.addEventListener("input", function () {
    this.value = this.value.replace(/[0-9]/g, "");
  });
}

// ===============================
// ✅ Firebase Configuration
// ===============================
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

// ===============================
// 🔒 BLOCK TEXT IN PHONE NUMBER
// ===============================
const phoneInput = document.getElementById("studentPhone");
if (phoneInput) {
  phoneInput.addEventListener("input", function () {
    this.value = this.value.replace(/[^0-9]/g, "");
  });
}

// ----------------------
// 🎓 Handle Student Registration
// ----------------------
const studentForm = document.getElementById("studentForm");
if (studentForm) {
  studentForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = studentForm.querySelector('button[type="submit"]');
    if (!submitBtn) return;

    // Disable the submit button immediately to prevent double-click
    submitBtn.disabled = true;
    submitBtn.textContent = "Processing...";

    const name = document.getElementById("studentName").value.trim();
    const phone = document.getElementById("studentPhone")?.value.trim() || "";
    const year = document.getElementById("studentYear")?.value || "";
    const gender = document.getElementById("studentGender")?.value;
    const studentClass = document.getElementById("studentClass")?.value;
    const term = document.getElementById("studentTerm")?.value;

    if (!name || !gender || !studentClass || !term) {
      showNotification("⚠️ Please fill in all required fields.", false);
      submitBtn.disabled = false;
      submitBtn.textContent = "Save";
      return;
    }

    if (/\d/.test(name)) {
      showNotification("⚠️ Student name cannot contain numbers.", false);
      submitBtn.disabled = false;
      submitBtn.textContent = "Save";
      return;
    }

    try {
      // ----------------------
      // Check for duplicate student
      // ----------------------
      const snapshot = await get(child(ref(db), "Students"));
      const allStudents = snapshot.exists() ? snapshot.val() : {};

      const duplicate = Object.values(allStudents).some(s =>
        s.name.toLowerCase() === name.toLowerCase() &&
        s.studentClass === studentClass &&
        s.term === term
      );

      if (duplicate) {
        showNotification("⚠️ This student already exists for the selected class and term.", false);
        return;
      }

      // ----------------------
      // Generate unique student ID and save
      // ----------------------
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const studentID = `${name.replace(/\s+/g, "").toLowerCase()}-${randomNum}`;

      const studentData = {
        studentID,
        name,
        phone,
        year,
        gender,
        studentClass,
        term,
        createdAt: new Date().toISOString(),
        active: true
      };

      await set(ref(db, "Students/" + studentID), studentData);

      showNotification(`✅ Student "${name}" added successfully!`, true);
      studentForm.reset();
      renderStudents();
    } catch (error) {
      console.error(error);
      showNotification("❌ Failed to add student: " + error.message, false);
    } finally {
      // Re-enable the button no matter what
      submitBtn.disabled = false;
      submitBtn.textContent = "Save";
    }
  });
}


// ----------------------
// 🔔 Notification Popup
// ----------------------
function showNotification(message, success) {
  const msgDiv = document.getElementById("notificationMessage");
  if (!msgDiv) return;
  msgDiv.textContent = message;
  msgDiv.style.color = success ? "green" : "red";
  new bootstrap.Modal(document.getElementById("notificationModal")).show();
}

// ----------------------
// 📋 Student Table & Management
// ----------------------
const studentsTableBody = document.getElementById("studentsTableBody");
const classFilter = document.getElementById("classFilter");
const searchInput = document.getElementById("searchInput");

// Fetch students
async function fetchStudents() {
  try {
    const snapshot = await get(child(ref(db), "Students"));
    return snapshot.exists() ? snapshot.val() : {};
  } catch (e) {
    console.error(e);
    return {};
  }
}

// Render students
async function renderStudents(filterClass = null, searchQuery = "") {
  if (!studentsTableBody) return;

  const allStudents = await fetchStudents();

  const students = Object.values(allStudents).filter(student => {
    const matchClass = !filterClass || filterClass === "Classes" || student.studentClass === filterClass;
    const matchSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchClass && matchSearch;
  });

  studentsTableBody.innerHTML = "";
  let count = 1;

  students.forEach(student => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>
        <div class="d-flex align-items-center gap-10">
          <div class="form-check style-check d-flex align-items-center">
            <input class="form-check-input radius-4 border border-neutral-400" type="checkbox">
          </div>
          ${count++}
        </div>
      </td>
      <td>${new Date(student.createdAt).toLocaleDateString()}</td>
      <td>${student.name}</td>
      <td>${student.studentClass}</td>
      <td>${student.gender}</td>
      <td class="text-center">
        <span class="${student.active ? 'bg-success-focus text-success-600 border border-success-main' : 'bg-neutral-200 text-neutral-600 border border-neutral-400'} px-24 py-4 radius-4 fw-medium text-sm">
          ${student.active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td class="text-center">
        <button class="view-btn btn btn-info btn-sm">View</button>
        <button class="edit-btn btn btn-success btn-sm">Edit</button>
        <button class="delete-btn btn btn-danger btn-sm">Delete</button>
      </td>
    `;

    tr.querySelector(".view-btn").addEventListener("click", () => openModal(student, false));
    tr.querySelector(".edit-btn").addEventListener("click", () => openModal(student, true));
    tr.querySelector(".delete-btn").addEventListener("click", () => deleteStudent(student.studentID));

    studentsTableBody.appendChild(tr);
  });
}

// Delete student
async function deleteStudent(id) {
  if (!confirm("Are you sure you want to delete this student?")) return;

  await remove(ref(db, "Students/" + id));
  showNotification("✅ Student deleted successfully!", true);
  renderStudents(classFilter?.value, searchInput?.value);
}

// Open View/Edit Modal
function openModal(student, editable = false) {
  const modal = document.getElementById("studentModal");
  if (!modal) return;

  document.getElementById("studentModalTitle").textContent = editable ? "Edit Student" : "View Student";

  document.getElementById("modalStudentID").value = student.studentID;
  document.getElementById("modalStudentName").value = student.name;
  document.getElementById("modalStudentClass").value = student.studentClass;
  document.getElementById("modalStudentGender").value = student.gender;

  // ✅ FIX: Load term safely
  document.getElementById("modalStudentTerm").value = student.term || "";

  // Enable or disable fields
  document.getElementById("modalStudentName").disabled = !editable;
  document.getElementById("modalStudentClass").disabled = !editable;
  document.getElementById("modalStudentGender").disabled = !editable;
  document.getElementById("modalStudentTerm").disabled = !editable;

  new bootstrap.Modal(modal).show();
}

// ----------------------
// 🟢 Handle Edit Submit (FULL FIXED VERSION)
// ----------------------
const editForm = document.getElementById("editStudentForm");
if (editForm) {
  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("modalStudentID").value;

    const updatedData = {
      studentID: id,
      name: document.getElementById("modalStudentName").value,
      studentClass: document.getElementById("modalStudentClass").value,
      gender: document.getElementById("modalStudentGender").value,
      term: document.getElementById("modalStudentTerm").value, // ✅ FIX: Save term
      createdAt: new Date().toISOString(),
      active: true
    };

    await set(ref(db, "Students/" + id), updatedData);

    showNotification("✅ Student updated successfully!", true);
    renderStudents(classFilter?.value, searchInput?.value);
    bootstrap.Modal.getInstance(document.getElementById("studentModal")).hide();
  });
}

// Filter and Search
classFilter?.addEventListener("change", () => renderStudents(classFilter.value, searchInput.value));
searchInput?.addEventListener("input", () => renderStudents(classFilter.value, searchInput.value));

// Initial load
renderStudents();
