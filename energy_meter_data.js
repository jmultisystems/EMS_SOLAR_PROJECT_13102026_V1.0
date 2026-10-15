
// ==========================================
// SOLAR EMS - ENERGY METER DATA
// Demonstration data only
// ==========================================

const meterData = [
    {
        name: "Main Energy Meter",
        status: "Online",
        vr: 415.2,
        vy: 414.8,
        vb: 416.1,
        ir: 185.4,
        iy: 182.7,
        ib: 187.2,
        activePower: 126.5,
        reactivePower: 18.4,
        apparentPower: 127.8,
        powerFactor: 0.99,
        frequency: 50.01,
        importEnergy: 185420.5,
        exportEnergy: 72480.2
    },
    {
        name: "Inverter Feeder Meter",
        status: "Online",
        vr: 415.0,
        vy: 414.5,
        vb: 415.7,
        ir: 142.6,
        iy: 139.8,
        ib: 144.1,
        activePower: 96.8,
        reactivePower: 12.5,
        apparentPower: 97.6,
        powerFactor: 0.99,
        frequency: 50.00,
        importEnergy: 82560.8,
        exportEnergy: 156240.5
    },
    {
        name: "Auxiliary Meter",
        status: "Offline",
        vr: 0,
        vy: 0,
        vb: 0,
        ir: 0,
        iy: 0,
        ib: 0,
        activePower: 0,
        reactivePower: 0,
        apparentPower: 0,
        powerFactor: 0,
        frequency: 0,
        importEnergy: 12540.6,
        exportEnergy: 0
    }
];

let selectedMeter = 0;
let selectedRange = "today";
let meterChart = null;

const byId = id => document.getElementById(id);

// ==========================================
// FORMATTING
// ==========================================

