
document.addEventListener("DOMContentLoaded", function () {

    // =====================================
    // 1. SIDEBAR NAVIGATION
    // =====================================

    document.querySelectorAll(".nav-toggle").forEach(button => {
        button.addEventListener("click", function () {
            const group = this.closest(".nav-group");
            const isOpen = group.classList.toggle("open");

            this.setAttribute("aria-expanded", String(isOpen));
        });
    });

    // =====================================
    // 2. MOBILE SIDEBAR
    // =====================================

    const sidebar = document.getElementById("sidebar");
    const menuButton = document.getElementById("menuButton");

    menuButton.addEventListener("click", function () {
        sidebar.classList.toggle("sidebar-visible");
    });

    document.addEventListener("click", function (event) {
        if (
            window.innerWidth <= 800 &&
            sidebar.classList.contains("sidebar-visible") &&
            !sidebar.contains(event.target) &&
            !menuButton.contains(event.target)
        ) {
            sidebar.classList.remove("sidebar-visible");
        }
    });

    // =====================================
    // 3. PLANT SELECTION
    // =====================================

    const plantSelect = document.getElementById("plantSelect");
    const plantName = document.getElementById("plantName");

    plantSelect.addEventListener("change", function () {
        const selectedOption =
            this.options[this.selectedIndex];

        plantName.textContent = selectedOption.text
            .replace(/^\d+\.\s*/, "");

        /*
          When your backend is connected, fetch the
          selected plant's actual measurements here.
        */
    });

    // =====================================
    // 4. DEMONSTRATION CHART DATA
    // =====================================

    // Replace these sample values with historian,
    // PLC gateway, or database measurements.

    const chartData = {
        today: {
            labels: [
                "06:00", "08:00", "10:00", "12:00",
                "14:00", "16:00", "18:00"
            ],
            power: [
                120, 980, 2650, 3950, 3300, 1700, 250
            ],
            irradiance: [
                90, 320, 610, 850, 720, 390, 80
            ],
            temperature: [
                24, 27, 30, 34, 36, 32, 28
            ],
            generation: [
                100, 450, 1100, 1800, 1300, 900, 329
            ]
        },

        week: {
            labels: [
                "Mon", "Tue", "Wed", "Thu",
                "Fri", "Sat", "Sun"
            ],
            power: [
                3200, 3500, 3800, 3400,
                3950, 3600, 3700
            ],
            irradiance: [
                650, 680, 720, 660, 701, 690, 710
            ],
            temperature: [
                29, 30, 32, 31, 32, 30, 31
            ],
            generation: [
                28000, 29500, 31000, 27500,
                30500, 29000, 30000
            ]
        },

        month: {
            labels: [
                "Week 1", "Week 2", "Week 3", "Week 4"
            ],
            power: [
                3300, 3650, 3500, 3950
            ],
            irradiance: [
                670, 695, 680, 701
            ],
            temperature: [
                29, 31, 30, 32
            ],
            generation: [
                65000, 68000, 62000, 65978
            ]
        }
    };

    const metricNames = {
        power: "Solar Power (kW)",
        irradiance: "Irradiance (W/m²)",
        temperature: "Module Temperature (°C)",
        generation: "Energy Generation (kWh)"
    };

    // =====================================
    // 5. CREATE PLANT TREND CHART
    // =====================================

    const chartCanvas = document.getElementById("plantChart");

    const plantChart = new Chart(chartCanvas, {
        type: "line",

        data: {
            labels: chartData.today.labels,

            datasets: [{
                label: metricNames.power,
                data: chartData.today.power,

                borderColor: "#13d5ed",
                backgroundColor: "rgba(19, 213, 237, 0.12)",

                borderWidth: 2,
                fill: true,
                tension: 0.35,

                pointRadius: 3,
                pointHoverRadius: 6
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            interaction: {
                intersect: false,
                mode: "index"
            },

            plugins: {
                legend: {
                    labels: {
                        color: "#c4d8f0"
                    }
                },

                tooltip: {
                    backgroundColor: "#061630",
                    titleColor: "#ffffff",
                    bodyColor: "#c4d8f0",
                    borderColor: "#164779",
                    borderWidth: 1
                }
            },

            scales: {
                x: {
                    ticks: {
                        color: "#9db8d8"
                    },

                    grid: {
                        color: "rgba(100, 150, 200, 0.12)"
                    }
                },

                y: {
                    beginAtZero: true,

                    ticks: {
                        color: "#9db8d8"
                    },

                    grid: {
                        color: "rgba(100, 150, 200, 0.12)"
                    }
                }
            }
        }
    });

    // =====================================
    // 6. UPDATE CHART FILTERS
    // =====================================

    const metricSelect = document.getElementById("metricSelect");
    const periodSelect = document.getElementById("periodSelect");

    function updateChart() {
        const metric = metricSelect.value;
        const period = periodSelect.value;
        const selectedData = chartData[period];

        plantChart.data.labels = selectedData.labels;

        plantChart.data.datasets[0].label =
            metricNames[metric];

        plantChart.data.datasets[0].data =
            selectedData[metric];

        plantChart.update();
    }

    metricSelect.addEventListener("change", updateChart);
    periodSelect.addEventListener("change", updateChart);

    // =====================================
    // 7. SEARCH TABLE
    // =====================================

    const tableSearch = document.getElementById("tableSearch");
    const tableBody = document.getElementById("plantTableBody");

    tableSearch.addEventListener("input", function () {
        const searchText = this.value.toLowerCase();

        tableBody.querySelectorAll("tr").forEach(row => {
            const rowText = row.textContent.toLowerCase();

            row.hidden = !rowText.includes(searchText);
        });
    });

    // =====================================
    // 8. EXPORT TABLE TO CSV
    // =====================================

    const exportButton = document.getElementById("exportButton");

    exportButton.addEventListener("click", function () {
        const table = document.querySelector("#plantTable table");

        if (!table) {
            return;
        }

        // Export the complete table, including filtered-out rows.
        const rows = Array.from(table.querySelectorAll("tr"));

        const csvContent = rows.map(row => {
            const cells = Array.from(
                row.querySelectorAll("th, td")
            );

            return cells.map(cell => {
                let value = cell.innerText.trim();

                value = value.replace(/"/g, '""');

                return `"${value}"`;
            }).join(",");
        }).join("\r\n");

        const blob = new Blob(
            ["\uFEFF" + csvContent],
            { type: "text/csv;charset=utf-8;" }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "solar_plant_data.csv";

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    });

    // =====================================
    // 9. UPDATE REFRESH TIMESTAMP
    // =====================================

    function updateRefreshTime() {
        const now = new Date();

        const dateTime = now.toLocaleString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        });

        document.getElementById("lastLog").textContent = dateTime;
        document.getElementById("refreshTime").textContent = dateTime;

        document.querySelectorAll(".updated-time").forEach(cell => {
            cell.textContent = now.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false
            });
        });
    }

    updateRefreshTime();

    // Updates the displayed timestamp every 5 seconds.
    // Actual measurements will require a backend/API connection.
    setInterval(updateRefreshTime, 5000);

});