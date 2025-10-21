// result-save.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// 🔥 Firebase Config for Result Database
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

/**
 * ✅ Save or update student result
 * - Adds new subjects without overwriting existing ones
 * - Saves remarks and other general data
 */
export async function saveResult(studentID, term, resultData) {
  if (!studentID || !term || !resultData) {
    console.error("❌ Missing required parameters for saveResult");
    return { success: false, message: "Missing required data" };
  }

  try {
    // Split general info and subjects
    const { subjects, ...generalInfo } = resultData;

    // Save general info
    const termRef = ref(db, `Results/${studentID}/${term}`);
    await update(termRef, generalInfo);

    // Get existing subjects
    const existingSnap = await get(ref(db, `Results/${studentID}/${term}/Subjects`));
    const existingSubjects = existingSnap.exists() ? existingSnap.val() : {};

    // Save only new or updated subjects
    if (Array.isArray(subjects)) {
      for (const sub of subjects) {
        if (!sub.subject) continue;
        const subName = sub.subject.trim();

        // Only save new subjects or updated entries
        if (!existingSubjects[subName]) {
          const subRef = ref(db, `Results/${studentID}/${term}/Subjects/${subName}`);
          await update(subRef, sub);
        }
      }
    }

    console.log(`✅ Result saved successfully for ${studentID} (${term})`);
    return { success: true, message: "✅ Subject(s) saved successfully!" };

  } catch (error) {
    console.error("🔥 Firebase Save Error:", error);
    return { success: false, message: error.message || "Error saving result" };
  }
}