function formatNumber(value, decimals = 1) {
    return Number(value).toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

function getOnlineMeters() {
    return meterData.filter(meter => meter.status === "Online");
}

function getTotal(parameter) {
    return meterData.reduce(
        (sum, meter) => sum + meter[parameter],
        0
    );
}

function getAverage(parameter) {
    const online = getOnlineMeters();

    if (!online.length) return 0;

    return online.reduce(
        (sum, meter) => sum + meter[parameter],
        0
    ) / online.length;
}

function getAveragePhase(meter, parameter) {
    return (
        meter[parameter + "r"] +
        meter[parameter + "y"] +
        meter[parameter + "b"]
    ) / 3;
}

// ==========================================
// SUMMARY AND KPI VALUES
// ==========================================

function updateSummary() {
    const onlineCount = getOnlineMeters().length;

    byId("lastLog").textContent =
        new Date().toLocaleString("en-IN");

    byId("totalActivePower").textContent =
        formatNumber(getTotal("activePower")) + " kW";

    byId("totalImport").textContent =
        formatNumber(getTotal("importEnergy")) + " kWh";

    byId("totalExport").textContent =
        formatNumber(getTotal("exportEnergy")) + " kWh";

    byId("averagePF").textContent =
        formatNumber(getAverage("powerFactor"), 2);

    byId("activePower").textContent =
        formatNumber(getTotal("activePower")) + " kW";

    byId("reactivePower").textContent =
        formatNumber(getTotal("reactivePower")) + " kVAr";

    byId("apparentPower").textContent =
        formatNumber(getTotal("apparentPower")) + " kVA";

    byId("powerFactor").textContent =
        formatNumber(getAverage("powerFactor"), 2);

    byId("connectionStatus").textContent =
        `${onlineCount} of ${meterData.length} meters online`;
}

// ==========================================
// METER SELECT DROPDOWN
// ==========================================

function populateMeterSelect() {
    const select = byId("meterSelect");

    select.innerHTML = "";

    meterData.forEach((meter, index) => {
        const option = document.createElement("option");

        option.value = index;
        option.textContent = meter.name;

        select.appendChild(option);
    });

    select.value = selectedMeter;
}

// ==========================================
// SELECTED METER DETAILS
// ==========================================

function updateMeterDetails() {
    const meter = meterData[selectedMeter];

    if (!meter) return;

    byId("meterSelect").value = selectedMeter;

    byId("selectedStatus").textContent = meter.status;

    byId("selectedStatus").className =
        "status-badge " +
        (meter.status === "Online" ? "online" : "offline");

    byId("detailName").textContent = meter.name;

    byId("detailVoltage").textContent =
        `${formatNumber(meter.vr)} / ` +
        `${formatNumber(meter.vy)} / ` +
        `${formatNumber(meter.vb)} V`;

    byId("detailCurrent").textContent =
        `${formatNumber(meter.ir)} / ` +
        `${formatNumber(meter.iy)} / ` +
        `${formatNumber(meter.ib)} A`;

    byId("detailFrequency").textContent =
        formatNumber(meter.frequency, 2) + " Hz";

    byId("detailPF").textContent =
        formatNumber(meter.powerFactor, 2);

    byId("detailActivePower").textContent =
        formatNumber(meter.activePower) + " kW";

    byId("detailImport").textContent =
        formatNumber(meter.importEnergy) + " kWh";

    byId("detailExport").textContent =
        formatNumber(meter.exportEnergy) + " kWh";

    // Three-phase readings
    byId("voltageR").textContent =
        formatNumber(meter.vr) + " V";

    byId("voltageY").textContent =
        formatNumber(meter.vy) + " V";

    byId("voltageB").textContent =
        formatNumber(meter.vb) + " V";

    byId("currentR").textContent =
        formatNumber(meter.ir) + " A";

    byId("currentY").textContent =
        formatNumber(meter.iy) + " A";

    byId("currentB").textContent =
        formatNumber(meter.ib) + " A";

    renderMeterCards();
}

// ==========================================
// METER OVERVIEW CARDS
// ==========================================

function renderMeterCards() {
    const container = byId("meterCards");

    container.innerHTML = "";

    meterData.forEach((meter, index) => {
        const card = document.createElement("article");

        card.className = "meter-card";

        if (index === selectedMeter) {
            card.classList.add("selected");
        }

        card.tabIndex = 0;
        card.setAttribute("role", "button");
        card.setAttribute(
            "aria-label",
            "View " + meter.name + " details"
        );

        card.innerHTML = `
            <div class="meter-card-top">
                <h3>${meter.name}</h3>
                <span class="status-badge ${
                    meter.status === "Online" ? "online" : "offline"
                }">${meter.status}</span>
            </div>

            <div class="card-power">
                ${formatNumber(meter.activePower)} kW
            </div>

            <p>Active Power</p>

            <div class="meter-card-bottom">
                <div>
                    <span>Power Factor</span>
                    <strong>${formatNumber(meter.powerFactor, 2)}</strong>
                </div>

                <div>
                    <span>Frequency</span>
                    <strong>${formatNumber(meter.frequency, 2)} Hz</strong>
                </div>
            </div>
        `;

        function selectCard() {
            selectedMeter = index;
            updateMeterDetails();
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

// ==========================================
// ENERGY METER TABLE
// ==========================================

function renderMeterTable() {
    const tbody = byId("meterTableBody");

    tbody.innerHTML = "";

    meterData.forEach(meter => {
        const row = document.createElement("tr");

        const values = [
            meter.name,
            meter.status,
            formatNumber(meter.vr),
            formatNumber(meter.vy),
            formatNumber(meter.vb),
            formatNumber(meter.ir),
            formatNumber(meter.iy),
            formatNumber(meter.ib),
            formatNumber(meter.activePower),
            formatNumber(meter.reactivePower),
            formatNumber(meter.apparentPower),
            formatNumber(meter.powerFactor, 2),
            formatNumber(meter.frequency, 2),
            formatNumber(meter.importEnergy),
            formatNumber(meter.exportEnergy)
        ];

        values.forEach((value, index) => {
            const cell = document.createElement("td");

            if (index === 1) {
                const badge = document.createElement("span");

                badge.className =
                    "status-badge " +
                    (meter.status === "Online" ? "online" : "offline");

                badge.textContent = meter.status;
                cell.appendChild(badge);
            } else {
                cell.textContent = value;
            }

            row.appendChild(cell);
        });

        tbody.appendChild(row);
    });

    filterMeterTable();
}

function filterMeterTable() {
    const search = byId("tableSearch").value
        .trim()
        .toLowerCase();

    const rows = [
        ...byId("meterTableBody").querySelectorAll("tr")
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
        `${visibleCount} of ${meterData.length} meters`;
}

// ==========================================
// CHART DATA
// ==========================================

function generateChartData() {
    const meter = meterData[selectedMeter];
    const parameter = byId("graphMetric").value;

    let labels;
    let factors;

    if (selectedRange === "week") {
        labels = [
            "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
        ];

        factors = [0.72, 0.88, 0.80, 0.96, 0.90, 0.75, 1.0];

    } else if (selectedRange === "month") {
        labels = [
            "Week 1", "Week 2", "Week 3", "Week 4"
        ];

        factors = [0.78, 0.91, 0.85, 1.0];

    } else {
        labels = [
            "06:00", "08:00", "10:00", "12:00",
            "14:00", "16:00", "18:00"
        ];

        factors = [0.55, 0.75, 0.91, 1.0, 0.94, 0.80, 0.60];
    }

    let baseValue;

    switch (parameter) {
        case "activePower":
            baseValue = meter.activePower;
            break;

        case "reactivePower":
            baseValue = meter.reactivePower;
            break;

        case "apparentPower":
            baseValue = meter.apparentPower;
            break;

        case "powerFactor":
            baseValue = meter.powerFactor;
            break;

        case "voltage":
            baseValue = (
                meter.vr + meter.vy + meter.vb
            ) / 3;
            break;

        case "current":
            baseValue = (
                meter.ir + meter.iy + meter.ib
            ) / 3;
            break;

        default:
            baseValue = meter.activePower;
    }

    return {
        labels,
        values: factors.map(factor => baseValue * factor)
    };
}

// ==========================================
// CHART CREATION
// ==========================================

function createChart() {
    const canvas = byId("meterChart");

    meterChart = new Chart(canvas, {
        type: "line",

        data: {
            labels: [],
            datasets: [{
                label: "Active Power (kW)",
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

// ==========================================
// UPDATE CHART
// ==========================================

function updateChart() {
    if (!meterChart) return;

    const parameter = byId("graphMetric").value;

    const labels = {
        activePower: "Active Power (kW)",
        reactivePower: "Reactive Power (kVAr)",
        apparentPower: "Apparent Power (kVA)",
        powerFactor: "Power Factor",
        voltage: "Average Voltage (V)",
        current: "Average Current (A)"
    };

    const colors = {
        activePower: "#13d5ed",
        reactivePower: "#a58bff",
        apparentPower: "#078cff",
        powerFactor: "#27d89a",
        voltage: "#ffad5c",
        current: "#ff6378"
    };

    const data = generateChartData();

    meterChart.data.labels = data.labels;
    meterChart.data.datasets[0].label = labels[parameter];
    meterChart.data.datasets[0].data = data.values;
    meterChart.data.datasets[0].borderColor = colors[parameter];
    meterChart.data.datasets[0].backgroundColor =
        colors[parameter] + "20";

    meterChart.update();
}

// ==========================================
// PANEL / TABLE VIEW
// ==========================================

function setupViewTabs() {
    document.querySelectorAll(".tab").forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelectorAll(".tab").forEach(item => {
                item.classList.remove("active");
            });

            tab.classList.add("active");

            const showPanel = tab.dataset.view === "panelView";

            byId("panelView").hidden = !showPanel;
            byId("tableView").hidden = showPanel;

            if (showPanel && meterChart) {
                meterChart.resize();
            }
        });
    });
}

// ==========================================
// SIDEBAR NAVIGATION
// ==========================================

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

// ==========================================
// CHART CONTROLS
// ==========================================

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

// ==========================================
// PLANT SELECTOR
// Demo: label changes only.
// Connect plant-specific API data for real use.
// ==========================================

function setupPlantSelector() {
    byId("plantSelect").addEventListener("change", event => {
        const option =
            event.target.options[event.target.selectedIndex];

        byId("connectionStatus").textContent =
            "Demo Data - " + option.textContent.trim();
    });
}

// ==========================================
// INITIALIZE
// ==========================================

function initializeDashboard() {
    updateSummary();

    populateMeterSelect();

    renderMeterTable();

    renderMeterCards();

    updateMeterDetails();

    createChart();

    setupViewTabs();

    setupNavigation();

    setupChartControls();

    setupPlantSelector();

    byId("tableSearch").addEventListener(
        "input",
        filterMeterTable
    );

    byId("meterSelect").addEventListener("change", event => {
        selectedMeter = Number(event.target.value);

        updateMeterDetails();
        updateChart();
    });
}

document.addEventListener(
    "DOMContentLoaded",
    initializeDashboard
);