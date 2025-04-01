document.addEventListener("DOMContentLoaded", function () {
    // Clear the cache
    if ('caches' in window) {
        caches.keys().then(function(cacheNames) {
            cacheNames.forEach(function(cacheName) {
                caches.delete(cacheName);
            });
        });
    }

    const timetables = {
        "A4": {
            "Monday": { "phy-lab": 1, "sdf": 1, "math": 1 },
            "Tuesday": { "eng": 1, "sdf": 1, "math": 1, "phy": 1 },
            "Wednesday": { "uhv": 2, "math": 1, "phy": 1, "sdf": 1, "sdf-lab": 1 },
            "Thursday": { "uhv": 1, "math": 1, "sdf": 1 },
            "Friday": { "life": 1, "phy": 2 },
            "Saturday": {}
        },
        "B9": {
            "Monday": { "phy": 2, "math": 1 },
            "Tuesday": { "math": 2, "uhv": 1, "sdf": 1 },
            "Wednesday": { "eng": 1, "uhv": 2, "phy": 1 },
            "Thursday": { "phy-lab": 1, "sdf": 2, "sdf-lab": 1, "phy": 1 },
            "Friday": { "life": 1, "math": 1, "sdf": 1 },
            "Saturday": {}
        },
        "A18": {
        "Monday": { "math": 1, "eng": 1, "sdf": 1 },
        "Tuesday": { "math": 1, "uhv": 1 },
        "Wednesday": { "phy": 1, "uhv": 1, "sdf": 1, "math": 1 ,"life":1},
        "Thursday": {"sdf":1, "phy":1, "uhv":1, "phy-lab":1},
        "Friday": { "phy": 2, "math": 1, "sdf-lab": 1 },
        "Saturday": { "sdf": 1 }
        },
        "A10": {
        "Monday": { "sdf": 1, "math": 1, "phy": 1, "sdf-lab": 1 },
        "Tuesday": { "uhv": 1, "sdf": 1, "math": 1, "phy-lab": 1 },
        "Wednesday": { "uhv": 2, "phy": 2 },
        "Thursday": { "sdf": 1, "math": 1, "life": 1 },
        "Friday": { "eng": 1, "phy": 1 },
        "Saturday": { "math": 1, "sdf": 1 }
    }
    };

    const holidays = [
    // February 2025
    "2025-02-10", "2025-02-11", "2025-02-12", "2025-02-13", "2025-02-14",
    "2025-02-15", "2025-02-26","2025-02-28","2025-03-1",

    // March 2025
    "2025-03-03","2025-03-10", "2025-03-11", "2025-03-12", "2025-03-13", "2025-03-14",
    "2025-03-15", "2025-03-16", "2025-03-24", "2025-03-25", "2025-03-26",
    "2025-03-27", "2025-03-28", "2025-03-29", "2025-03-30", "2025-03-31",

    // April 2025
    "2025-04-01","2025-04-10", "2025-04-14"
];

    const attendanceForm = document.getElementById("attendanceForm");
    const subjectSelect = document.getElementById("subject");
    const batchSelect = document.getElementById("batch");
    const attendedInput = document.getElementById("classes-attended");
    const totalInput = document.getElementById("total-classes");
    const resultsOutput = document.getElementById("results-output");

    function getRemainingClassesList(subject, batch) {
        const now = new Date();
        const today = new Date();
        const isTodayComplete = document.getElementById("today-complete").checked;
        
        // If user indicated today is complete, start from tomorrow
        if (isTodayComplete) {
            today.setDate(today.getDate() + 1);
        }
        
        const semEndDate = new Date("2025-05-07");
        let remainingClassesList = [];

        if (!timetables[batch]) return []; // Ensure batch exists

        for (let date = new Date(today); date <= semEndDate; date.setDate(date.getDate() + 1)) {
            // Use toLocaleDateString with 'en-IN' to ensure IST is considered
            const formattedDate = date.toLocaleDateString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
            const dayOfWeek = date.toLocaleString("en-US", { weekday: "long" });

            if (holidays.includes(formattedDate) || !timetables[batch][dayOfWeek]) continue;

            const daySchedule = timetables[batch][dayOfWeek];

            if (daySchedule[subject]) {
                remainingClassesList.push({
                    date: formattedDate,
                    day: dayOfWeek,
                    count: daySchedule[subject]
                });
            }
        }
        return remainingClassesList;
    }

    function saveFormData() {
        const formData = {
            batch: batchSelect.value,
            subject: subjectSelect.value,
            attended: attendedInput.value,
            total: totalInput.value,
            percentage: document.getElementById("required-percentage").value
        };
        localStorage.setItem('attendanceFormData', JSON.stringify(formData));
    }

    function loadSavedData() {
        const saved = localStorage.getItem('attendanceFormData');
        if (saved) {
            const data = JSON.parse(saved);
            batchSelect.value = data.batch;
            subjectSelect.value = data.subject;
            attendedInput.value = data.attended;
            totalInput.value = data.total;
            document.getElementById("required-percentage").value = data.percentage;
        }
    }

    attendanceForm.addEventListener("submit", function (event) {
        event.preventDefault();
        saveFormData();

        const subject = subjectSelect.value;
        const batch = batchSelect.value;
        const attendedClasses = parseInt(attendedInput.value);
        const totalClassesHeld = parseInt(totalInput.value);
        const requiredPercentage = parseFloat(document.getElementById("required-percentage").value) / 100;

        if (!subject || !batch || isNaN(attendedClasses) || isNaN(totalClassesHeld) || isNaN(requiredPercentage)) {
            resultsOutput.innerHTML = '<p class="error">Please fill all fields correctly.</p>';
            return;
        }

        const remainingClassesList = getRemainingClassesList(subject, batch);
        const remainingClasses = remainingClassesList.reduce((sum, cls) => sum + cls.count, 0);

        const totalSemesterClasses = totalClassesHeld + remainingClasses;
        const requiredAttended = Math.ceil(requiredPercentage * totalSemesterClasses);
        const totalMissable = totalSemesterClasses - requiredAttended;

        const classesMissed = totalClassesHeld - attendedClasses;
        const remainingMissable = Math.max(0, totalMissable - classesMissed);

        // Format remaining classes schedule
        let classScheduleHTML = "<h3>Remaining Classes Schedule</h3>";
        let groupedClasses = {};

        remainingClassesList.forEach(cls => {
            let month = new Date(cls.date).toLocaleString("en-US", { month: "long", year: "numeric" });
            if (!groupedClasses[month]) {
                groupedClasses[month] = [];
            }
            groupedClasses[month].push(`${cls.date} (${cls.day}): ${cls.count} class(es)`);
        });

        for (let month in groupedClasses) {
            classScheduleHTML += `<h4>${month}</h4><ul>`;
            groupedClasses[month].forEach(entry => {
                classScheduleHTML += `<li>${entry}</li>`;
            });
            classScheduleHTML += "</ul>";
        }

        const currentAttendance = (attendedClasses / totalClassesHeld) * 100;
        
        const progressHTML = `
            <div class="progress-container">
                <div class="progress-bar" style="width: ${currentAttendance}%">
                    <div class="progress-text">${currentAttendance.toFixed(1)}%</div>
                </div>
            </div>
        `;

        resultsOutput.innerHTML = `
            <p><strong>Current Attendance:</strong></p>
            ${progressHTML}
            ${classScheduleHTML}
            <p><strong>Remaining classes:</strong> ${remainingClasses}</p>
            <p>If you attend all remaining classes, your final attendance will be: <strong>${((attendedClasses + remainingClasses) / totalSemesterClasses * 100).toFixed(2)}%</strong></p>
            <p>You have already missed <strong>${classesMissed}</strong> classes.</p>
            <p>You can miss a total of <strong>${totalMissable}</strong> classes to maintain ${requiredPercentage * 100}% attendance.</p>
            ${
                remainingMissable > 0
                    ? `<p>You can still miss <strong>${remainingMissable}</strong> more classes while staying above ${requiredPercentage * 100}%.</p>`
                    : `<p style="color: red; font-weight: bold;">You cannot miss any more classes! Your attendance will drop below ${requiredPercentage * 100}%.</p>`
            }
        `;
    });

    loadSavedData();
});
