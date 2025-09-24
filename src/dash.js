// ==============================
// Supabase Setup
// ==============================
const SUPABASE_URL = process.env.PARCEL_VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.PARCEL_VITE_SUPABASE_ANON_KEY;
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ==============================
// Utility Funct ions
// ==============================
function groupByMonth(deliveries) {
  const grouped = {};
  deliveries.forEach(d => {
    const date = new Date(d.sent_at);
    const month = date.toLocaleString("default", { month: "short" });
    if (!grouped[month]) grouped[month] = { opened: 0, clicked: 0, reported: 0 };
    if (d.opened) grouped[month].opened++;
    if (d.clicked) grouped[month].clicked++;
    if (d.reported) grouped[month].reported++;
  });
  return grouped;
}

function animateValue(id, start, end, duration) {
  let range = end - start,
    current = start,
    increment = range / (duration / 20);
  const obj = document.getElementById(id);
  if (!obj) return;
  const timer = setInterval(() => {
    current += increment;
    if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
      current = end;
      clearInterval(timer);
    }
    obj.textContent = Math.floor(current);
  }, 20);
}

// ==============================
// Main Class
// ==============================
class SocialEngSimulator {
  constructor() {
    this.supabase = supabase;

    // Delivery charts
    this.improvementChart = null;
    this.departmentChart = null;
    this.deviceChart = null;
    this.funnelChart = null;
    this.heatmapChart = null;
    this.comparativeChart = null;
    this.deliveryChart = null;

    // Visitor charts
    this.visitorTrendChart = null;
    this.visitorCountryChart = null;
    this.visitorDeviceChart = null;
  }

  async init() {
    await this.populateCampaignFilter();
    await this.updateDashboardMetrics();
    await this.updateDeliveryMetrics();
    await this.updateVisitorMetrics();
  }

  // --------------------------
  // Deliveries
  // --------------------------
  async fetchDeliveries() {
    const { data, error } = await this.supabase.from("deliveries").select("*");
    if (error) console.error(error);
    return data || [];
  }

  async updateDeliveryMetrics() {
    const deliveries = await this.fetchDeliveries();
    if (!deliveries.length) return;

    const total = deliveries.length;
    const opened = deliveries.filter(d => d.opened).length;
    const clicked = deliveries.filter(d => d.clicked).length;
    const submitted = deliveries.filter(d => d.credential_submitted).length;

    document.getElementById("stat-sent").textContent = total;
    document.getElementById("stat-opened").textContent = opened;
    document.getElementById("stat-clicked").textContent = clicked;
     document.getElementById("stat-creds").textContent = submitted;
  }

  // --------------------------
  // Visitor Logs
  // --------------------------
  parseUserAgent(ua) {
    let device = /Mobi|Android/i.test(ua) ? "Mobile" : "Desktop";
    let browser = /Chrome/i.test(ua)
      ? "Chrome"
      : /Firefox/i.test(ua)
      ? "Firefox"
      : /Safari/i.test(ua)
      ? "Safari"
      : /Edg/i.test(ua)
      ? "Edge"
      : "Other";
    let os = /Windows/i.test(ua)
      ? "Windows"
      : /Mac/i.test(ua)
      ? "MacOS"
      : /Android/i.test(ua)
      ? "Android"
      : /iPhone|iPad/i.test(ua)
      ? "iOS"
      : "Other";
    return { device, browser, os };
  }

  async updateVisitorMetrics() {
    const { data: logs, error } = await this.supabase.from("visitor_logs").select("*");
    if (error) {
      console.error("Error fetching visitor logs:", error);
      return;
    }
    if (!logs || !logs.length) {
      document.getElementById("stat-visitors").textContent = 0;
      document.getElementById("stat-ips").textContent = 0;
      document.getElementById("stat-browser").textContent = "N/A";
      return;
    }

    // KPIs
    document.getElementById("stat-visitors").textContent = logs.length;
    document.getElementById("stat-ips").textContent = new Set(
      logs.map(l => l.ip_address)
    ).size;
    

    // Top Browser
    const browserCounts = {};
    logs.forEach(l => {
      const { browser } = this.parseUserAgent(l.user_agent || "");
      browserCounts[browser] = (browserCounts[browser] || 0) + 1;
    });
    const topBrowser = Object.entries(browserCounts).sort((a, b) => b[1] - a[1])[0];
    document.getElementById("stat-browser").textContent = topBrowser
      ? topBrowser[0]
      : "N/A";

    // Build visitor charts
    const processed = logs.map(l => ({
      ts: new Date(l.timestamp),
      country: l.country || "Unknown",
      ...this.parseUserAgent(l.user_agent || "")
    }));
    this.setupVisitorCharts(processed);
  }

