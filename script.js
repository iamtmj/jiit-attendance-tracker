const lastWorkingDate = new Date("2026-05-01");
// Normalize holiday dates into ISO (YYYY-MM-DD) format to ensure matches
let holidays = [
  "2026-01-26",
  "2026-02-10",
  "2026-02-11",
  "2026-02-12",
  "2026-02-13",
  "2026-02-14",
  "2026-02-15",
  "2026-02-16",
  "2026-02-17",
  "2026-02-18",
  "2026-03-01",
  "2026-03-02",
  "2026-03-03",
  "2026-03-04",
  "2026-03-05",
  "2026-03-06",
  "2026-03-07",
  "2026-03-08",
  "2026-03-21",
  "2026-03-24",
  "2026-03-25",
  "2026-03-26",
  "2026-03-27",
  "2026-03-28",
  "2026-03-29",
  "2026-03-30",
  "2026-03-31",
  "2026-04-01",
  "2026-04-02",
  "2026-04-14",
  "2026-05-01"
];

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
let batchData = {};

window.addEventListener("DOMContentLoaded", async () => {
  const batchSelect = document.getElementById("batch-select");
  const subjectSelect = document.getElementById("subject");
  // Holiday manager elements
  const holidayListEl = document.getElementById('holiday-list');
  const addHolidayBtn = document.getElementById('add-holiday-btn');
  const newHolidayInput = document.getElementById('new-holiday-date');
  const holidayFeedback = document.getElementById('holiday-feedback');

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

  // Render existing holidays as removable chips
  function renderHolidays() {
    if (!holidayListEl) return;
    holidayListEl.innerHTML = '';
    holidays.sort();
    holidays.forEach(dateStr => {
      const chip = document.createElement('span');
      chip.textContent = dateStr;
      chip.style.padding = '6px 10px';
      chip.style.background = '#e0f2f1';
      chip.style.borderRadius = '20px';
      chip.style.fontSize = '0.8rem';
      chip.style.display = 'flex';
      chip.style.alignItems = 'center';
      chip.style.gap = '6px';
      chip.style.border = '1px solid #26a69a';
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.textContent = '✕';
      removeBtn.style.background = 'transparent';
      removeBtn.style.border = 'none';
      removeBtn.style.cursor = 'pointer';
      removeBtn.style.color = '#00796b';
      removeBtn.style.fontSize = '0.9rem';
      removeBtn.addEventListener('click', () => {
        holidays = holidays.filter(h => h !== dateStr);
        renderHolidays();
        calculateAttendance();
      });
      chip.appendChild(removeBtn);
      holidayListEl.appendChild(chip);
    });
  }
  renderHolidays();

  if (addHolidayBtn) {
    addHolidayBtn.addEventListener('click', () => {
      const val = newHolidayInput.value;
      holidayFeedback.style.display = 'none';
      if (!val) {
        holidayFeedback.textContent = 'Select a date first.';
        holidayFeedback.style.display = 'block';
        return;
      }
      // Normalize
      const iso = new Date(val).toISOString().split('T')[0];
      if (holidays.includes(iso)) {
        holidayFeedback.textContent = 'Holiday already exists.';
        holidayFeedback.style.display = 'block';
        return;
      }
      holidays.push(iso);
      renderHolidays();
      calculateAttendance();
      newHolidayInput.value = '';
    });
  }
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

  // Basic validation & error feedback (without altering missable calculation logic)
  const errorBox = document.getElementById("form-errors");
  let errors = [];
  if (isNaN(minAttendance) || minAttendance < 1 || minAttendance > 100) {
    errors.push("Min attendance must be between 1 and 100.");
  }
  if (isNaN(totalElapsed) || totalElapsed < 0) errors.push("Total classes elapsed must be >= 0.");
  if (isNaN(totalAttended) || totalAttended < 0) errors.push("Total classes attended must be >= 0.");
  if (totalAttended > totalElapsed) errors.push("Attended cannot exceed elapsed.");
  if (errors.length) {
    errorBox.style.display = 'block';
    errorBox.style.color = '#b00020';
    errorBox.style.background = '#ffecec';
    errorBox.style.padding = '10px 12px';
    errorBox.style.borderLeft = '4px solid #e53935';
    errorBox.style.borderRadius = '8px';
    errorBox.innerHTML = errors.map(e=>`<div>• ${e}</div>`).join('');
    return;
  } else {
    errorBox.style.display = 'none';
  }

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
  // Normalize to midday to avoid timezone boundary issues
  d.setHours(12,0,0,0);
  const countedDates = [];
  while (d <= lastWorkingDate) {
    const iso = d.toISOString().split("T")[0];
    const weekday = days[d.getDay()];
    if (!holidays.includes(iso) && schedule[weekday] && schedule[weekday][subjectCode]) {
      remaining += schedule[weekday][subjectCode];
      countedDates.push(`${iso}:${schedule[weekday][subjectCode]}`);
    }
    d.setDate(d.getDate() + 1);
  }

  const result = document.getElementById("result");
  const classSchedule = document.getElementById("class-schedule");
  const progressWrapper = document.getElementById("progress-wrapper");
  const progressBar = document.getElementById("attendance-progress");
  const progressText = document.getElementById("attendance-progress-text");
  const progressMeta = document.getElementById("progress-meta");

  // Current attendance percentage BEFORE future classes considered
  const currentPct = totalElapsed > 0 ? (totalAttended / totalElapsed) * 100 : 0;

  if (remaining === 0) {
    result.innerHTML = `No upcoming classes found. Current attendance: <b>${currentPct.toFixed(2)}%</b>`;
    classSchedule.textContent = "";
    // Update progress bar even with no remaining
    progressWrapper.style.display = 'block';
    progressBar.style.width = `${Math.min(100, currentPct).toFixed(2)}%`;
    progressText.textContent = `${currentPct.toFixed(1)}%`;
    progressBar.style.background = currentPct >= minAttendance ? 'linear-gradient(135deg,#4CAF50,#45a049)' : 'linear-gradient(135deg,#ff9800,#f57c00)';
    progressMeta.innerHTML = `Needed: ${minAttendance}%`;
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

  // Enhance result with advisory messages
  const willAttendAllPct = ((totalAttended + remaining) / (totalElapsed + remaining)) * 100;
  let advisory = `<br>Current attendance: <b>${currentPct.toFixed(2)}%</b>`;
  advisory += `<br>If you attend all: <b>${willAttendAllPct.toFixed(2)}%</b>`;
  if (maxMissable === 0 && willAttendAllPct < minAttendance) {
    advisory += `<br><span style="color:#d84315;font-weight:600;">Even attending all remaining classes may not reach the target.</span>`;
  } else if (maxMissable === 0) {
    advisory += `<br><span style="color:#0277bd;">You must attend every remaining class to stay above the threshold.</span>`;
  } else if (maxMissable === remaining) {
    advisory += `<br><span style="color:#2e7d32;">You've already secured the required attendance.</span>`;
  }
  result.innerHTML += advisory;

  // Update progress bar to reflect current status
  progressWrapper.style.display = 'block';
  progressBar.style.width = `${Math.min(100, currentPct).toFixed(2)}%`;
  progressText.textContent = `${currentPct.toFixed(1)}%`;
  progressBar.style.background = currentPct >= minAttendance ? 'linear-gradient(135deg,#4CAF50,#45a049)' : 'linear-gradient(135deg,#ff9800,#f57c00)';
  progressMeta.innerHTML = `Needed: ${minAttendance}% &middot; Remaining sessions considered: ${remaining}`;

  // List all working days till lastWorkingDate grouped by week, format: Week DD/MM-DD/MM\nDay(DD):classCount
  let workingDays = [];
  const d2 = new Date(Math.max(currentDate, firstWorkingDate));
  d2.setHours(12,0,0,0);
  let weekStart = null;
  let weekEnd = null;
  let weekBuffer = [];
  let displaySum = 0; // sum of per-day class counts for this subject
  const displayedDates = [];
  while (d2 <= lastWorkingDate) {
    const iso = d2.toISOString().split("T")[0];
    const [year, month, day] = iso.split("-");
    let classCount = 0;
    if (!holidays.includes(iso) && schedule[days[d2.getDay()]]) {
      classCount = schedule[days[d2.getDay()]][subjectCode] || 0;
      if (classCount > 0) {
        // Set week start/end
        if (!weekStart) weekStart = `${day}/${month}`;
        weekEnd = `${day}/${month}`;
        weekBuffer.push(`${days[d2.getDay()].slice(0,3)}(${day}):${classCount} class(es)`);
        displaySum += classCount;
        displayedDates.push(`${iso}:${classCount}`);
      }
    }
    // If it's Saturday or last day, flush week
    if (d2.getDay() === 6 || d2.getTime() === lastWorkingDate.getTime()) {
      if (weekBuffer.length > 0) {
        workingDays.push(`<b>${weekStart}-${weekEnd}</b><br>${weekBuffer.join('<br>')}`);
      }
      weekStart = null;
      weekEnd = null;
      weekBuffer = [];
    }
    d2.setDate(d2.getDate() + 1);
  }
  // Final safety flush (in case loop exited without Saturday and buffer not empty)
  if (weekBuffer.length > 0) {
    workingDays.push(`<b>${weekStart}-${weekEnd}</b><br>${weekBuffer.join('<br>')}`);
  }
  let scheduleHtml = `<b>Working days till last working date (subject days only):</b><br>${workingDays.join('<br><br>')}`;
  scheduleHtml += `<br><br><i>Total classes listed:</i> <b>${displaySum}</b>`;
  if (displaySum !== remaining) {
    scheduleHtml += `<br><span style=\"color:#d32f2f;font-weight:600;\">Warning: Displayed total (${displaySum}) differs from calculated remaining (${remaining}).</span>`;
    scheduleHtml += `<br><details style=\"margin-top:6px;\"><summary style=\"cursor:pointer;color:#b71c1c;\">Debug details</summary>` +
      `<div style=\"font-size:0.75rem;margin-top:6px;line-height:1.2;\">` +
      `<b>Count loop dates (${countedDates.length}):</b><br>${countedDates.join(', ')}<br>` +
      `<b>Display loop dates (${displayedDates.length}):</b><br>${displayedDates.join(', ')}<br>` +
      `<b>Holidays (${holidays.length}):</b><br>${holidays.join(', ')}<br>` +
      `</div></details>`;
  }
  scheduleHtml += `<br><small style="color:#555;">Each line is a day where this subject occurs; if a day has multiple sessions it's shown as 2 class(es), etc.</small>`;
  classSchedule.innerHTML = scheduleHtml;
}

