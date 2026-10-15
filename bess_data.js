
document.addEventListener("DOMContentLoaded", () => {
    // =========================================
    // 1. SAMPLE BESS DATA
    // Replace these values with actual BMS/PLC
    // or Flask API readings when integrating.
    // =========================================

    const bess = {
        soc: 78,
        soh: 96,
        power: 250,             // Positive = discharge, negative = charge
        voltage: 750,
        current: 333.3,
        temperature: 28.5,
        ratedEnergy: 1000,      // Illustrative usable-capacity basis (kWh)
        availableEnergy: 780,
        alarmCount: 0,
        communication: "Connected"
    };

    const racks = [
        { id: "RACK-01", soc: 79, voltage: 750, temperature: 28.1, status: "Online" },
        { id: "RACK-02", soc: 78, voltage: 749, temperature: 28.5, status: "Online" },
        { id: "RACK-03", soc: 77, voltage: 751, temperature: 29.0, status: "Online" },
        { id: "RACK-04", soc: 78, voltage: 750, temperature: 28.4, status: "Online" }
    ];

    const parameters = [
        { id: "BESS.SOC", name: "State of Charge", value: bess.soc, unit: "%", equipment: "BMS" },
        { id: "BESS.SOH", name: "State of Health", value: bess.soh, unit: "%", equipment: "BMS" },
        { id: "BESS.POWER", name: "Active Power", value: bess.power, unit: "kW", equipment: "PCS" },
        { id: "BESS.VOLT", name: "DC Battery Voltage", value: bess.voltage, unit: "V", equipment: "Battery" },
        { id: "BESS.CURRENT", name: "DC Battery Current", value: bess.current, unit: "A", equipment: "Battery" },
        { id: "BESS.TEMP", name: "Battery Temperature", value: bess.temperature, unit: "°C", equipment: "BMS" },
        { id: "BESS.ENERGY", name: "Available Energy", value: bess.availableEnergy, unit: "kWh", equipment: "BMS" },
        { id: "BESS.ALARM", name: "Active Alarms", value: bess.alarmCount, unit: "count", equipment: "BMS" },
        ...racks.map(rack => ({
            id: `${rack.id}.SOC`,
            name: "Rack State of Charge",
            value: rack.soc,
            unit: "%",
            equipment: rack.id
        })),
        ...racks.map(rack => ({
            id: `${rack.id}.TEMP`,
            name: "Rack Temperature",
            value: rack.temperature,
            unit: "°C",
            equipment: rack.id
        }))
    ];

    // =========================================
    // 2. DOM HELPER
    // =========================================

    const $ = id => document.getElementById(id);

    function setText(id, value) {
        const element = $(id);
        if (element) element.textContent = value;
    }

    function formatNumber(value, decimals = 1) {
        return Number(value).toLocaleString("en-IN", {
            maximumFractionDigits: decimals
        });
    }

    // =========================================
    // 3. DATE AND TIME
    // =========================================

    function updateClock() {
        const now = new Date();

        setText(
            "currentDate",
            now.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            })
        );

        setText(
            "currentTime",
            now.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true
            })
        );
    }

    updateClock();
    setInterval(updateClock, 1000);

    // =========================================
    // 4. UPDATE BESS KPI CARDS
    // =========================================

    function updateBessCards() {
        const soc = Math.min(100, Math.max(0, bess.soc));
        const power = bess.power;
        const isCharging = power < 0;
        const mode = power > 0 ? "Discharging"
                   : power < 0 ? "Charging"
                   : "Idle";

        const powerDirection = power > 0 ? "DISCHARGE"
                             : power < 0 ? "CHARGE"
                             : "IDLE";

        setText("socValue", formatNumber(soc, 1));
        setText("sohValue", formatNumber(bess.soh, 1));
        setText("powerValue", formatNumber(Math.abs(power), 1));
        setText("energyValue", formatNumber(bess.availableEnergy, 1));

        setText("voltageValue", `${formatNumber(bess.voltage)} V`);
        setText("currentValue", `${formatNumber(Math.abs(bess.current))} A`);
        setText("temperatureValue", `${formatNumber(bess.temperature)} °C`);

        // Estimate runtime from available energy and discharge power.
        const runtime = power > 0
            ? bess.availableEnergy / power
            : null;

        setText(
            "runtimeValue",
            runtime === null
                ? (isCharging ? "Charging" : "Idle")
                : `${formatNumber(runtime, 2)} hours`
        );

        setText("operatingMode", "");
        $("operatingMode").innerHTML =
            `<i class="fa-solid fa-bolt"></i> ${mode}`;

        setText("powerDirection", powerDirection);
        setText("statusMode", mode);
        setText("statusTemperature", `${formatNumber(bess.temperature)} °C`);
        setText("alarmCount", bess.alarmCount);

        setText(
            "systemStatus",
            bess.communication === "Connected"
                ? "BESS system online"
                : "BESS communication unavailable"
        );

        const socProgress = $("socProgress");
        if (socProgress) {
            socProgress.style.width = `${soc}%`;
        }

        const batteryFill = $("batteryFill");
        if (batteryFill) {
            batteryFill.style.height = `${soc}%`;
        }

        setText("batterySocLabel", `${formatNumber(soc)}%`);

        setText(
            "lastUpdated",
            new Date().toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true
            })
        );

        const modeBadge = $("operatingMode");
        if (modeBadge) {
            modeBadge.style.color = isCharging ? "#24d18a" : "#13d5ed";
        }
    }

    updateBessCards();

    // =========================================
    // 5. BATTERY RACK CARDS
    // =========================================

    function renderRackCards() {
        const grid = $("rackGrid");
        if (!grid) return;

        setText("rackCount", `${racks.length} Racks`);

        grid.innerHTML = racks.map(rack => `
            <article class="rack-card">
                <div class="rack-card-top">
                    <h4>${rack.id}</h4>
                    <span class="rack-icon">
                        <i class="fa-solid fa-battery-three-quarters"></i>
                    </span>
                </div>

                <div class="rack-soc-row">
                    <strong>${formatNumber(rack.soc)}%</strong>
                    <span>State of Charge</span>
                </div>

                <div class="rack-progress">
                    <span style="width:${Math.min(100, Math.max(0, rack.soc))}%"></span>
                </div>

                <div class="rack-detail">
                    <span>Rack Voltage</span>
                    <strong>${formatNumber(rack.voltage)} V</strong>
                </div>

                <div class="rack-detail">
                    <span>Temperature</span>
                    <strong>${formatNumber(rack.temperature)} °C</strong>
                </div>

                <div class="rack-detail">
                    <span>Communication</span>
                    <strong class="rack-online">${rack.status}</strong>
                </div>
            </article>
        `).join("");
    }

    renderRackCards();

    // =========================================
    // 6. BESS DATA TABLE
    // =========================================

    function renderTable(searchTerm = "") {
        const tbody = $("bessTableBody");
        if (!tbody) return;

        const term = searchTerm.trim().toLowerCase();

        const filtered = parameters.filter(item =>
            [
                item.id,
                item.name,
                item.unit,
                item.equipment
            ].some(value => String(value).toLowerCase().includes(term))
        );

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-row">
                        No matching BESS parameters found.
                    </td>
                </tr>
            `;

            setText("tableCount", "Showing 0 parameters");
            return;
        }

        tbody.innerHTML = filtered.map(item => `
            <tr>
                <td class="tag-id">${item.id}</td>
                <td>${item.name}</td>
                <td>${formatNumber(item.value, 2)}</td>
                <td>${item.unit}</td>
                <td>${item.equipment}</td>
                <td><span class="status-pill">Available</span></td>
            </tr>
        `).join("");

        setText(
            "tableCount",
            `Showing ${filtered.length} of ${parameters.length} parameters`
        );
    }

    renderTable();

    const bessSearch = $("bessSearch");

    if (bessSearch) {
        bessSearch.addEventListener("input", () => {
            renderTable(bessSearch.value);
        });
    }

    // =========================================
    // 7. BESS POWER AND SOC TREND CHART
    // These are illustrative historical values.
    // =========================================

    const history = {
        "24h": {
            labels: [
                "00:00", "02:00", "04:00", "06:00",
                "08:00", "10:00", "12:00", "14:00",
                "16:00", "18:00", "20:00", "22:00"
            ],
            power: [
                -50, -40, 0, 0, 100, 200,
                250, 220, 180, 120, 50, 0
            ],
            soc: [65, 67, 70, 72, 76, 82, 88, 84, 80, 78, 76, 78]
        },

        "7d": {
            labels: ["Day 1", "Day 2", "Day 3", "Day 4",
                     "Day 5", "Day 6", "Today"],
            power: [120, -80, 180, 100, -50, 200, 250],
            soc: [55, 63, 58, 70, 75, 72, 78]
        },

        "30d": {
            labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
            power: [90, 130, -40, 160],
            soc: [60, 72, 68, 78]
        }
    };

    let bessChart = null;

    function renderBessChart() {
        const canvas = $("bessChart");
        if (!canvas || typeof Chart === "undefined") return;

        const period = $("periodSelect").value;
        const data = history[period];

        if (bessChart) {
            bessChart.destroy();
        }

        bessChart = new Chart(canvas, {
            type: "line",

            data: {
                labels: data.labels,

                datasets: [
                    {
                        label: "Active Power (kW)",
                        data: data.power,
                        yAxisID: "yPower",
                        borderColor: "#13d5ed",
                        backgroundColor: "rgba(19, 213, 237, 0.08)",
                        borderWidth: 2,
                        pointRadius: 3,
                        pointHoverRadius: 5,
                        tension: 0.3,
                        fill: false
                    },
                    {
                        label: "State of Charge (%)",
                        data: data.soc,
                        yAxisID: "ySoc",
                        borderColor: "#ff9d42",
                        backgroundColor: "rgba(255, 157, 66, 0.08)",
                        borderWidth: 2,
                        pointRadius: 3,
                        pointHoverRadius: 5,
                        tension: 0.3,
                        fill: false
                    }
                ]
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
                        display: false
                    },
                    tooltip: {
                        backgroundColor: "#06172d",
                        titleColor: "#edf6ff",
                        bodyColor: "#c8def4",
                        borderColor: "#164779",
                        borderWidth: 1
                    }
                },

                scales: {
                    x: {
                        grid: {
                            color: "rgba(80, 130, 180, 0.12)"
                        },
                        ticks: {
                            color: "#9db8d8",
                            maxTicksLimit: 8,
                            font: { size: 9 }
                        },
                        border: { display: false }
                    },

                    yPower: {
                        type: "linear",
                        position: "left",
                        grid: {
                            color: "rgba(80, 130, 180, 0.12)"
                        },
                        ticks: {
                            color: "#13d5ed",
                            font: { size: 9 }
                        },
                        title: {
                            display: true,
                            text: "Power (kW)",
                            color: "#13d5ed",
                            font: { size: 10 }
                        },
                        border: { display: false }
                    },

                    ySoc: {
                        type: "linear",
                        position: "right",
                        min: 0,
                        max: 100,
                        grid: {
                            drawOnChartArea: false
                        },
                        ticks: {
                            color: "#ff9d42",
                            font: { size: 9 }
                        },
                        title: {
                            display: true,
                            text: "SoC (%)",
                            color: "#ff9d42",
                            font: { size: 10 }
                        },
                        border: { display: false }
                    }
                }
            }
        });
    }

    if ($("periodSelect")) {
        $("periodSelect").addEventListener("change", renderBessChart);
    }

    renderBessChart();

    // =========================================
    // 8. REFRESH BUTTON
    // Refreshes the demo display only.
    // =========================================

    const refreshButton = $("refreshButton");

    if (refreshButton) {
        refreshButton.addEventListener("click", () => {
            updateBessCards();
            renderRackCards();
            renderTable(bessSearch ? bessSearch.value : "");
            renderBessChart();

            refreshButton.innerHTML =
                '<i class="fa-solid fa-check"></i> Refreshed';

            setTimeout(() => {
                refreshButton.innerHTML =
                    '<i class="fa-solid fa-rotate"></i> Refresh';
            }, 1200);
        });
    }

    // =========================================
    // 9. EXPORT BESS TABLE TO CSV
    // =========================================

    const exportButton = $("exportButton");

    if (exportButton) {
        exportButton.addEventListener("click", () => {
            const headers = [
                "Tag / ID",
                "Parameter",
                "Value",
                "Unit",
                "Equipment"
            ];

            const rows = parameters.map(item => [
                item.id,
                item.name,
                item.value,
                item.unit,
                item.equipment
            ]);

            function escapeCSV(value) {
                return `"${String(value).replace(/"/g, '""')}"`;
            }

            const csv = [headers, ...rows]
                .map(row => row.map(escapeCSV).join(","))
                .join("\r\n");

            const blob = new Blob(["\uFEFF" + csv], {
                type: "text/csv;charset=utf-8;"
            });

            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.download = "solar_ems_bess_data.csv";

            document.body.appendChild(link);
            link.click();
            link.remove();

            URL.revokeObjectURL(url);
        });
    }

    // =========================================
    // 10. PLANT SELECTION
    // The selection changes the page title only.
    // Separate plant data is not loaded yet.
    // =========================================

    if ($("plantSelect")) {
        $("plantSelect").addEventListener("change", event => {
            document.title =
                `Solar EMS | BESS Data | ${event.target.value}`;
        });
    }

    // =========================================
    // 11. SIDEBAR NAVIGATION
    // =========================================

    document.querySelectorAll(".nav-toggle").forEach(button => {
        button.addEventListener("click", () => {
            button.closest(".nav-group")?.classList.toggle("open");
        });
    });

    const sidebar = $("sidebar");
    const overlay = $("mobileOverlay");

    function closeMobileSidebar() {
        sidebar?.classList.remove("mobile-open");
        overlay?.classList.remove("visible");
    }

    if ($("menuButton")) {
        $("menuButton").addEventListener("click", () => {
            sidebar?.classList.add("mobile-open");
            overlay?.classList.add("visible");
        });
    }

    if ($("closeSidebar")) {
        $("closeSidebar").addEventListener("click", closeMobileSidebar);
    }

    if (overlay) {
        overlay.addEventListener("click", closeMobileSidebar);
    }

    // Keep Plant Monitoring expanded on this page.
    const activeLink = document.querySelector(
        '.submenu a[href="bess_data.html"]'
    );

    if (activeLink) {
        activeLink.closest(".nav-group")?.classList.add("open");
    }

    // Demo notification button.
    if ($("notificationButton")) {
        $("notificationButton").addEventListener("click", () => {
            alert("No active BESS notifications in demo mode.");
        });
    }
});