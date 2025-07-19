const lastWorkingDate = new Date("2025-11-29");
const holidays = [
  "2025-08-9",
  "2025-08-15",
  "2025-08-16",
  "2025-8-29",
  "2025-8-30",
  "2025-8-31",
  "2025-9-1",
  "2025-9-2",
  "2025-9-3",
  "2025-9-4",
  "2025-9-5",
  "2025-9-6",
  "2025-10-02",
  "2025-10-10",
  "2025-10-11",
  "2025-10-12",
  "2025-10-13",
  "2025-10-14",
  "2025-10-15",
  "2025-10-16",
  "2025-10-17",
  "2025-10-18",
  "2025-10-19",
  "2025-10-20",
  "2025-10-21",
  "2025-10-22",
  "2025-10-23",
  "2025-10-24",
  "2025-10-25",
  "2025-10-26",
  "2025-11-5"
];

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
let batchData = {};

window.addEventListener("DOMContentLoaded", async () => {
  const batchSelect = document.getElementById("batch-select");
  const subjectSelect = document.getElementById("subject");

  try {
    const response = await fetch("batches.json");
    batchData = await response.json();

    for (const batchName in batchData) {
      const option = document.createElement("option");
      option.value = batchName;
      option.textContent = batchName;
      batchSelect.appendChild(option);
    }

    // Helper to populate subjects with names
    function populateSubjects(batchName) {
      subjectSelect.innerHTML = "";
      const selectedBatch = batchData[batchName];
      if (selectedBatch && selectedBatch.Codes && selectedBatch.Subjects) {
        selectedBatch.Codes.forEach((code, idx) => {
          const option = document.createElement("option");
          option.value = code;
          option.textContent = selectedBatch.Subjects[idx]; // Only subject name
          subjectSelect.appendChild(option);
        });
      }
    }

    batchSelect.addEventListener("change", () => {
      populateSubjects(batchSelect.value);
    });

    // Populate subjects for the first batch by default
    if (batchSelect.options.length > 0) {
      batchSelect.selectedIndex = 0;
      populateSubjects(batchSelect.value);
    }
  } catch (err) {
    console.error("Failed to load batch data:", err);
  }

  // Disable calculate button until all fields are filled
  const form = document.getElementById("attendance-form");
  const calculateBtn = form.querySelector("button[type='submit']");
  function validateForm() {
    const minAttendance = document.getElementById("min-attendance").value;
    const totalElapsed = document.getElementById("total-elapsed").value;
    const totalAttended = document.getElementById("total-attended").value;
    const batch = batchSelect.value;
    const subject = subjectSelect.value;
    calculateBtn.disabled = !(minAttendance && totalElapsed && totalAttended && batch && subject);
  }
  form.addEventListener("input", validateForm);
  form.addEventListener("change", validateForm);
  validateForm();

  form.addEventListener("submit", e => {
    e.preventDefault();
    calculateAttendance();
  });
});

function calculateAttendance() {
  const minAttendance = parseFloat(document.getElementById("min-attendance").value);
  let totalElapsed = parseInt(document.getElementById("total-elapsed").value);
  let totalAttended = parseInt(document.getElementById("total-attended").value);
  const batch = document.getElementById("batch-select").value;
  const subjectCode = document.getElementById("subject").value;
  const todayComplete = document.getElementById("today-complete").checked;

  const schedule = batchData[batch];
  if (!schedule) return;

  // Set first working day
  const firstWorkingDate = new Date("2025-07-24");
  const currentDate = new Date();
  // If today's classes are complete, skip today in future calculation
  if (todayComplete) {
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // If calculating before first working day, assume 0 classes attended and happened
  if (currentDate < firstWorkingDate) {
    totalElapsed = 0;
    totalAttended = 0;
  }

  let remaining = 0;
  // Start from max(currentDate, firstWorkingDate)
  const d = new Date(Math.max(currentDate, firstWorkingDate));
  while (d <= lastWorkingDate) {
    const iso = d.toISOString().split("T")[0];
    const weekday = days[d.getDay()];
    if (!holidays.includes(iso) && schedule[weekday] && schedule[weekday][subjectCode]) {
      remaining += schedule[weekday][subjectCode];
    }
    d.setDate(d.getDate() + 1);
  }

  const result = document.getElementById("result");
  const classSchedule = document.getElementById("class-schedule");

  if (remaining === 0) {
    result.textContent = "No upcoming classes found.";
    classSchedule.textContent = "";
    return;
  }

  let maxMissable = 0;
  for (let x = 0; x <= remaining; x++) {
    const attendedNew = totalAttended + (remaining - x);
    const totalNew = totalElapsed + remaining;
    const percentage = (attendedNew / totalNew) * 100;
    if (percentage >= minAttendance) maxMissable = x;
    else break;
  }

  // Show subject name in result
  let subjectName = subjectCode;
  if (schedule.Codes && schedule.Subjects) {
    const idx = schedule.Codes.indexOf(subjectCode);
    if (idx !== -1) subjectName = schedule.Subjects[idx]; // Only subject name
  }

  result.innerHTML = `
    Remaining <b>${subjectName} Classes</b>: <b>${remaining}</b><br>
    Max classes you can miss: <b>${maxMissable}</b>
  `;

  // List all working days till lastWorkingDate with number of classes for selected subject, hide days with 0 classes
  let workingDays = [];
  const d2 = new Date(Math.max(currentDate, firstWorkingDate));
  while (d2 <= lastWorkingDate) {
    const iso = d2.toISOString().split("T")[0];
    const [year, month, day] = iso.split("-");
    let classCount = 0;
    if (!holidays.includes(iso) && schedule[days[d2.getDay()]]) {
      classCount = schedule[days[d2.getDay()]][subjectCode] || 0;
      if (classCount > 0) {
        // Format as DD/MM/YYYY:classCount
        workingDays.push(`${day}/${month}/${year}:${classCount}`);
      }
    }
    d2.setDate(d2.getDate() + 1);
  }
  classSchedule.innerHTML = `<b>Working days till last working date:</b><br>${workingDays.join('<br>')}`;
}
