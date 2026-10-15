
document.addEventListener("DOMContentLoaded", () => {
    // -----------------------------------------
    // 1. SAMPLE WEATHER SENSOR DATA
    // Replace these demo values with API data
    // when connecting your actual weather station.
    // -----------------------------------------

    const weatherData = {
        temperature: 32.5,
        irradiance: 785,
        humidity: 64,
        windSpeed: 12.4,
        moduleTemp: 41.8,
        windDirection: "225° SW",
        rainfall: 0.0,
        pressure: 1012
    };

    const sensors = [
        {
            id: "WS-001",
            parameter: "Ambient Temperature",
            value: weatherData.temperature,
            unit: "°C",
            location: "Weather Station 01",
            status: "Online"
        },
        {
            id: "WS-002",
            parameter: "Solar Irradiance",
            value: weatherData.irradiance,
            unit: "W/m²",
            location: "POA Sensor",
            status: "Online"
        },
        {
            id: "WS-003",
            parameter: "Relative Humidity",
            value: weatherData.humidity,
            unit: "%",
            location: "Weather Station 01",
            status: "Online"
        },
        {
            id: "WS-004",
            parameter: "Wind Speed",
            value: weatherData.windSpeed,
            unit: "km/h",
            location: "Anemometer",
            status: "Online"
        },
        {
            id: "WS-005",
            parameter: "Module Temperature",
            value: weatherData.moduleTemp,
            unit: "°C",
            location: "PV Module",
            status: "Online"
        },
        {
            id: "WS-006",
            parameter: "Wind Direction",
            value: 225,
            unit: "degrees",
            location: "Wind Vane",
            status: "Online"
        },
        {
            id: "WS-007",
            parameter: "Rainfall",
            value: weatherData.rainfall,
            unit: "mm",
            location: "Rain Gauge",
            status: "Online"
        },
        {
            id: "WS-008",
            parameter: "Atmospheric Pressure",
            value: weatherData.pressure,
            unit: "hPa",
            location: "Weather Station 01",
            status: "Online"
        }
    ];

    // -----------------------------------------
    // 2. DOM HELPER
    // -----------------------------------------

    const $ = (id) => document.getElementById(id);

    function setText(id, value) {
        const element = $(id);
        if (element) element.textContent = value;
    }

    // -----------------------------------------
    // 3. DATE AND TIME
    // -----------------------------------------

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

    // -----------------------------------------
    // 4. UPDATE WEATHER SUMMARY
    // -----------------------------------------

    function updateWeatherCards() {
        setText("temperatureValue", weatherData.temperature.toFixed(1));
        setText("irradianceValue", weatherData.irradiance);
        setText("humidityValue", weatherData.humidity);
        setText("windSpeedValue", weatherData.windSpeed.toFixed(1));

        setText("moduleTempValue", `${weatherData.moduleTemp.toFixed(1)} °C`);
        setText("windDirectionValue", weatherData.windDirection);
        setText("rainfallValue", `${weatherData.rainfall.toFixed(1)} mm`);
        setText("pressureValue", `${weatherData.pressure} hPa`);

        setText("conditionTemperature", `${weatherData.temperature.toFixed(1)}°C`);
        setText("conditionHumidity", `${weatherData.humidity}%`);
        setText("conditionWind", `${weatherData.windSpeed.toFixed(1)} km/h`);
        setText("conditionIrradiance", `${weatherData.irradiance} W/m²`);
        setText("conditionModuleTemp", `${weatherData.moduleTemp.toFixed(1)}°C`);

        setText(
            "lastUpdated",
            new Date().toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true
            })
        );
    }

    updateWeatherCards();

    // -----------------------------------------
    // 5. SENSOR TABLE
    // -----------------------------------------

    function renderSensorTable(searchTerm = "") {
        const tbody = $("sensorTableBody");
        if (!tbody) return;

        const term = searchTerm.trim().toLowerCase();

        const filteredSensors = sensors.filter(sensor => {
            return [
                sensor.id,
                sensor.parameter,
                sensor.unit,
                sensor.location,
                sensor.status
            ].some(value => String(value).toLowerCase().includes(term));
        });

        if (filteredSensors.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-row">
                        No matching weather sensors found.
                    </td>
                </tr>
            `;
            setText("tableCount", "Showing 0 sensors");
            return;
        }

        tbody.innerHTML = filteredSensors.map(sensor => {
            const value = Number(sensor.value).toLocaleString("en-IN", {
                maximumFractionDigits: 1
            });

            return `
                <tr>
                    <td class="sensor-id">${sensor.id}</td>
                    <td>${sensor.parameter}</td>
                    <td>${value}</td>
                    <td>${sensor.unit}</td>
                    <td>${sensor.location}</td>
                    <td class="sensor-updated">--</td>
                    <td><span class="status-pill">${sensor.status}</span></td>
                </tr>
            `;
        }).join("");

        setText(
            "tableCount",
            `Showing ${filteredSensors.length} of ${sensors.length} sensors`
        );

        tbody.querySelectorAll(".sensor-updated").forEach(cell => {
            cell.textContent = new Date().toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true
            });
        });
    }

    renderSensorTable();

    const sensorSearch = $("sensorSearch");

    if (sensorSearch) {
        sensorSearch.addEventListener("input", () => {
            renderSensorTable(sensorSearch.value);
        });
    }

    // -----------------------------------------
    // 6. WEATHER TREND CHART
    // Chart data below is illustrative history,
    // not measured historical weather data.
    // -----------------------------------------

    const chartParameters = {
        irradiance: {
            label: "Solar Irradiance",
            unit: "W/m²",
            color: "#13d5ed",
            values: [
                0, 0, 0, 0, 0, 35, 110, 245,
                410, 590, 720, 810, 850, 785,
                690, 540, 350, 180, 55, 0, 0, 0, 0, 0
            ]
        },

        temperature: {
            label: "Ambient Temperature",
            unit: "°C",
            color: "#ff9d42",
            values: [
                25, 24.5, 24, 23.8, 24, 24.5,
                25.5, 27, 29, 31, 32, 33,
                33.5, 32.5, 32, 31, 30, 29,
                28, 27, 26.5, 26, 25.5, 25
            ]
        },

        humidity: {
            label: "Relative Humidity",
            unit: "%",
            color: "#13d5ed",
            values: [
                82, 84, 85, 86, 84, 82,
                78, 73, 69, 65, 62, 60,
                58, 60, 62, 65, 68, 71,
                74, 77, 79, 81, 82, 83
            ]
        },

        windSpeed: {
            label: "Wind Speed",
            unit: "km/h",
            color: "#b29aff",
            values: [
                7, 8, 7.5, 6, 6.5, 8,
                9, 10, 11, 12, 13, 14,
                12, 12.4, 13, 12, 11, 10,
                9, 8, 8.5, 7, 7.5, 8
            ]
        },

        moduleTemp: {
            label: "Module Temperature",
            unit: "°C",
            color: "#ff9d42",
            values: [
                26, 25, 24.5, 24, 24.5, 25,
                27, 30, 34, 37, 40, 43,
                45, 44, 42, 39, 36, 33,
                31, 29, 28, 27, 26, 26
            ]
        }
    };

    const chartLabels = Array.from({ length: 24 }, (_, index) => {
        return `${String(index).padStart(2, "0")}:00`;
    });

    let weatherChart = null;

    function buildChartData(parameterKey, period) {
        const parameter = chartParameters[parameterKey];
        const values = parameter.values;

        if (period === "7d") {
            const dailyFactors = [0.82, 0.91, 0.88, 0.96, 1.03, 0.94, 1.00];
            const labels = ["Day 1", "Day 2", "Day 3", "Day 4",
                            "Day 5", "Day 6", "Today"];

            return {
                labels,
                values: dailyFactors.map(factor => {
                    const average = values.reduce((sum, value) => sum + value, 0)
                        / values.length;
                    return Math.round(average * factor * 10) / 10;
                })
            };
        }

        if (period === "30d") {
            const labels = ["1–5", "6–10", "11–15", "16–20", "21–25", "26–30"];
            const factors = [0.86, 0.93, 0.90, 1.02, 0.96, 1.00];
            const average = values.reduce((sum, value) => sum + value, 0)
                / values.length;

            return {
                labels,
                values: factors.map(factor =>
                    Math.round(average * factor * 10) / 10
                )
            };
        }

        return {
            labels: chartLabels,
            values
        };
    }

    function renderWeatherChart() {
        const canvas = $("weatherChart");
        if (!canvas || typeof Chart === "undefined") return;

        const parameterKey = $("parameterSelect").value;
        const period = $("periodSelect").value;
        const parameter = chartParameters[parameterKey];
        const data = buildChartData(parameterKey, period);

        setText(
            "chartLegend",
            ""
        );

        $("chartLegend").innerHTML = `
            <span>
                <i class="legend-dot" style="background:${parameter.color}"></i>
                ${parameter.label} (${parameter.unit})
            </span>
        `;

        if (weatherChart) {
            weatherChart.destroy();
        }

        weatherChart = new Chart(canvas, {
            type: "line",
            data: {
                labels: data.labels,
                datasets: [{
                    label: `${parameter.label} (${parameter.unit})`,
                    data: data.values,
                    borderColor: parameter.color,
                    backgroundColor: `${parameter.color}20`,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.35,
                    pointRadius: period === "24h" ? 2 : 4,
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
                        display: false
                    },
                    tooltip: {
                        backgroundColor: "#06172d",
                        titleColor: "#edf6ff",
                        bodyColor: "#c8def4",
                        borderColor: "#164779",
                        borderWidth: 1,
                        callbacks: {
                            label: context =>
                                `${context.dataset.label}: ${context.parsed.y} ${parameter.unit}`
                        }
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
                    y: {
                        beginAtZero: parameterKey === "irradiance"
                            || parameterKey === "humidity"
                            || parameterKey === "windSpeed",
                        grid: {
                            color: "rgba(80, 130, 180, 0.12)"
                        },
                        ticks: {
                            color: "#9db8d8",
                            font: { size: 9 }
                        },
                        border: { display: false },
                        title: {
                            display: true,
                            text: parameter.unit,
                            color: "#9db8d8",
                            font: { size: 10 }
                        }
                    }
                }
            }
        });
    }

    if ($("parameterSelect")) {
        $("parameterSelect").addEventListener("change", renderWeatherChart);
    }

    if ($("periodSelect")) {
        $("periodSelect").addEventListener("change", renderWeatherChart);
    }

    renderWeatherChart();

    // -----------------------------------------
    // 7. 24-HOUR ILLUSTRATIVE FORECAST
    // -----------------------------------------

    const forecastItems = [
        { time: "Now",   icon: "fa-sun",          temp: 32, condition: "Sunny",        irradiance: 785 },
        { time: "14:00", icon: "fa-cloud-sun",    temp: 33, condition: "Partly cloudy", irradiance: 720 },
        { time: "16:00", icon: "fa-cloud-sun",    temp: 31, condition: "Partly cloudy", irradiance: 450 },
        { time: "18:00", icon: "fa-cloud",        temp: 29, condition: "Cloudy",       irradiance: 120 },
        { time: "21:00", icon: "fa-moon",         temp: 27, condition: "Night",        irradiance: 0 },
        { time: "Tomorrow", icon: "fa-sun",       temp: 31, condition: "Sunny",        irradiance: 760 }
    ];

    function renderForecast() {
        const grid = $("forecastGrid");
        if (!grid) return;

        grid.innerHTML = forecastItems.map(item => `
            <div class="forecast-item">
                <span class="forecast-time">${item.time}</span>
                <i class="fa-solid ${item.icon} forecast-icon"></i>
                <span class="forecast-temp">${item.temp}°C</span>
                <span class="forecast-condition">${item.condition}</span>
                <span class="forecast-irradiance">
                    <i class="fa-solid fa-sun"></i>
                    ${item.irradiance} W/m²
                </span>
            </div>
        `).join("");
    }

    renderForecast();

    // -----------------------------------------
    // 8. REFRESH BUTTON
    // This refreshes the demo display only.
    // It does not retrieve new sensor readings.
    // -----------------------------------------

    const refreshButton = $("refreshButton");

    if (refreshButton) {
        refreshButton.addEventListener("click", () => {
            updateWeatherCards();
            renderSensorTable(sensorSearch ? sensorSearch.value : "");
            renderWeatherChart();

            refreshButton.innerHTML =
                '<i class="fa-solid fa-check"></i> Refreshed';

            setTimeout(() => {
                refreshButton.innerHTML =
                    '<i class="fa-solid fa-rotate"></i> Refresh';
            }, 1200);
        });
    }

    // -----------------------------------------
    // 9. EXPORT SENSOR TABLE TO CSV
    // -----------------------------------------

    const exportButton = $("exportButton");

    if (exportButton) {
        exportButton.addEventListener("click", () => {
            const headers = [
                "Sensor ID",
                "Parameter",
                "Measured Value",
                "Unit",
                "Sensor Location",
                "Status"
            ];

            const rows = sensors.map(sensor => [
                sensor.id,
                sensor.parameter,
                sensor.value,
                sensor.unit,
                sensor.location,
                sensor.status
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
            link.download = "solar_ems_weather_data.csv";
            document.body.appendChild(link);
            link.click();
            link.remove();

            URL.revokeObjectURL(url);
        });
    }

    // -----------------------------------------
    // 10. PLANT SELECTION
    // Selection changes the displayed plant name,
    // but does not load separate plant readings.
    // -----------------------------------------

    const plantSelect = $("plantSelect");

    if (plantSelect) {
        plantSelect.addEventListener("change", () => {
            const selectedPlant = plantSelect.value;
            document.title = `Solar EMS | Weather Data | ${selectedPlant}`;
        });
    }

    // -----------------------------------------
    // 11. SIDEBAR SUBMENU
    // -----------------------------------------

    document.querySelectorAll(".nav-toggle").forEach(button => {
        button.addEventListener("click", () => {
            button.closest(".nav-group").classList.toggle("open");
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

    // Open the Plant Monitoring submenu on this page.
    const activeLink = document.querySelector(
        '.submenu a[href="weather_data.html"]'
    );

    if (activeLink) {
        activeLink.closest(".nav-group")?.classList.add("open");
    }

    // Notification button demonstration.
    if ($("notificationButton")) {
        $("notificationButton").addEventListener("click", () => {
            alert("No new weather station notifications in demo mode.");
        });
    }
});
