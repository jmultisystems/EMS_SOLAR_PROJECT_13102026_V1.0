// Sidebar menu and expandable navigation
const sidebar = document.getElementById("sidebar");
document.getElementById("menuButton").addEventListener("click", () => {
  if (window.innerWidth <= 650) sidebar.classList.toggle("sidebar-visible");
  else sidebar.classList.toggle("sidebar-collapsed");
});

document.querySelectorAll(".nav-toggle").forEach(button => {
  button.addEventListener("click", () => {
    const group = button.closest(".nav-group");
    const isOpen = group.classList.toggle("open");
    button.setAttribute("aria-expanded", String(isOpen));
  });
});

// Highlight selected submenu item
document.querySelectorAll(".subnav-item").forEach(link => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".subnav-item").forEach(item => item.classList.remove("active-sub"));
    link.classList.add("active-sub");
    if (window.innerWidth <= 650) sidebar.classList.remove("sidebar-visible");
  });
});

// Panel / table switching
const tabs = document.querySelectorAll(".tab");
const panelView = document.getElementById("panelView");
const tableView = document.getElementById("tableView");
tabs.forEach(tab => tab.addEventListener("click", () => {
  tabs.forEach(item => item.classList.remove("active"));
  tab.classList.add("active");
  const showTable = tab.dataset.view === "table";
  panelView.hidden = showTable;
  tableView.hidden = !showTable;
}));

// Chart uses demonstration values. Replace these arrays with values from your EMS API.
const chartData = {
  power: { label: "Solar Power (kW)", values: [180, 720, 1700, 2850, 3650, 3950, 3800, 3100, 1950, 900, 180], unit: "kW" },
  irradiance: { label: "Irradiance (W/m²)", values: [70, 180, 350, 510, 650, 701, 690, 550, 360, 190, 60], unit: "W/m²" },
  temperature: { label: "Module Temperature (°C)", values: [23, 24, 26, 28, 30, 31.78, 33, 32, 30, 28, 26], unit: "°C" },
  generation: { label: "Energy Generation (kWh)", values: [120, 420, 780, 1250, 1800, 2350, 2900, 3450, 4100, 5000, 5879], unit: "kWh" }
};
const todayLabels = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
const ctx = document.getElementById("plantChart").getContext("2d");
const gradient = ctx.createLinearGradient(0, 0, 0, 280);
gradient.addColorStop(0, "rgba(0, 145, 255, 0.38)");
gradient.addColorStop(1, "rgba(0, 145, 255, 0.01)");

const plantChart = new Chart(ctx, {
  type: "line",
  data: { labels: todayLabels, datasets: [{
    label: chartData.power.label, data: chartData.power.values,
    borderColor: "#078cff", backgroundColor: gradient, fill: true,
    tension: 0.35, borderWidth: 2.5, pointRadius: 2.5,
    pointHoverRadius: 6, pointBackgroundColor: "#38baff",
    pointBorderColor: "#d8f5ff", pointBorderWidth: 1
  }]},
  options: {
    responsive: true, maintainAspectRatio: false,
    interaction: { intersect: false, mode: "index" },
    plugins: {
      legend: { display: true, position: "bottom", labels: { color: "#b8d3f1", usePointStyle: true, boxWidth: 8, padding: 18 } },
      tooltip: { backgroundColor: "#061a35", borderColor: "#218cff", borderWidth: 1, titleColor: "#fff", bodyColor: "#d9edff", padding: 12 }
    },
    scales: {
      x: { ticks: { color: "#aac5e5", font: { size: 10 } }, grid: { color: "rgba(116,164,209,.12)" }, title: { display: true, text: "Time", color: "#c7ddf5" } },
      y: { beginAtZero: true, ticks: { color: "#aac5e5" }, grid: { color: "rgba(116,164,209,.14)" }, title: { display: true, text: "Power (kW)", color: "#c7ddf5" } }
    }
  }
});

document.getElementById("graphMetric").addEventListener("change", event => {
  const selected = chartData[event.target.value];
  plantChart.data.datasets[0].label = selected.label;
  plantChart.data.datasets[0].data = selected.values;
  plantChart.options.scales.y.title.text = selected.unit;
  plantChart.update();
});

// Illustrative range selector: Week/Month/Year labels and values are sample display data.
const rangeData = {
  today: { labels: todayLabels, factor: 1 },
  week: { labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], factor: 0.92 },
  month: { labels: ["1", "5", "10", "15", "20", "25", "30"], factor: 0.88 },
  year: { labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], factor: 0.82 }
};
document.querySelectorAll(".range").forEach(button => button.addEventListener("click", () => {
  document.querySelectorAll(".range").forEach(item => item.classList.remove("active"));
  button.classList.add("active");
  const range = rangeData[button.dataset.range];
  const key = document.getElementById("graphMetric").value;
  const base = chartData[key].values;
  const values = range.labels.map((_, i) => {
    const source = base[Math.min(base.length - 1, Math.round(i * (base.length - 1) / Math.max(1, range.labels.length - 1)))];
    return Math.round(source * range.factor * (0.88 + ((i % 3) * 0.08)) * 100) / 100;
  });
  plantChart.data.labels = range.labels;
  plantChart.data.datasets[0].data = values;
  plantChart.update();
}));

// Table search
document.getElementById("tableSearch").addEventListener("input", event => {
  const query = event.target.value.toLowerCase();
  document.querySelectorAll("#plantTable tbody tr").forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(query) ? "" : "none";
  });
});

// Demo refresh timestamp. The dashboard values remain sample values until connected to a backend API.
function updateLogTime() {
  const now = new Date();
  document.getElementById("lastLog").textContent = now.toLocaleDateString("en-GB") + " " + now.toLocaleTimeString("en-GB", {hour:"2-digit", minute:"2-digit"});
}
setInterval(updateLogTime, 60000);

// Plant selector placeholder
document.getElementById("plantSelect").addEventListener("change", event => {
  console.log("Selected plant:", event.target.value, "- connect this to your plant API.");
});
