document.addEventListener("DOMContentLoaded", function () {
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
        }
    };

    const holidays = [
        "2025-02-10", "2025-02-11", "2025-02-12", "2025-02-13", "2025-02-14",
        "2025-02-15", "2025-03-14", "2025-03-24", "2025-03-25", "2025-03-26",
        "2025-03-27", "2025-03-28", "2025-03-29", "2025-03-30", "2025-03-31",
        "2025-04-01", "2025-04-10", "2025-04-14"
    ];

    const attendanceForm = document.getElementById("attendanceForm");
    const subjectSelect = document.getElementById("subject");
    const batchSelect = document.getElementById("batch");
    const attendedInput = document.getElementById("classes-attended");
    const totalInput = document.getElementById("total-classes");
    const resultsOutput = document.getElementById("results-output");

    function calculateRemainingClasses(subject, batch) {
        const today = new Date();
        const semEndDate = new Date("2025-05-07");
        let remainingClasses = 0;

        if (!timetables[batch]) return 0;  // 🚀 Ensures batch exists

        for (let date = new Date(today); date <= semEndDate; date.setDate(date.getDate() + 1)) {
            const formattedDate = date.toISOString().split("T")[0];
            const dayOfWeek = date.toLocaleString("en-US", { weekday: "long" });

            if (holidays.includes(formattedDate) || !timetables[batch][dayOfWeek]) continue;

            const daySchedule = timetables[batch][dayOfWeek];
            remainingClasses += daySchedule[subject] || 0;  // ✅ Adds only if subject exists
        }
        return remainingClasses;
    }

    attendanceForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const subject = subjectSelect.value;
        const batch = batchSelect.value;
        const attendedClasses = parseInt(attendedInput.value);
        const totalClassesHeld = parseInt(totalInput.value);

        console.log("Subject:", subject);
        console.log("Batch:", batch);
        console.log("Attended Classes:", attendedClasses);
        console.log("Total Classes Held:", totalClassesHeld);

        if (!subject || !batch || isNaN(attendedClasses) || isNaN(totalClassesHeld)) {
            resultsOutput.innerHTML = '<p class="error">Please fill all fields correctly.</p>';
            return;
        }

        const remainingClasses = calculateRemainingClasses(subject, batch);
        console.log("Remaining Classes:", remainingClasses);

        const projectedAttendance = ((attendedClasses + remainingClasses) / (totalClassesHeld + remainingClasses)) * 100;
        console.log("Projected Attendance:", projectedAttendance);

        let totalSemesterClasses = totalClassesHeld + remainingClasses; // Total possible classes
        let requiredAttended = Math.ceil(0.7 * totalSemesterClasses); // Minimum classes needed for 70%
        let totalMissable = totalSemesterClasses - requiredAttended; // Total classes that can be missed
        
        let remainingMissable = totalMissable - (totalClassesHeld - attendedClasses); // Future classes you can miss
        remainingMissable = Math.max(0, remainingMissable); // Ensure it's not negative
        

        resultsOutput.innerHTML = `
    <p>Remaining classes:<strong>${remainingClasses}</strong></p>
    <p>If you attend all remaining classes, your final attendance will be: <strong>${projectedAttendance.toFixed(2)}%</strong></p>
    <p>You have already missed <strong>${totalClassesHeld - attendedClasses}</strong> classes.</p>
    <p>You can miss <strong>${totalMissable}</strong> classes in total to maintain 70% attendance.</p>
    ${
        remainingMissable > 0
            ? `<p>You can still miss <strong>${remainingMissable}</strong> more classes while staying above 70%.</p>`
            : `<p style="color: red; font-weight: bold;">You cannot miss any more classes! Your attendance will drop below 70%.</p>`
    }
`;

    });
});