  setupVisitorCharts(logs) {
    // Trend by day
    const daily = {};
    logs.forEach(l => {
      const day = l.ts.toISOString().split("T")[0];
      daily[day] = (daily[day] || 0) + 1;
    });
    const labels = Object.keys(daily).sort();
    const values = labels.map(l => daily[l]);

    if (this.visitorTrendChart) this.visitorTrendChart.destroy();
    this.visitorTrendChart = new Chart(
      document.getElementById("visitorTrendChart"),
      {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Visits",
              data: values,
              borderColor: "#1FB8CD",
              fill: false,
              tension: 0.3
            }
          ]
        }
      }
    );

    // Country distribution
    const countryCounts = {};
    logs.forEach(l => {
      countryCounts[l.country] = (countryCounts[l.country] || 0) + 1;
    });
    if (this.visitorCountryChart) this.visitorCountryChart.destroy();
    this.visitorCountryChart = new Chart(
      document.getElementById("visitorCountryChart"),
      {
        type: "pie",
        data: {
          labels: Object.keys(countryCounts),
          datasets: [
            {
              data: Object.values(countryCounts),
              backgroundColor: [
                "#1FB8CD",
                "#FFC185",
                "#FF6B6B",
                "#9F7AEA",
                "#34D399"
              ]
            }
          ]
        }
      }
    );

    // Device/Browser breakdown
    const deviceCounts = {};
    logs.forEach(l => {
      const key = `${l.device} - ${l.browser}`;
      deviceCounts[key] = (deviceCounts[key] || 0) + 1;
    });
    if (this.visitorDeviceChart) this.visitorDeviceChart.destroy();
    this.visitorDeviceChart = new Chart(
      document.getElementById("visitorDeviceChart"),
      {
        type: "bar",
        data: {
          labels: Object.keys(deviceCounts),
          datasets: [
            {
              data: Object.values(deviceCounts),
              backgroundColor: "#FF6B6B"
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { title: { display: true, text: "Device/Browser Breakdown" } },
          scales: { y: { beginAtZero: true } }
        }
      }
    );
  }

  // --------------------------
  // Campaigns + Deliveries Dashboard
  // --------------------------
  async populateCampaignFilter() {
    const { data: campaigns } = await this.supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    const filter = document.getElementById("campaignFilter");
    filter.innerHTML = `<option value="all">All Campaigns</option>`;
    campaigns.forEach(
      c => (filter.innerHTML += `<option value="${c.id}">${c.name}</option>`)
    );
  }

  async fetchStats() {
    const { data: campaigns } = await this.supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    const { data: deliveries } = await this.supabase
      .from("deliveries")
      .select("*");
    return { campaigns: campaigns || [], deliveries: deliveries || [] };
  }

  applyFilters(deliveries) {
    const campaignId = document.getElementById("campaignFilter").value;
    const timeVal = document.getElementById("timeFilter").value;
    const now = new Date();
    let filtered = deliveries;
    if (campaignId !== "all")
      filtered = filtered.filter(d => d.campaign_id === campaignId);
    if (timeVal !== "all")
      filtered = filtered.filter(
        d =>
          new Date(d.sent_at) >=
          new Date(now - timeVal * 24 * 60 * 60 * 1000)
      );
    return filtered;
  }

  async updateDashboardMetrics() {
    const { campaigns, deliveries } = await this.fetchStats();
    const filteredDeliveries = this.applyFilters(deliveries);

    // Delivery stats
    document.getElementById("stat-sent").textContent = filteredDeliveries.length;
    document.getElementById("stat-opened").textContent = filteredDeliveries.filter(
      d => d.opened
    ).length;
    document.getElementById("stat-clicked").textContent = filteredDeliveries.filter(
      d => d.clicked
    ).length;
    document.getElementById("stat-creds").textContent = filteredDeliveries.filter(
      d => d.credential_submitted
    ).length;
    document.getElementById("stat-reported").textContent = filteredDeliveries.filter(
      d => d.reported
    ).length;

    // Campaign table
    const tbody = document.getElementById("campaigns-body");
    tbody.innerHTML = "";
    const campaignStats = campaigns
      .map(c => {
        const cDel = filteredDeliveries.filter(d => d.campaign_id === c.id);
        const clickedPct = cDel.length
          ? Math.round((cDel.filter(d => d.clicked).length / cDel.length) * 100)
          : 0;
        const reportedPct = cDel.length
          ? Math.round((cDel.filter(d => d.reported).length / cDel.length) * 100)
          : 0;
        return { ...c, clickedPct, alert: clickedPct > 20 && reportedPct < 5 };
      })
      .sort((a, b) => b.clickedPct - a.clickedPct);

    campaignStats.forEach(c => {
      tbody.innerHTML += `<tr>
        <td>${c.name}</td><td>${c.type}</td>
        <td>${new Date(c.start_at).toLocaleDateString()}</td>
        <td>${new Date(c.end_at).toLocaleDateString()}</td>
        <td>${c.clickedPct}%</td>
        <td>${c.alert ? '<span class="alert">⚠ High Risk</span>' : ""}</td>
      </tr>`;
    });

    await this.setupCharts(filteredDeliveries);
  }

  // --------------------------
  // Charts for Deliveries
  // --------------------------
  async setupCharts(filteredDeliveries) {
    // Monthly Trends
    const monthly = groupByMonth(filteredDeliveries);
    const labels = Object.keys(monthly);
    const opened = labels.map(m => monthly[m].opened);
    const clicked = labels.map(m => monthly[m].clicked);
    const reported = labels.map(m => monthly[m].reported);
    const ctx1 = document.getElementById("improvementChart").getContext("2d");
    if (this.improvementChart) this.improvementChart.destroy();
    this.improvementChart = new Chart(ctx1, {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "Opened", data: opened, borderColor: "#1FB8CD", fill: false, tension: 0.3 },
          { label: "Clicked", data: clicked, borderColor: "#FFC185", fill: false, tension: 0.3 },
          { label: "Reported", data: reported, borderColor: "#FF6B6B", fill: false, tension: 0.3 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { title: { display: true, text: "Monthly Engagement Trends" } }
      }
    });

    // Conversion Funnel
    const funnelData = [
      filteredDeliveries.length,
      filteredDeliveries.filter(d => d.opened).length,
      filteredDeliveries.filter(d => d.clicked).length,
      filteredDeliveries.filter(d => d.credential_submitted).length,
      filteredDeliveries.filter(d => d.reported).length
    ];
    const ctxFunnel = document.getElementById("funnelChart").getContext("2d");
    if (this.funnelChart) this.funnelChart.destroy();
    this.funnelChart = new Chart(ctxFunnel, {
      type: "bar",
      data: {
        labels: ["Sent", "Opened", "Clicked", "Creds Submitted", "Reported"],
        datasets: [
          {
            data: funnelData,
            backgroundColor: ["#1FB8CD", "#FFC185", "#FF6B6B", "#9F7AEA", "#34D399"]
          }
        ]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: { title: { display: true, text: "Conversion Funnel" } },
        scales: { x: { beginAtZero: true } }
      }
    });

    // Heatmap by hour
    const heatmapHours = Array(24).fill(0);
    filteredDeliveries.forEach(d => {
      const hour = new Date(d.sent_at).getHours();
      if (d.clicked) heatmapHours[hour]++;
    });
    const ctxHeat = document.getElementById("heatmapChart").getContext("2d");
    if (this.heatmapChart) this.heatmapChart.destroy();
    this.heatmapChart = new Chart(ctxHeat, {
      type: "bar",
      data: {
        labels: [...Array(24).keys()].map(h => `${h}:00`),
        datasets: [{ label: "Clicks", data: heatmapHours, backgroundColor: "#FF6B6B" }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { title: { display: true, text: "Click Engagement by Hour" } },
        scales: { y: { beginAtZero: true } }
      }
    });

    // Department Analytics
    const deptData = {};
    filteredDeliveries.forEach(d => {
      if (!deptData[d.department]) deptData[d.department] = { opened: 0, clicked: 0, reported: 0 };
      if (d.opened) deptData[d.department].opened++;
      if (d.clicked) deptData[d.department].clicked++;
      if (d.reported) deptData[d.department].reported++;
    });
    const deptLabels = Object.keys(deptData);
    const deptOpened = deptLabels.map(l => deptData[l].opened);
    const deptClicked = deptLabels.map(l => deptData[l].clicked);
    const deptReported = deptLabels.map(l => deptData[l].reported);
    const ctxDept = document.getElementById("departmentChart").getContext("2d");
    if (this.departmentChart) this.departmentChart.destroy();
    this.departmentChart = new Chart(ctxDept, {
      type: "bar",
      data: {
        labels: deptLabels,
        datasets: [
          { label: "Opened", data: deptOpened, backgroundColor: "#1FB8CD" },
          { label: "Clicked", data: deptClicked, backgroundColor: "#FFC185" },
          { label: "Reported", data: deptReported, backgroundColor: "#FF6B6B" }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { title: { display: true, text: "Department Analytics" } },
        scales: { y: { beginAtZero: true } }
      }
    });

   
    // Comparative Radar
    const ctxComp = document.getElementById("comparativeChart").getContext("2d");
    if (this.comparativeChart) this.comparativeChart.destroy();
    this.comparativeChart = new Chart(ctxComp, {
      type: "radar",
      data: {
        labels: deptLabels,
        datasets: [
          {
            label: "Opened",
            data: deptOpened,
            backgroundColor: "rgba(31,184,205,0.2)",
            borderColor: "#1FB8CD",
            fill: true
          },
          {
            label: "Clicked",
            data: deptClicked,
            backgroundColor: "rgba(255,193,133,0.2)",
            borderColor: "#FFC185",
            fill: true
          },
          {
            label: "Reported",
            data: deptReported,
            backgroundColor: "rgba(255,107,107,0.2)",
            borderColor: "#FF6B6B",
            fill: true
          }
        ]
      },
      options: { plugins: { title: { display: true, text: "Comparative Analysis" } } }
    });
  }
}

// ==============================
// Init on DOM Ready
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  window.simulator = new SocialEngSimulator();
  simulator.init();

  // Mode Toggle
  document.getElementById("modeHistorical").onclick = () => {
    document.getElementById("historicalSection").style.display = "block";
    document.getElementById("realtimeSection").style.display = "none";
  };
  document.getElementById("modeRealtime").onclick = () => {
    document.getElementById("historicalSection").style.display = "none";
    document.getElementById("realtimeSection").style.display = "block";
  };
});
