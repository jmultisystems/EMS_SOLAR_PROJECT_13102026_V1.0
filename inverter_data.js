// ========================================
// SOLAR EMS - INVERTER DATA DASHBOARD
// Demonstration data only
// ========================================

const inverterData = [
    {
        name: "Inverter 01",
        status: "Running",
        dcPower: 425.5,
        acPower: 419.8,
        dcVoltage: 850,
        dcCurrent: 500.6,
        acVoltage: 415,
        acCurrent: 584.0,
        frequency: 50.01,
        temperature: 42.5,
        efficiency: 98.66,
        today: 1850.5,
        month: 42560
    },
    {
        name: "Inverter 02",
        status: "Running",
        dcPower: 410.2,
        acPower: 404.5,
        dcVoltage: 845,
        dcCurrent: 485.4,
        acVoltage: 414,
        acCurrent: 562.8,
        frequency: 50.00,
        temperature: 40.8,
        efficiency: 98.61,
        today: 1790.2,
        month: 41850
    },
    {
        name: "Inverter 03",
        status: "Running",
        dcPower: 395.6,
        acPower: 389.9,
        dcVoltage: 840,
        dcCurrent: 470.9,
        acVoltage: 416,
        acCurrent: 542.0,
        frequency: 49.99,
        temperature: 43.2,
        efficiency: 98.56,
        today: 1685.4,
        month: 40280
    },
    {
        name: "Inverter 04",
        status: "Running",
        dcPower: 430.8,
        acPower: 424.2,
        dcVoltage: 855,
        dcCurrent: 503.9,
        acVoltage: 415,
        acCurrent: 590.1,
        frequency: 50.02,
        temperature: 44.1,
        efficiency: 98.47,
        today: 1895.6,
        month: 43100
    },
    {
        name: "Inverter 05",
        status: "Stopped",
        dcPower: 0,
        acPower: 0,
        dcVoltage: 0,
        dcCurrent: 0,
        acVoltage: 415,
        acCurrent: 0,
        frequency: 0,
        temperature: 31.5,
        efficiency: 0,
        today: 950.2,
        month: 36500
    },
    {
        name: "Inverter 06",
        status: "Running",
        dcPower: 415.7,
        acPower: 409.4,
        dcVoltage: 848,
        dcCurrent: 490.2,
        acVoltage: 415,
        acCurrent: 569.4,
        frequency: 50.00,
        temperature: 41.6,
        efficiency: 98.49,
        today: 1820.8,
        month: 42050
    }
];

let selectedInverter = 0;
let selectedRange = "today";
let chart = null;

// ========================================
// HELPER FUNCTIONS
// ========================================

const byId = id => document.getElementById(id);

