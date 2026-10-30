
document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    // =====================================
    // 1. SIDEBAR NAVIGATION
    // =====================================

    document.querySelectorAll(".nav-toggle").forEach(function (button) {
        button.addEventListener("click", function () {
            const group = this.closest(".nav-group");

            if (!group) return;

            const isOpen = group.classList.toggle("open");

            this.setAttribute("aria-expanded", String(isOpen));
        });
    });

    // =====================================
    // 2. MOBILE SIDEBAR
    // =====================================

    const sidebar = document.getElementById("sidebar");
    const menuButton = document.getElementById("menuButton");

    if (sidebar && menuButton) {

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
    }

    // =====================================
    // 3. PLANT SELECTION
    // =====================================

    const plantSelect = document.getElementById("plantSelect");
    const plantName = document.getElementById("plantName");

    if (plantSelect && plantName) {

        plantSelect.addEventListener("change", function () {

            const selectedOption =
                this.options[this.selectedIndex];

            if (!selectedOption) return;

            plantName.textContent = selectedOption.text
                .replace(/^\s*\d+\.\s*/, "");

            // TODO:
            // Connect the selected plant to the Flask API
            // when the plant measurement API is implemented.

        });
    }

    // =====================================
    // 4. DEMONSTRATION CHART DATA
    // =====================================

    // NOTE:
    // These are demonstration values.
    // They are not live PLC, inverter or database readings.

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

    const chartCanvas =
        document.getElementById("plantChart");

    let plantChart = null;

    if (chartCanvas) {

        if (typeof Chart === "undefined") {

            console.error(
                "Chart.js is not loaded. Please load Chart.js before plant_data.js."
            );

        } else {

            plantChart = new Chart(chartCanvas, {

                type: "line",

                data: {

                    labels: chartData.today.labels,

                    datasets: [{

                        label: metricNames.power,

                        data: chartData.today.power,

                        borderColor: "#13d5ed",

                        backgroundColor:
                            "rgba(19, 213, 237, 0.12)",

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

                                color:
                                    "rgba(100, 150, 200, 0.12)"
                            }
                        },

                        y: {

                            beginAtZero: true,

                            ticks: {

                                color: "#9db8d8"
                            },

                            grid: {

                                color:
                                    "rgba(100, 150, 200, 0.12)"
                            }
                        }
                    }
                }
            });
        }
    }

    // =====================================
    // 6. UPDATE CHART FILTERS
    // =====================================

    const metricSelect =
        document.getElementById("metricSelect");

    const periodSelect =
        document.getElementById("periodSelect");

    function updateChart() {

        if (!plantChart || !metricSelect || !periodSelect) {
            return;
        }

        const metric = metricSelect.value;

        const period = periodSelect.value;

        const selectedData = chartData[period];

        if (
            !selectedData ||
            !metricNames[metric] ||
            !selectedData[metric]
        ) {
            console.warn("Invalid chart filter selection.");
            return;
        }

        plantChart.data.labels = selectedData.labels;

        plantChart.data.datasets[0].label =
            metricNames[metric];

        plantChart.data.datasets[0].data =
            selectedData[metric];

        plantChart.update();
    }

    if (metricSelect) {
        metricSelect.addEventListener("change", updateChart);
    }

    if (periodSelect) {
        periodSelect.addEventListener("change", updateChart);
    }

    // =====================================
    // 7. SEARCH TABLE
    // =====================================

    const tableSearch =
        document.getElementById("tableSearch");

    const tableBody =
        document.getElementById("plantTableBody");

    if (tableSearch && tableBody) {

        tableSearch.addEventListener("input", function () {

            const searchText = this.value.toLowerCase();

            tableBody.querySelectorAll("tr").forEach(function (row) {

                const rowText = row.textContent.toLowerCase();

                row.hidden = !rowText.includes(searchText);

            });
        });
    }

    // =====================================
    // 8. EXPORT TABLE TO CSV
    // =====================================

    const exportButton =
        document.getElementById("exportButton");

    if (exportButton) {

        exportButton.addEventListener("click", function () {

            const table =
                document.querySelector("#plantTable table");

            if (!table) {

                console.warn("Plant data table not found.");

                return;
            }

            // Export complete table, including hidden rows.

            const rows =
                Array.from(table.querySelectorAll("tr"));

            const csvContent = rows.map(function (row) {

                const cells =
                    Array.from(row.querySelectorAll("th, td"));

                return cells.map(function (cell) {

                    const value = cell.innerText
                        .trim()
                        .replace(/"/g, '""');

                    return '"' + value + '"';

                }).join(",");

            }).join("\r\n");

            const blob = new Blob(
                ["\uFEFF" + csvContent],
                {
                    type: "text/csv;charset=utf-8;"
                }
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
    }

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

        const lastLog =
            document.getElementById("lastLog");

        const refreshTime =
            document.getElementById("refreshTime");

        if (lastLog) {
            lastLog.textContent = dateTime;
        }

        if (refreshTime) {
            refreshTime.textContent = dateTime;
        }

        document.querySelectorAll(".updated-time").forEach(
            function (cell) {

                cell.textContent = now.toLocaleTimeString(
                    "en-IN",
                    {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false
                    }
                );

            }
        );
    }

    updateRefreshTime();

    // Updates the displayed clock every 5 seconds.
    // This does not refresh actual plant measurements.

    window.setInterval(updateRefreshTime, 5000);

});
