
"use strict";

/*
 * Solar EMS - Substation Data
 * Demonstration values only.
 * No live PLC/SCADA connection is configured here.
 */

const $ = (id) => document.getElementById(id);

/* DEMO SUBSTATION VALUES */

const substationData = {
    hvVoltage: 33.00,
    lvVoltage: 0.433,
    hvCurrent: 84.4,
    lvCurrent: 6420,
    oilTemp: 48.2,
    windingTemp: 62.5,
    activePower: 4.82,
    reactivePower: 0.72,
    gridFrequency: 50.02,
    transformerLoad: 68,
    powerFactor: 0.98
};

const dataRows = [
    { parameter: "HV Voltage", value: "33.00", unit: "kV", status: "Normal" },
    { parameter: "LV Voltage", value: "0.433", unit: "kV", status: "Normal" },
    { parameter: "HV Current", value: "84.4", unit: "A", status: "Normal" },
    { parameter: "LV Current", value: "6420", unit: "A", status: "Normal" },
    { parameter: "Active Power", value: "4.82", unit: "MW", status: "Normal" },
    { parameter: "Reactive Power", value: "0.72", unit: "MVAr", status: "Normal" },
    { parameter: "Grid Frequency", value: "50.02", unit: "Hz", status: "Normal" },
    { parameter: "Transformer Load", value: "68", unit: "%", status: "Normal" },
    { parameter: "Power Factor", value: "0.98", unit: "PF", status: "Normal" },
    { parameter: "Oil Temperature", value: "48.2", unit: "°C", status: "Normal" },
    { parameter: "Winding Temperature", value: "62.5", unit: "°C", status: "Normal" }
];

/* CLOCK */

function updateClock() {
    const now = new Date();

    $("lastLog").textContent = now.toLocaleString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    });
}

updateClock();
setInterval(updateClock, 1000);

/* UPDATE SUMMARY AND KPI VALUES */

function updateValues() {
    $("activePower").textContent =
        `${substationData.activePower.toFixed(3)} MW`;

    $("activePowerCard").textContent =
        substationData.activePower.toFixed(2);

    $("gridFrequency").textContent =
        `${substationData.gridFrequency.toFixed(2)} Hz`;

    $("transformerLoad").textContent =
        `${substationData.transformerLoad.toFixed(1)} %`;

    $("busbarVoltage").textContent =
        `${substationData.hvVoltage.toFixed(2)} kV`;

    $("powerFactor").textContent =
        substationData.powerFactor.toFixed(2);

    $("hvVoltage").textContent =
        substationData.hvVoltage.toFixed(2);

    $("lvVoltage").textContent =
        substationData.lvVoltage.toFixed(3);

    $("hvCurrent").textContent =
        substationData.hvCurrent.toFixed(1);

    $("lvCurrent").textContent =
        substationData.lvCurrent.toFixed(0);

    $("oilTemp").textContent =
        substationData.oilTemp.toFixed(1);

    $("windingTemp").textContent =
        substationData.windingTemp.toFixed(1);

    $("reactivePower").textContent =
        substationData.reactivePower.toFixed(2);

    $("generalLoad").textContent =
        `${substationData.transformerLoad.toFixed(0)} %`;

    $("generalOilTemp").textContent =
        `${substationData.oilTemp.toFixed(1)} °C`;

    $("generalWindingTemp").textContent =
        `${substationData.windingTemp.toFixed(1)} °C`;

    $("loadFill").style.width =
        `${Math.min(100, Math.max(0, substationData.transformerLoad))}%`;
}

updateValues();

/* SIDEBAR SUBMENUS */

document.querySelectorAll(".nav-toggle").forEach((button) => {
    button.addEventListener("click", () => {
        const group = button.closest(".nav-group");
        const isOpen = group.classList.toggle("open");

        button.setAttribute("aria-expanded", String(isOpen));
    });
});

/* MOBILE SIDEBAR */

const sidebar = $("sidebar");
const mobileOverlay = $("mobileOverlay");

$("menuButton").addEventListener("click", () => {
    sidebar.classList.toggle("sidebar-visible");
    mobileOverlay.classList.toggle("show");
});

mobileOverlay.addEventListener("click", closeSidebar);

function closeSidebar() {
    sidebar.classList.remove("sidebar-visible");
    mobileOverlay.classList.remove("show");
}

/* PANEL AND TABLE TABS */

const panelView = $("panelView");
const tableView = $("tableView");
const kpiGrid = $("kpiGrid");
const breakerPanel = $("breakerPanel");

document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach((tab) => {
            tab.classList.remove("active");
        });

        button.classList.add("active");

        const selectedView = button.dataset.view;
        const showPanel = selectedView === "panelView";

        panelView.hidden = !showPanel;
        tableView.hidden = showPanel;
        kpiGrid.hidden = !showPanel;
        breakerPanel.hidden = !showPanel;

        if (showPanel && substationChart) {
            substationChart.resize();
        }
    });
});

/* CHART DATA */

let substationChart = null;