function formatNumber(value, decimals = 1) {
    return Number(value).toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

function getRunningInverters() {
    return inverterData.filter(item => item.status === "Running");
}

function getTotal(key) {
    return inverterData.reduce((sum, item) => sum + item[key], 0);
}

function getAverage(key) {
    const running = getRunningInverters();

    if (!running.length) return 0;

    return running.reduce((sum, item) => sum + item[key], 0)
        / running.length;
}

function getStatusClass(status) {
    if (status === "Running") return "running";
    if (status === "Fault") return "fault";
    return "stopped";
}

// ========================================
// SUMMARY AND KPI VALUES
// ========================================

function updateSummary() {
    const running = getRunningInverters();

    byId("lastLog").textContent =
        new Date().toLocaleString("en-IN");

    byId("totalPower").textContent =
        formatNumber(getTotal("acPower"), 1) + " kW";

    byId("todayGeneration").textContent =
        formatNumber(getTotal("today"), 1) + " kWh";

    byId("activeInverters").textContent =
        `${running.length} / ${inverterData.length}`;

    byId("avgEfficiency").textContent =
        formatNumber(getAverage("efficiency"), 2) + " %";

    byId("dcPower").textContent =
        formatNumber(getTotal("dcPower"), 1) + " kW";

    byId("acPower").textContent =
        formatNumber(getTotal("acPower"), 1) + " kW";

    byId("avgTemperature").textContent =
        formatNumber(getAverage("temperature"), 1) + " °C";

    byId("monthGeneration").textContent =
        formatNumber(getTotal("month"), 1) + " kWh";
}

// ========================================
// INVERTER DROPDOWN
// ========================================

function populateInverterSelect() {
    const select = byId("inverterSelect");

    select.innerHTML = "";

    inverterData.forEach((inverter, index) => {
        const option = document.createElement("option");

        option.value = index;
        option.textContent = inverter.name;

        select.appendChild(option);
    });

    select.value = selectedInverter;
}

// ========================================
// SELECTED INVERTER DETAILS
// ========================================

function updateSelectedInverter() {
    const inverter = inverterData[selectedInverter];

    if (!inverter) return;

    byId("inverterSelect").value = selectedInverter;

    byId("selectedStatus").textContent = inverter.status;
    byId("selectedStatus").className =
        "status-badge " + getStatusClass(inverter.status);

    byId("detailName").textContent = inverter.name;
    byId("detailDcVoltage").textContent =
        formatNumber(inverter.dcVoltage) + " V";

    byId("detailDcCurrent").textContent =
        formatNumber(inverter.dcCurrent) + " A";

    byId("detailAcVoltage").textContent =
        formatNumber(inverter.acVoltage) + " V";

    byId("detailAcCurrent").textContent =
        formatNumber(inverter.acCurrent) + " A";

    byId("detailFrequency").textContent =
        formatNumber(inverter.frequency, 2) + " Hz";

    byId("detailEfficiency").textContent =
        formatNumber(inverter.efficiency, 2) + " %";

    byId("detailTemperature").textContent =
        formatNumber(inverter.temperature) + " °C";

    renderInverterCards();
}

// ========================================
// INVERTER OVERVIEW CARDS
// ========================================

function renderInverterCards() {
    const container = byId("inverterCards");

    container.innerHTML = "";

    inverterData.forEach((inverter, index) => {
        const card = document.createElement("article");

        card.className = "inverter-card";

        if (index === selectedInverter) {
            card.classList.add("selected");
        }

        card.tabIndex = 0;
        card.setAttribute("role", "button");
        card.setAttribute(
            "aria-label",
            "View " + inverter.name + " details"
        );

        card.innerHTML = `
            <div class="inverter-card-top">
                <h3>${inverter.name}</h3>
                <span class="status-badge ${getStatusClass(inverter.status)}">
                    ${inverter.status}
                </span>
            </div>

            <div class="card-power">
                ${formatNumber(inverter.acPower)} kW
            </div>

            <p>AC Output Power</p>

            <div class="inverter-card-bottom">
                <div>
                    <span>DC Power</span>
                    <strong>${formatNumber(inverter.dcPower)} kW</strong>
                </div>

                <div>
                    <span>Temperature</span>
                    <strong>${formatNumber(inverter.temperature)} °C</strong>
                </div>

                <div>
                    <span>Efficiency</span>
                    <strong>${formatNumber(inverter.efficiency, 2)}%</strong>
                </div>
            </div>
        `;

        function selectCard() {
            selectedInverter = index;
            updateSelectedInverter();
            updateChart();
        }

        card.addEventListener("click", selectCard);

        card.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                selectCard();
            }
        });

        container.appendChild(card);
    });
}

// ========================================
// INVERTER DATA TABLE
// ========================================

function renderInverterTable() {
    const tbody = byId("inverterTableBody");

    tbody.innerHTML = "";

    inverterData.forEach(inverter => {
        const row = document.createElement("tr");

        const values = [
            inverter.name,
            inverter.status,
            formatNumber(inverter.dcPower),
            formatNumber(inverter.acPower),
            formatNumber(inverter.dcVoltage),
            formatNumber(inverter.dcCurrent),
            formatNumber(inverter.acVoltage),
            formatNumber(inverter.acCurrent),
            formatNumber(inverter.frequency, 2),
            formatNumber(inverter.temperature),
            formatNumber(inverter.efficiency, 2),
            formatNumber(inverter.today)
        ];

        values.forEach((value, index) => {
            const cell = document.createElement("td");

            // Use textContent so values are inserted as text.
            cell.textContent = value;

            if (index === 1) {
                const badge = document.createElement("span");

                badge.className =
                    "status-badge " +
                    getStatusClass(inverter.status);

                badge.textContent = inverter.status;

                cell.textContent = "";
                cell.appendChild(badge);
            }

            row.appendChild(cell);
        });

        tbody.appendChild(row);
    });

    filterInverterTable();
}

function filterInverterTable() {
    const search = byId("tableSearch").value
        .trim()
        .toLowerCase();

    const rows = [
        ...byId("inverterTableBody").querySelectorAll("tr")
    ];

    let visibleCount = 0;

    rows.forEach(row => {
        const matches = row.textContent
            .toLowerCase()
            .includes(search);

        row.hidden = !matches;

        if (matches) visibleCount++;
    });

    byId("tableCount").textContent =
        `${visibleCount} of ${inverterData.length} inverters`;
}

// ========================================
// PERFORMANCE CHART
// ========================================

function generateChartData() {
    const inverter = inverterData[selectedInverter];

    let labels;
    let multiplier;

    if (selectedRange === "week") {
        labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        multiplier = [0.82, 0.91, 0.76, 0.96, 0.88, 0.72, 1.0];
    } else if (selectedRange === "month") {
        labels = ["Week 1", "Week 2", "Week 3", "Week 4"];
        multiplier = [0.83, 0.92, 0.88, 1.0];
    } else {
        labels = [
            "06:00", "08:00", "10:00", "12:00",
            "14:00", "16:00", "18:00"
        ];
        multiplier = [0.12, 0.42, 0.76, 1.0, 0.87, 0.54, 0.14];
    }

    const metric = byId("graphMetric").value;

    let baseValue = inverter.acPower;

    if (metric === "dcPower") {
        baseValue = inverter.dcPower;
    } else if (metric === "temperature") {
        baseValue = inverter.temperature;
    } else if (metric === "efficiency") {
        baseValue = inverter.efficiency;
    }

    return {
        labels,
        values: multiplier.map(factor => {
            if (metric === "temperature") {
                return inverter.temperature * (0.8 + factor * 0.2);
            }

            if (metric === "efficiency") {
                return inverter.efficiency * (0.95 + factor * 0.05);
            }

            return baseValue * factor;
        })
    };
}

