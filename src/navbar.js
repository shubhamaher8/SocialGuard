// navbar.js
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("navbar.html");
    const html = await response.text();
    document.getElementById("navbar").innerHTML = html;

    // Highlight active tab based on current page
    const currentPage = location.pathname.split("/").pop();

    document.querySelectorAll(".nav-btn").forEach((btn) => {
      const link = btn.getAttribute("data-tab") || btn.getAttribute("href");

      if (link && currentPage.includes(link.replace(".html", ""))) {
        btn.classList.add("active");
      }
    });

    // If you are using data-tab switching in index.html
    document.querySelectorAll(".nav-btn[data-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tabId = btn.getAttribute("data-tab");

        // hide all sections
        document.querySelectorAll(".tab-content").forEach((sec) => {
          sec.classList.remove("active");
        });

        // show the selected one
        const target = document.getElementById(tabId);
        if (target) target.classList.add("active");

        // update active state
        document.querySelectorAll(".nav-btn").forEach((b) =>
          b.classList.remove("active")
        );
        btn.classList.add("active");
      });
    });
  } catch (err) {
    console.error("Failed to load navbar:", err);
  }
});
