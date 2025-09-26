import { createClient } from "@supabase/supabase-js";

// 🔑 Replace with your Supabase project keys
const SUPABASE_URL = process.env.PARCEL_VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.PARCEL_VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let trendChart, cityChart, browserChart, hourChart, returningChart;

// --------------------
// Load Visitor Data
// --------------------
async function loadVisitorData() {
  const { data, error } = await supabase
    .from("visitor_logs")
    .select("*")
    .order("timestamp", { ascending: true });

  if (error) {
    console.error("Error loading data:", error);
    return;
  }

  if (!data || data.length === 0) {
    document.querySelector("#logsTable tbody").innerHTML =
      "<tr><td colspan='5'>No data available</td></tr>";
    return;
  }

  // --- Stats ---
  document.getElementById("totalVisitors").textContent = data.length;

  const uniqueIps = new Set(data.map(d => d.ip_address));
  document.getElementById("uniqueIps").textContent = uniqueIps.size;

  const topCity = mostFrequent(data.map(d => d.city));
  document.getElementById("topCity").textContent = topCity || "-";

  const topIsp = mostFrequent(data.map(d => d.isp));
  document.getElementById("topIsp").textContent = topIsp || "-";

  const topBrowser = mostFrequent(data.map(d => d.browser));
  document.getElementById("topBrowser").textContent = topBrowser || "-";

  // --- Trends (line chart by timestamp) ---
  const trendCounts = {};
  data.forEach(d => {
    const date = new Date(d.timestamp).toLocaleDateString();
    trendCounts[date] = (trendCounts[date] || 0) + 1;
  });

  trendChart = makeChart("trendChart", "line", {
    labels: Object.keys(trendCounts),
    datasets: [{
      label: "Visitors",
      data: Object.values(trendCounts),
      borderColor: "#007bff",
      fill: false
    }]
  });

  // --- City Pie ---
  const cityCounts = countValues(data.map(d => d.city));
  cityChart = makeChart("cityChart", "pie", {
    labels: Object.keys(cityCounts),
    datasets: [{
      data: Object.values(cityCounts),
      backgroundColor: randomColors(Object.keys(cityCounts).length)
    }]
  });

  // --- Browser Bar ---
  const browserCounts = countValues(data.map(d => d.browser));
  browserChart = makeChart("browserChart", "bar", {
    labels: Object.keys(browserCounts),
    datasets: [{
      label: "Visitors",
      data: Object.values(browserCounts),
      backgroundColor: "#4CAF50"
    }]
  });

  // --- Logs Table ---
  const tbody = document.querySelector("#logsTable tbody");
  tbody.innerHTML = "";
  data.slice(-100).reverse().forEach(d => {
    const row = `
      <tr>
        <td>${d.ip_address || "-"}</td>
        <td>${d.city || "-"}</td>
        <td>${d.isp || "-"}</td>
        <td>${d.browser || "-"}</td>
        <td>${new Date(d.timestamp).toLocaleString()}</td>
      </tr>`;
    tbody.insertAdjacentHTML("beforeend", row);
  });
}

