import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
  import {
    getDatabase,
    ref,
    set,
    get,
    onValue,
    update,
    remove
  } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

  // ✅ Firebase Config
  const firebaseConfig = {
    apiKey: "AIzaSyBVomKLva7Qw4da7ksHlGQ4AqElxujjC5g",
    authDomain: "damotak-classes-database.firebaseapp.com",
    databaseURL: "https://damotak-classes-database-default-rtdb.firebaseio.com/",
    projectId: "damotak-classes-database",
    storageBucket: "damotak-classes-database.firebasestorage.app",
    messagingSenderId: "642680259009",
    appId: "1:642680259009:web:5d3886c823637f79cfef40",
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);

  // ===================== GLOBAL STATE =====================
  let editMode = false;
  let editClassId = null;

  // ===================== ADD / EDIT CLASS =====================
  const addClassForm = document.getElementById("addClassForm");
  addClassForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const className = document.getElementById("className").value.trim();
    const classStream = document.getElementById("classStream").value.trim();
    const classTeacher = document.getElementById("classTeacher").value.trim();

    if (!className || !classStream || !classTeacher) {
      showNotification("⚠️ Please fill all fields before saving.", false);
      return;
    }

    try {
      if (editMode && editClassId) {
        // ✅ UPDATE existing class
        const newData = { className, classStream, classTeacher };
        await update(ref(db, "Classes/" + editClassId), newData);

        showNotification(`✏️ Class "${className}" updated successfully!`, true);

        editMode = false;
        editClassId = null;
      } else {
        // ✅ ADD new class
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const classID = `${className}-${classStream}${randomNum}`.replace(/\s+/g, "").toLowerCase();

        const classData = {
          classID,
          className,
          classStream,
          classTeacher,
          createdAt: new Date().toISOString(),
        };

        await set(ref(db, "Classes/" + classID), classData);
        showNotification(`✅ Class "${className}" added successfully!`, true);
      }

      // Reset form and close modal
      addClassForm.reset();
      bootstrap.Modal.getInstance(document.getElementById("exampleModal")).hide();

      // Refresh list or reload
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (error) {
      console.error(error);
      showNotification("❌ Operation failed: " + error.message, false);
    }
  });

  // ===================== DISPLAY CLASSES =====================
  const classList = document.getElementById("classList");
  const classRef = ref(db, "Classes");

  onValue(classRef, (snapshot) => {
    classList.innerHTML = "";
    if (!snapshot.exists()) {
      classList.innerHTML = "<p class='text-center text-muted'>No classes available.</p>";
      return;
    }

    snapshot.forEach((child) => {
      const data = child.val();
      const item = document.createElement("div");
      item.className =
        "event-item d-flex align-items-center justify-content-between gap-4 pb-16 mb-16 border border-start-0 border-end-0 border-top-0";
      item.innerHTML = `
        <div>
          <div class="d-flex align-items-center gap-10">
            <span class="w-12-px h-12-px bg-primary-600 rounded-circle fw-medium"></span>
            <span class="text-secondary-light">${data.className} ${data.classStream}</span>
          </div>
          <span class="text-primary-light fw-semibold text-md mt-4">${data.classTeacher}</span>
        </div>
        <div class="dropdown">
          <button type="button" data-bs-toggle="dropdown" aria-expanded="false">
            <iconify-icon icon="entypo:dots-three-vertical" class="icon text-secondary-light"></iconify-icon>
          </button>
          <ul class="dropdown-menu p-12 border bg-base shadow">
            <li>
              <button type="button" class="dropdown-item view-btn" data-id="${data.classID}">
                <iconify-icon icon="hugeicons:view" class="icon text-lg"></iconify-icon>
                View
              </button>
            </li>
            <li>
              <button type="button" class="dropdown-item edit-btn" data-id="${data.classID}">
                <iconify-icon icon="lucide:edit" class="icon text-lg"></iconify-icon>
                Edit
              </button>
            </li>
            <li>
              <button type="button" class="dropdown-item delete-btn text-danger" data-id="${data.classID}">
                <iconify-icon icon="fluent:delete-24-regular" class="icon text-lg"></iconify-icon>
                Delete
              </button>
            </li>
          </ul>
        </div>`;
      classList.appendChild(item);
    });

    // Event listeners for buttons
    document.querySelectorAll(".view-btn").forEach(btn => btn.addEventListener("click", () => viewClass(btn.dataset.id)));
    document.querySelectorAll(".edit-btn").forEach(btn => btn.addEventListener("click", () => editClass(btn.dataset.id)));
    document.querySelectorAll(".delete-btn").forEach(btn => btn.addEventListener("click", () => openDeleteModal(btn.dataset.id)));
  });

  // ===================== VIEW =====================
  async function viewClass(id) {
    const snapshot = await get(ref(db, "Classes/" + id));
    if (snapshot.exists()) {
      const data = snapshot.val();
      document.getElementById("viewModalBody").innerHTML = `
        <p><strong>Class Name:</strong> ${data.className}</p>
        <p><strong>Stream:</strong> ${data.classStream}</p>
        <p><strong>Teacher:</strong> ${data.classTeacher}</p>
        <p><strong>Created:</strong> ${new Date(data.createdAt).toLocaleString()}</p>`;
      new bootstrap.Modal(document.getElementById("viewModal")).show();
    }
  }

  // ===================== EDIT =====================
  async function editClass(id) {
    const snapshot = await get(ref(db, "Classes/" + id));
    if (snapshot.exists()) {
      const data = snapshot.val();
      editMode = true;
      editClassId = id;

      document.getElementById("className").value = data.className;
      document.getElementById("classStream").value = data.classStream;
      document.getElementById("classTeacher").value = data.classTeacher;

      new bootstrap.Modal(document.getElementById("exampleModal")).show();
    }
  }

  // ===================== DELETE (MODAL) =====================
  let currentDeleteId = null;

  function openDeleteModal(id) {
    currentDeleteId = id;
    new bootstrap.Modal(document.getElementById("deleteModal")).show();
  }

  document.getElementById("confirmDelete").addEventListener("click", async () => {
    if (!currentDeleteId) return;
    try {
      await remove(ref(db, "Classes/" + currentDeleteId));
      showNotification("🗑️ Class deleted successfully!", true);
      currentDeleteId = null;
      bootstrap.Modal.getInstance(document.getElementById("deleteModal")).hide();
    } catch (error) {
      console.error("Delete failed:", error);
      showNotification("❌ Failed to delete class.", false);
    }
  });

  // ===================== NOTIFICATION =====================
  function showNotification(message, success) {
    const msgDiv = document.getElementById("notificationMessage");
    msgDiv.textContent = message;
    msgDiv.style.color = success ? "green" : "red";
    new bootstrap.Modal(document.getElementById("notificationModal")).show();
  }