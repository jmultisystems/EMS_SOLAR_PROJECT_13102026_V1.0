
// ==========================================
// JOVE EMS - DASHBOARD JAVASCRIPT
// ==========================================


// SIDEBAR MENU AND EXPANDABLE NAVIGATION

const sidebar = document.getElementById("sidebar");
const menuButton = document.getElementById("menuButton");

if (sidebar && menuButton) {
    menuButton.addEventListener("click", () => {
        if (window.innerWidth <= 650) {
            sidebar.classList.toggle("sidebar-visible");
        } else {
            sidebar.classList.toggle("sidebar-collapsed");
        }
    });
}


// NAVIGATION GROUPS

document.querySelectorAll(".nav-toggle").forEach(button => {
    button.addEventListener("click", () => {
        const group = button.closest(".nav-group");

        if (!group) return;

        const isOpen = group.classList.toggle("open");
        button.setAttribute("aria-expanded", String(isOpen));
    });
});


// HIGHLIGHT SELECTED SUBMENU ITEM

document.querySelectorAll(".subnav-item").forEach(link => {
    link.addEventListener("click", () => {

        document.querySelectorAll(".subnav-item").forEach(item => {
            item.classList.remove("active-sub");
        });

        link.classList.add("active-sub");

        if (window.innerWidth <= 650 && sidebar) {
            sidebar.classList.remove("sidebar-visible");
        }
    });
});


// PANEL / TABLE SWITCHING

const tabs = document.querySelectorAll(".tab");
const panelView = document.getElementById("panelView");
const tableView = document.getElementById("tableView");

tabs.forEach(tab => {
    tab.addEventListener("click", () => {

        tabs.forEach(item => item.classList.remove("active"));
        tab.classList.add("active");

        const showTable = tab.dataset.view === "table";

        if (panelView) panelView.hidden = showTable;
        if (tableView) tableView.hidden = !showTable;
    });
});


// CHART DEMONSTRATION DATA
// Replace these values with live EMS API data when available.

const chartData = {
    power: {
        label: "Solar Power (kW)",
        values: [180, 720, 1700, 2850, 3650, 3950, 3800, 3100, 1950, 900, 180],
        unit: "kW"
    },

    irradiance: {
        label: "Irradiance (W/m²)",
        values: [70, 180, 350, 510, 650, 701, 690, 550, 360, 190, 60],
        unit: "W/m²"
    },

    temperature: {
        label: "Module Temperature (°C)",
        values: [23, 24, 26, 28, 30, 31.78, 33, 32, 30, 28, 26],
        unit: "°C"
    },

    generation: {
        label: "Energy Generation (kWh)",
        values: [120, 420, 780, 1250, 1800, 2350, 2900, 3450, 4100, 5000, 5879],
        unit: "kWh"
    }
};

const todayLabels = [
    "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
];


// INITIALIZE CHART

const chartCanvas = document.getElementById("plantChart");
let plantChart = null;

if (chartCanvas && typeof Chart !== "undefined") {

    const ctx = chartCanvas.getContext("2d");

    const gradient = ctx.createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, "rgba(0, 145, 255, 0.38)");
    gradient.addColorStop(1, "rgba(0, 145, 255, 0.01)");

    plantChart = new Chart(ctx, {
        type: "line",

        data: {
            labels: todayLabels,

            datasets: [{
                label: chartData.power.label,
                data: chartData.power.values,
                borderColor: "#078cff",
                backgroundColor: gradient,
                fill: true,
                tension: 0.35,
                borderWidth: 2.5,
                pointRadius: 2.5,
                pointHoverRadius: 6,
                pointBackgroundColor: "#38baff",
                pointBorderColor: "#d8f5ff",
                pointBorderWidth: 1
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
                    display: true,
                    position: "bottom",
                    labels: {
                        color: "#b8d3f1",
                        usePointStyle: true,
                        boxWidth: 8,
                        padding: 18
                    }
                },

                tooltip: {
                    backgroundColor: "#061a35",
                    borderColor: "#218cff",
                    borderWidth: 1,
                    titleColor: "#fff",
                    bodyColor: "#d9edff",
                    padding: 12
                }
            },

            scales: {
                x: {
                    ticks: {
                        color: "#aac5e5",
                        font: { size: 10 }
                    },
                    grid: {
                        color: "rgba(116,164,209,.12)"
                    },
                    title: {
                        display: true,
                        text: "Time",
                        color: "#c7ddf5"
                    }
                },

                y: {
                    beginAtZero: true,
                    ticks: {
                        color: "#aac5e5"
                    },
                    grid: {
                        color: "rgba(116,164,209,.14)"
                    },
                    title: {
                        display: true,
                        text: "Power (kW)",
                        color: "#c7ddf5"
                    }
                }
            }
        }
    });
}