// --------------------
// PDF Generation
// --------------------
async function generatePDF() {
  if (!window.jspdf) {
    alert("jsPDF not loaded. Please include jspdf.umd.min.js");
    return;
  }
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "pt", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 40;
  let y = 40;

  // Cover / Title
  pdf.setFontSize(20);
  pdf.text("SocialGuard Analytics Report", margin, y);
  y += 28;
  pdf.setFontSize(11);
  pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
  y += 20;
  pdf.setDrawColor(200);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 16;

  // Summary explanations
  const summaryLines = [
    `Total Visitors (${document.getElementById("totalVisitors").textContent}): Total number of visits recorded.`,
    `Unique IPs (${document.getElementById("uniqueIps").textContent}): Distinct IP addresses seen.`,
    `Top City (${document.getElementById("topCity").textContent}): City with most visits.`,
    `Top ISP (${document.getElementById("topIsp").textContent}): Most common ISP among visitors.`,
    `Top Browser (${document.getElementById("topBrowser").textContent}): Most-used browser by visitors.`,
    "",
    "Charts explain trends, geographic distribution, device/browser breakdown and time-of-day patterns.",
    "Suspicious IPs highlight addresses with frequent activity or very rapid repeated hits.",
    ""
  ];
  pdf.setFontSize(12);
  const split = pdf.splitTextToSize(summaryLines.join("\n"), pageWidth - margin * 2);
  pdf.text(split, margin, y);
  y += split.length * 14 + 10;

  // Helper for images
  function addImageWithPageBreak(imgData, imgWidthPx, imgHeightPx) {
    const displayWidth = pageWidth - margin * 2;
    const displayHeight = (imgHeightPx * displayWidth) / imgWidthPx;
    if (y + displayHeight > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
    pdf.addImage(imgData, "PNG", margin, y, displayWidth, displayHeight);
    y += displayHeight + 12;
  }

  // Charts
  try {
    const charts = [
      { chart: trendChart, title: "Visitor Trends" },
      { chart: cityChart, title: "Visitors by City" },
      { chart: browserChart, title: "Browsers" },
      { chart: hourChart, title: "Visits by Hour" },
      { chart: returningChart, title: "New vs Returning" }
    ];

    for (const c of charts) {
      pdf.setFontSize(14);
      if (y > pageHeight - margin - 60) { pdf.addPage(); y = margin; }
      pdf.text(c.title, margin, y);
      y += 14;

      if (c.chart) {
        const imgData = c.chart.toBase64Image();
        const canvasEl = c.chart.canvas;
        const iw = canvasEl.width || 800;
        const ih = canvasEl.height || 400;
        addImageWithPageBreak(imgData, iw, ih);
      } else {
        const canvasEl = document.getElementById(
          c.chart?.canvas?.id || (c.title.replace(/\s+/g, "") + "Chart")
        );
        if (canvasEl) {
          const imgData = canvasEl.toDataURL("image/png");
          addImageWithPageBreak(imgData, canvasEl.width, canvasEl.height);
        }
      }
    }
  } catch (err) {
    console.warn("Error adding charts to PDF:", err);
  }

  // Suspicious IPs
  if (y > pageHeight - margin - 80) { pdf.addPage(); y = margin; }
  pdf.setFontSize(14);
  pdf.text("Suspicious IPs", margin, y);
  y += 16;
  const suspList = Array.from(document.querySelectorAll("#suspiciousIps li")).map(li => li.textContent || li.innerText);
  if (suspList.length === 0) {
    pdf.setFontSize(11);
    pdf.text("None", margin, y);
    y += 14;
  } else {
    pdf.setFontSize(11);
    const suspText = pdf.splitTextToSize(suspList.join("\n"), pageWidth - margin * 2);
    pdf.text(suspText, margin, y);
    y += suspText.length * 12 + 8;
  }

  // Logs table (via html2canvas)
  const logsEl = document.getElementById("logsTable");
  if (logsEl) {
    if (y > pageHeight - margin - 120) { pdf.addPage(); y = margin; }
    pdf.setFontSize(14);
    pdf.text("Visitor Logs (latest entries)", margin, y);
    y += 16;

    try {
      const canvas = await html2canvas(logsEl, { scale: 1.4 });
      const imgData = canvas.toDataURL("image/png");
      addImageWithPageBreak(imgData, canvas.width, canvas.height);
    } catch (err) {
      console.warn("html2canvas failed for logs table:", err);
      pdf.setFontSize(11);
      pdf.text("Could not render logs table image.", margin, y);
      y += 14;
    }
  }

  // Save
  pdf.save(`analytics-report-${new Date().toISOString().slice(0,10)}.pdf`);
}

// --------------------
// Button Binding
// --------------------
function attachReportButton() {
  const btn = document.getElementById("downloadReport");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.textContent = "Generating report…";
    try {
      await generatePDF();
    } catch (err) {
      console.error("Failed to generate PDF", err);
      alert("Report generation failed. Check console for details.");
    } finally {
      btn.disabled = false;
      btn.textContent = "📄 Download Report";
    }
  });
}

// --------------------
// Helpers
// --------------------
function mostFrequent(arr) {
  const counts = countValues(arr);
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
}

function countValues(arr) {
  return arr.reduce((acc, val) => {
    if (!val) return acc;
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
}

function makeChart(canvasId, type, data) {
  const ctx = document.getElementById(canvasId).getContext("2d");
  return new Chart(ctx, { type, data });
}

function randomColors(n) {
  return Array.from({ length: n }, () =>
    `hsl(${Math.floor(Math.random() * 360)},70%,60%)`
  );
}

// --------------------
// Init
// --------------------
document.addEventListener("DOMContentLoaded", async () => {
  await loadVisitorData();
  attachReportButton();
});
