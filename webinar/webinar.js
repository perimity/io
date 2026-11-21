(() => {
  // Paste the Web App URL from Apps Script (Deploy > New deployment) here.
  const ENDPOINT = "PASTE_APPS_SCRIPT_URL_HERE";

  // Keep in sync with pulse/script.js and Pulse (src/lib/personal-domains.ts).
  const PERSONAL_DOMAINS = new Set([
    "gmail.com", "googlemail.com", "yahoo.com", "ymail.com", "rocketmail.com",
    "hotmail.com", "outlook.com", "live.com", "msn.com", "icloud.com", "me.com",
    "mac.com", "aol.com", "proton.me", "protonmail.com", "pm.me", "gmx.com",
    "gmx.net", "mail.com", "yandex.com", "zoho.com", "hey.com", "fastmail.com",
    "tutanota.com", "comcast.net", "verizon.net", "att.net", "sbcglobal.net",
  ]);

  const GCAL = "https://calendar.google.com/calendar/render?action=TEMPLATE"
    + "&text=" + encodeURIComponent("Perimity webinar: What verified MFA evidence looks like")
    + "&dates=20270122T180000Z/20270122T183000Z"
    + "&details=" + encodeURIComponent("Join link is emailed to registrants. Details: https://perimity.io/webinar/");

  const form = document.getElementById("reg-form");
  if (!form) return;
  const err = document.getElementById("email-err");
  // ?ref=cojo or ?ref=liv on outreach links records who invited the registrant.
  const ref = new URLSearchParams(location.search).get("ref") || "";

  function fail(input, message) {
    err.textContent = message;
    err.hidden = false;
    if (input) { input.setAttribute("aria-invalid", "true"); input.focus(); }
  }

  form.addEventListener("input", (e) => {
    err.hidden = true;
    e.target.removeAttribute("aria-invalid");
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const f = form.elements;
    if (f.website.value) return; // a bot filled the hidden field

    for (const name of ["first", "last", "email", "company", "title", "role"]) {
      if (!f[name].value.trim()) return fail(f[name], "Please fill in every field above the question box.");
    }
    const email = f.email.value.trim();
    const domain = email.split("@").pop().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(f.email, "Please check your email address.");
    if (PERSONAL_DOMAINS.has(domain) || /^(yahoo|hotmail|outlook|live)\./.test(domain)) {
      return fail(f.email, "Please use your work email, the one at your company's domain.");
    }
    if (ENDPOINT.startsWith("PASTE_")) {
      return fail(null, "Registration isn't open yet. Please email cjacobs@perimity.io to save your seat.");
    }

    const btn = form.querySelector("button");
    btn.disabled = true;
    btn.textContent = "Registering…";

    const payload = {
      first: f.first.value.trim(), last: f.last.value.trim(), email,
      company: f.company.value.trim(), title: f.title.value.trim(),
      role: f.role.value, question: f.question.value.trim(), ref,
      updates: f.updates.checked ? "yes" : "no",
    };

    fetch(ENDPOINT, { method: "POST", mode: "no-cors", body: JSON.stringify(payload) })
      .catch((e) => console.error("Webinar registration failed", e))
      .finally(() => {
        document.getElementById("reg-area").innerHTML =
          '<div class="done" role="status"><h3>You\'re registered.</h3>'
          + '<p>We\'ll email the join link to ' + email.replace(/[<>&"]/g, "") + ', with reminders before the session.</p>'
          + '<div class="cal"><a href="' + GCAL + '" target="_blank" rel="noopener">Add to Google Calendar</a>'
          + '<a href="perimity-webinar-2027-01-22.ics" download>Add to Outlook or Apple Calendar</a></div></div>';
      });
  });
})();