// GRAPH METRIC SELECTOR

const graphMetric = document.getElementById("graphMetric");

if (graphMetric) {
    graphMetric.addEventListener("change", event => {

        if (!plantChart) return;

        const selected = chartData[event.target.value];

        if (!selected) return;

        plantChart.data.datasets[0].label = selected.label;
        plantChart.data.datasets[0].data = selected.values;
        plantChart.options.scales.y.title.text = selected.unit;

        plantChart.update();
    });
}


// RANGE SELECTOR

const rangeData = {
    today: {
        labels: todayLabels,
        factor: 1
    },

    week: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        factor: 0.92
    },

    month: {
        labels: ["1", "5", "10", "15", "20", "25", "30"],
        factor: 0.88
    },

    year: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                 "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        factor: 0.82
    }
};

document.querySelectorAll(".range").forEach(button => {

    button.addEventListener("click", () => {

        if (!plantChart || !graphMetric) return;

        document.querySelectorAll(".range").forEach(item => {
            item.classList.remove("active");
        });

        button.classList.add("active");

        const range = rangeData[button.dataset.range];

        if (!range) return;

        const key = graphMetric.value;
        const base = chartData[key].values;

        const values = range.labels.map((_, i) => {

            const source = base[
                Math.min(
                    base.length - 1,
                    Math.round(
                        i * (base.length - 1) /
                        Math.max(1, range.labels.length - 1)
                    )
                )
            ];

            return Math.round(
                source * range.factor *
                (0.88 + ((i % 3) * 0.08)) * 100
            ) / 100;
        });

        plantChart.data.labels = range.labels;
        plantChart.data.datasets[0].data = values;

        plantChart.update();
    });
});


// TABLE SEARCH

const tableSearch = document.getElementById("tableSearch");

if (tableSearch) {
    tableSearch.addEventListener("input", event => {

        const query = event.target.value.toLowerCase();

        document.querySelectorAll("#plantTable tbody tr").forEach(row => {
            row.style.display = row.textContent.toLowerCase().includes(query)
                ? ""
                : "none";
        });
    });
}


// LAST UPDATED TIME

function updateLogTime() {

    const lastLog = document.getElementById("lastLog");

    if (!lastLog) return;

    const now = new Date();

    lastLog.textContent =
        now.toLocaleDateString("en-GB") + " " +
        now.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit"
        });
}

updateLogTime();
setInterval(updateLogTime, 60000);


// PLANT SELECTOR

const plantSelect = document.getElementById("plantSelect");

if (plantSelect) {
    plantSelect.addEventListener("change", event => {
        console.log(
            "Selected plant:",
            event.target.value,
            "- Connect this to your plant API."
        );
    });
}


