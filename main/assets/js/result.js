// result.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, get, child, remove } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// ✅ Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCz8GoyOi7wviejSPG2CGkOYvEwsaAWX0w",
  authDomain: "damotak-students-database.firebaseapp.com",
  databaseURL: "https://damotak-students-database-default-rtdb.firebaseio.com/",
  projectId: "damotak-students-database",
  storageBucket: "damotak-students-database.firebasestorage.app",
  messagingSenderId: "806502646085",
  appId: "1:806502646085:web:36a97f1d1e0ff4bab6be2c"
};

// 🔥 Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const tableBody = document.getElementById("resultsTableBody");
const classFilter = document.getElementById("classFilter");
const termFilter = document.getElementById("termFilter");
const searchInput = document.getElementById("searchInput");

// 🧩 Fetch Students from Firebase
async function fetchStudents() {
  try {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, "Students"));
    return snapshot.exists() ? snapshot.val() : {};
  } catch (error) {
    console.error(error);
    return {};
  }
}

// 🧾 Render Student List
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

    // ✅ Make entire row clickable (except the buttons)
    tr.querySelectorAll(".clickable").forEach(cell => {
      cell.addEventListener("click", () => {
        // Redirect to Add Result Page
        window.location.href = `result-add.html?id=${student.studentID}`;
      });
      cell.style.cursor = "pointer";
    });

    // Button actions
    tr.querySelector(".view-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      window.location.href = `result-add.html?id=${student.studentID}`;
    });

    tr.querySelector(".edit-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      window.location.href = `result-edit.html?id=${student.studentID}`;
    });

    

    tr.querySelector(".delete-btn").addEventListener("click", async (e) => {
      e.stopPropagation();
      if (confirm(`Are you sure you want to delete ${student.name}'s record?`)) {
        await deleteResult(student.studentID);
      }
    });

    tableBody.appendChild(tr);
  });
}

// 🗑️ Delete Student Record
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

// 🔔 Notification Popup
function showNotification(message, success) {
  const msgDiv = document.getElementById("notificationMessage");
  if (!msgDiv) return;
  msgDiv.textContent = message;
  msgDiv.style.color = success ? "green" : "red";
  new bootstrap.Modal(document.getElementById("notificationModal")).show();
}

// 🔄 Events
searchInput.addEventListener("input", renderResults);
classFilter.addEventListener("change", renderResults);
termFilter.addEventListener("change", renderResults);

// Initial Load
renderResults();