function createChart() {
    const canvas = byId("inverterChart");

    chart = new Chart(canvas, {
        type: "line",

        data: {
            labels: [],
            datasets: [{
                label: "AC Power (kW)",
                data: [],
                borderColor: "#13d5ed",
                backgroundColor: "rgba(19, 213, 237, 0.12)",
                borderWidth: 2,
                fill: true,
                tension: 0.35,
                pointRadius: 3,
                pointHoverRadius: 5
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
                        color: "#d5e8fa",
                        usePointStyle: true
                    }
                }
            },

            scales: {
                x: {
                    grid: {
                        color: "rgba(120, 165, 210, 0.10)"
                    },
                    ticks: {
                        color: "#9db8d8"
                    }
                },

                y: {
                    beginAtZero: true,
                    grid: {
                        color: "rgba(120, 165, 210, 0.12)"
                    },
                    ticks: {
                        color: "#9db8d8"
                    }
                }
            }
        }
    });

    updateChart();
}

function updateChart() {
    if (!chart) return;

    const metric = byId("graphMetric").value;

    const names = {
        power: "AC Power (kW)",
        dcPower: "DC Power (kW)",
        temperature: "Temperature (°C)",
        efficiency: "Efficiency (%)"
    };

    const colors = {
        power: "#13d5ed",
        dcPower: "#078cff",
        temperature: "#ffad5c",
        efficiency: "#a58bff"
    };

    const data = generateChartData();

    chart.data.labels = data.labels;
    chart.data.datasets[0].label = names[metric];
    chart.data.datasets[0].data = data.values;
    chart.data.datasets[0].borderColor = colors[metric];
    chart.data.datasets[0].backgroundColor =
        colors[metric] + "20";

    chart.update();
}

// ========================================
// PANEL / TABLE SWITCHING
// ========================================

function setupViewTabs() {
    document.querySelectorAll(".tab").forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelectorAll(".tab").forEach(item => {
                item.classList.remove("active");
            });

            tab.classList.add("active");

            const view = tab.dataset.view;

            byId("panelView").hidden = view !== "panelView";
            byId("tableView").hidden = view !== "tableView";
        });
    });
}

// ========================================
// SIDEBAR DROPDOWNS
// ========================================

function setupNavigation() {
    document.querySelectorAll(".nav-toggle").forEach(button => {
        button.addEventListener("click", () => {
            const group = button.closest(".nav-group");
            const isOpen = group.classList.toggle("open");

            button.setAttribute("aria-expanded", String(isOpen));
        });
    });

    byId("menuButton").addEventListener("click", () => {
        byId("sidebar").classList.toggle("sidebar-visible");
    });

    document.querySelectorAll(".submenu a").forEach(link => {
        link.addEventListener("click", () => {
            if (window.innerWidth <= 850) {
                byId("sidebar").classList.remove("sidebar-visible");
            }
        });
    });
}

// ========================================
// PLANT SELECTOR
// Demo behavior: changes the selected plant
// label only. Separate plant datasets or an
// API are needed for actual plant-specific data.
// ========================================

function setupPlantSelector() {
    byId("plantSelect").addEventListener("change", event => {
        const selectedOption =
            event.target.options[event.target.selectedIndex];

        byId("connectionStatus").textContent =
            "Demo Data - " + selectedOption.textContent.trim();
    });
}

// ========================================
// RANGE BUTTONS
// ========================================

function setupChartControls() {
    byId("graphMetric").addEventListener("change", updateChart);

    document.querySelectorAll(".range").forEach(button => {
        button.addEventListener("click", () => {
            document.querySelectorAll(".range").forEach(item => {
                item.classList.remove("active");
            });

            button.classList.add("active");
            selectedRange = button.dataset.range;

            updateChart();
        });
    });
}

// ========================================
// INITIALIZE DASHBOARD
// ========================================

function initializeDashboard() {
    updateSummary();

    populateInverterSelect();

    renderInverterTable();

    renderInverterCards();

    updateSelectedInverter();

    createChart();

    setupViewTabs();

    setupNavigation();

    setupPlantSelector();

    setupChartControls();

    byId("tableSearch").addEventListener(
        "input",
        filterInverterTable
    );

    byId("inverterSelect").addEventListener("change", event => {
        selectedInverter = Number(event.target.value);

        updateSelectedInverter();
        updateChart();
    });
}

document.addEventListener("DOMContentLoaded", initializeDashboard);