// ==========================================
// USER PROFILE AND AUTHENTICATION
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const profileButton = document.getElementById("profileDropdownBtn");
    const profileDropdown = document.getElementById("profileDropdown");
    const logoutButton = document.getElementById("profileLogoutBtn");

    const token = localStorage.getItem("access_token");

    // Redirect to login if there is no access token.
    if (!token) {
        window.location.replace("/login");
        return;
    }

    const profileElements = {
        initial: document.getElementById("profileInitial"),
        name: document.getElementById("profileUserName"),
        role: document.getElementById("profileUserRole"),

        largeInitial: document.getElementById("profileInitialLarge"),
        dropdownName: document.getElementById("profileDropdownName"),
        email: document.getElementById("profileDropdownEmail"),

        userId: document.getElementById("profileUserId"),
        fullName: document.getElementById("profileFullName"),
        company: document.getElementById("profileCompany"),
        detailEmail: document.getElementById("profileEmail"),
        detailRole: document.getElementById("profileRole"),
        status: document.getElementById("profileStatus")
    };


    // DISPLAY USER DETAILS

    function displayUserProfile(user) {

        const fullName = user.full_name || "EMS User";
        const email = user.email || "Not available";
        const company = user.company_name || "Not provided";
        const role = user.role || "operator";
        const userId = user.id ?? "Not available";

        const initial = fullName.trim().charAt(0).toUpperCase() || "U";

        if (profileElements.initial)
            profileElements.initial.textContent = initial;

        if (profileElements.largeInitial)
            profileElements.largeInitial.textContent = initial;

        if (profileElements.name)
            profileElements.name.textContent = fullName;

        if (profileElements.role)
            profileElements.role.textContent = role;

        if (profileElements.dropdownName)
            profileElements.dropdownName.textContent = fullName;

        if (profileElements.email)
            profileElements.email.textContent = email;

        if (profileElements.userId)
            profileElements.userId.textContent = userId;

        if (profileElements.fullName)
            profileElements.fullName.textContent = fullName;

        if (profileElements.company)
            profileElements.company.textContent = company;

        if (profileElements.detailEmail)
            profileElements.detailEmail.textContent = email;

        if (profileElements.detailRole)
            profileElements.detailRole.textContent = role;

        if (profileElements.status) {

            const isActive = user.is_active !== false;

            profileElements.status.textContent =
                isActive ? "Active" : "Inactive";

            profileElements.status.style.color =
                isActive ? "#00d7a0" : "#ff8c9b";
        }
    }


    // FETCH USER PROFILE FROM FLASK API

    async function loadUserProfile() {

        try {

            const response = await fetch("/api/me", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {

                if (
                    response.status === 401 ||
                    response.status === 422 ||
                    response.status === 403
                ) {
                    localStorage.removeItem("access_token");
                    window.location.replace("/login");
                    return;
                }

                throw new Error(
                    data.message ||
                    data.error ||
                    "Unable to load user profile."
                );
            }

            if (!data.user) {
                throw new Error("User information was not returned by the server.");
            }

            displayUserProfile(data.user);

        } catch (error) {

            console.error("Profile loading error:", error);

            if (profileElements.name) {
                profileElements.name.textContent = "Profile unavailable";
            }

            if (profileElements.role) {
                profileElements.role.textContent = "Please refresh";
            }
        }
    }


    // PROFILE ICON CLICK: OPEN / CLOSE DROPDOWN

    if (profileButton && profileDropdown) {

        profileButton.addEventListener("click", event => {

            event.stopPropagation();

            const isOpen = profileDropdown.classList.toggle("show");

            profileButton.setAttribute(
                "aria-expanded",
                String(isOpen)
            );
        });


        // Close dropdown when clicking outside.

        document.addEventListener("click", event => {

            if (
                !profileDropdown.contains(event.target) &&
                !profileButton.contains(event.target)
            ) {

                profileDropdown.classList.remove("show");

                profileButton.setAttribute(
                    "aria-expanded",
                    "false"
                );
            }
        });


        // Close dropdown using Escape key.

        document.addEventListener("keydown", event => {

            if (event.key === "Escape") {

                profileDropdown.classList.remove("show");

                profileButton.setAttribute(
                    "aria-expanded",
                    "false"
                );
            }
        });
    }


    // LOGOUT

    if (logoutButton) {

        logoutButton.addEventListener("click", () => {

            const confirmed = window.confirm(
                "Are you sure you want to logout from Jove EMS?"
            );

            if (!confirmed) return;

            localStorage.removeItem("access_token");

            window.location.replace("/login");
        });
    }


    // LOAD PROFILE WHEN DASHBOARD OPENS

    loadUserProfile();

});
