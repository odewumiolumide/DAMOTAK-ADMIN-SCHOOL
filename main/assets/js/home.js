import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
  import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

  // ✅ Firebase Configurations
  const databases = {
    classes: {
      config: {
        apiKey: "AIzaSyBVomKLva7Qw4da7ksHlGQ4AqElxujjC5g",
        authDomain: "damotak-classes-database.firebaseapp.com",
        databaseURL: "https://damotak-classes-database-default-rtdb.firebaseio.com/",
        projectId: "damotak-classes-database",
        storageBucket: "damotak-classes-database.firebasestorage.app",
        messagingSenderId: "642680259009",
        appId: "1:642680259009:web:5d3886c823637f79cfef40",
      },
      node: "Classes"
    },
    students: {
      config: {
        apiKey: "AIzaSyCz8GoyOi7wviejSPG2CGkOYvEwsaAWX0w",
        authDomain: "damotak-students-database.firebaseapp.com",
        databaseURL: "https://damotak-students-database-default-rtdb.firebaseio.com/",
        projectId: "damotak-students-database",
        storageBucket: "damotak-students-database.firebasestorage.app",
        messagingSenderId: "806502646085",
        appId: "1:806502646085:web:36a97f1d1e0ff4bab6be2c"
      },
      node: "Students"
    },
    staff: {
      config: {
        apiKey: "AIzaSyBPWX9obom5sNRpK-nTeRGZMTjcF9hrEgI",
        authDomain: "damotak-staff-admin-database.firebaseapp.com",
        databaseURL: "https://damotak-staff-admin-database-default-rtdb.firebaseio.com",
        projectId: "damotak-staff-admin-database",
        storageBucket: "damotak-staff-admin-database.firebasestorage.app",
        messagingSenderId: "918712741387",
        appId: "1:918712741387:web:fcce2674124286c222a10e"
      },
      node: "Staffs"
    }
  };

  // ✅ Initialize Firebase Apps
  const classApp = initializeApp(databases.classes.config, "classApp");
  const studentApp = initializeApp(databases.students.config, "studentApp");
  const staffApp = initializeApp(databases.staff.config, "staffApp");

  const classDB = getDatabase(classApp);
  const studentDB = getDatabase(studentApp);
  const staffDB = getDatabase(staffApp);

  // ✅ Get DOM Elements
  const classCount = document.getElementById("classCount");
  const studentCount = document.getElementById("studentCount");
  const staffCount = document.getElementById("staffCount");
  const resultCount = document.getElementById("resultCount");

  // ✅ Real-time Listeners
  onValue(ref(classDB, "Classes"), (snapshot) => {
    classCount.textContent = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
  });

  onValue(ref(studentDB, "Students"), (snapshot) => {
    if (snapshot.exists()) {
      const students = Object.values(snapshot.val());
      const active = students.filter(s => s.status === "Active" || s.active === true).length;
      studentCount.textContent = active;
      resultCount.textContent = active; // ✅ Results = number of active students
    } else {
      studentCount.textContent = 0;
      resultCount.textContent = 0;
    }
  });

  onValue(ref(staffDB, "Staffs"), (snapshot) => {
    if (snapshot.exists()) {
      const staff = Object.values(snapshot.val());
      const active = staff.filter(s => s.status === "Active" || s.active === true).length;
      staffCount.textContent = active;
    } else {
      staffCount.textContent = 0;
    }
  });