function createChart() {
    const canvas = $("substationChart");

    if (!canvas || typeof Chart === "undefined") {
        console.error("Chart.js failed to load.");
        return;
    }

    const labels = [
        "06:00", "07:00", "08:00", "09:00",
        "10:00", "11:00", "12:00", "13:00",
        "14:00", "15:00", "16:00", "17:00"
    ];

    const chartValues = {
        voltage: [32.88, 32.92, 33.01, 33.05, 32.97, 33.02,
                  33.08, 33.00, 32.95, 33.03, 32.99, 33.00],

        frequency: [49.98, 50.01, 50.00, 50.02, 50.04, 50.01,
                    50.03, 49.99, 50.00, 50.02, 50.01, 50.02],

        power: [0.85, 1.35, 2.10, 3.20, 4.15, 4.70,
                4.82, 4.65, 4.20, 3.55, 2.30, 1.10],

        temperature: [42.1, 43.0, 45.2, 48.0, 51.2, 55.1,
                      58.2, 60.1, 62.5, 61.8, 59.2, 55.0]
    };

    const metricOptions = {
        voltage: {
            label: "Busbar Voltage (kV)",
            color: "#13d5ed",
            values: chartValues.voltage
        },
        frequency: {
            label: "Grid Frequency (Hz)",
            color: "#b29aff",
            values: chartValues.frequency
        },
        power: {
            label: "Active Power (MW)",
            color: "#00d7a0",
            values: chartValues.power
        },
        temperature: {
            label: "Transformer Temperature (°C)",
            color: "#ff9d42",
            values: chartValues.temperature
        }
    };

    const initialMetric = metricOptions[$("graphMetric").value];

    substationChart = new Chart(canvas, {
        type: "line",

        data: {
            labels,
            datasets: [{
                label: initialMetric.label,
                data: initialMetric.values,
                borderColor: initialMetric.color,
                backgroundColor: initialMetric.color + "20",
                fill: true,
                tension: 0.35,
                borderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 5
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    labels: {
                        color: "#b9d0ed",
                        usePointStyle: true,
                        font: { size: 10 }
                    }
                },

                tooltip: {
                    backgroundColor: "#061a35",
                    borderColor: "#164779",
                    borderWidth: 1
                }
            },

            scales: {
                x: {
                    ticks: {
                        color: "#9db8d8",
                        maxTicksLimit: 7
                    },
                    grid: {
                        color: "#16477935"
                    }
                },

                y: {
                    ticks: {
                        color: "#9db8d8"
                    },
                    grid: {
                        color: "#16477945"
                    }
                }
            }
        }
    });
}

createChart();

/* CHANGE GRAPH METRIC */

$("graphMetric").addEventListener("change", function () {
    if (!substationChart) return;

    const metric = this.value;

    const metricOptions = {
        voltage: {
            label: "Busbar Voltage (kV)",
            color: "#13d5ed",
            values: [32.88, 32.92, 33.01, 33.05, 32.97, 33.02,
                     33.08, 33.00, 32.95, 33.03, 32.99, 33.00]
        },
        frequency: {
            label: "Grid Frequency (Hz)",
            color: "#b29aff",
            values: [49.98, 50.01, 50.00, 50.02, 50.04, 50.01,
                     50.03, 49.99, 50.00, 50.02, 50.01, 50.02]
        },
        power: {
            label: "Active Power (MW)",
            color: "#00d7a0",
            values: [0.85, 1.35, 2.10, 3.20, 4.15, 4.70,
                     4.82, 4.65, 4.20, 3.55, 2.30, 1.10]
        },
        temperature: {
            label: "Transformer Temperature (°C)",
            color: "#ff9d42",
            values: [42.1, 43.0, 45.2, 48.0, 51.2, 55.1,
                     58.2, 60.1, 62.5, 61.8, 59.2, 55.0]
        }
    };

    const selected = metricOptions[metric];

    substationChart.data.datasets[0].label = selected.label;
    substationChart.data.datasets[0].data = selected.values;
    substationChart.data.datasets[0].borderColor = selected.color;
    substationChart.data.datasets[0].backgroundColor = selected.color + "20";

    substationChart.update();
});

/* TREND RANGE BUTTONS */

document.querySelectorAll(".range").forEach((button) => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".range").forEach((item) => {
            item.classList.remove("active");
        });

        button.classList.add("active");

        /*
         * The range buttons are UI controls in this demo.
         * Load historical data from your backend to make
         * Today / Week / Month / Year represent real periods.
         */
    });
});

/* RENDER TABLE SAFELY */

function renderTable(searchText = "") {
    const tbody = $("substationTableBody");
    const term = searchText.trim().toLowerCase();

    const filtered = dataRows.filter((row) =>
        `${row.parameter} ${row.value} ${row.unit} ${row.status}`
            .toLowerCase()
            .includes(term)
    );

    tbody.replaceChildren();

    if (filtered.length === 0) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");

        td.colSpan = 4;
        td.textContent = "No matching records found.";
        td.style.textAlign = "center";

        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    filtered.forEach((row) => {
        const tr = document.createElement("tr");

        [row.parameter, row.value, row.unit].forEach((value) => {
            const td = document.createElement("td");
            td.textContent = value;
            tr.appendChild(td);
        });

        const statusCell = document.createElement("td");
        const badge = document.createElement("span");

        badge.className = "table-status";
        badge.textContent = row.status;

        statusCell.appendChild(badge);
        tr.appendChild(statusCell);
        tbody.appendChild(tr);
    });
}

renderTable();

$("tableSearch").addEventListener("input", function () {
    renderTable(this.value);
});

/* EXPORT TABLE DATA TO CSV */

$("exportButton").addEventListener("click", () => {
    const headers = ["Parameter", "Value", "Unit", "Status"];

    const rows = dataRows.map((row) => [
        row.parameter,
        row.value,
        row.unit,
        row.status
    ]);

    const escapeCsv = (value) =>
        `"${String(value).replace(/"/g, '""')}"`;

    const csv = [headers, ...rows]
        .map((row) => row.map(escapeCsv).join(","))
        .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "substation_data.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
});

/* PLANT SELECTOR */

$("plantSelect").addEventListener("change", function () {
    document.title = `Substation Data | ${this.options[this.selectedIndex].text}`;

    /*
     * Add your API call here to load the selected plant's
     * substation values from Flask, PLC, or SCADA.
     */
});
