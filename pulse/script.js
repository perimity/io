// Pulse landing page — small, dependency-free interaction layer.
// Each concern is a standalone function so pieces can be added/removed independently.

(function () {
  "use strict";

  /** Keep the footer copyright year current without a build step. */
  function setFooterYear() {
    const el = document.getElementById("year");
    if (el) el.textContent = new Date().getFullYear();
  }

  /**
   * Fade + rise sections into view as they enter the viewport.
   * No-ops gracefully if IntersectionObserver isn't available.
   */
  function initScrollReveal() {
    const targets = document.querySelectorAll(
      ".modules, .pipeline, .audience, .cta-band"
    );
    if (!targets.length) return;

    targets.forEach((el) => el.classList.add("reveal"));

    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );

    targets.forEach((el) => observer.observe(el));
  }

  /**
   * Submit the "Join the waitlist" form to a Google Apps Script Web App,
   * which appends the email to a Google Sheet you own. Body is sent as a
   * plain string (not application/json) on purpose — that keeps the
   * request in the CORS "simple request" category so the browser doesn't
   * send a preflight OPTIONS request, which Apps Script Web Apps don't
   * handle. mode: "no-cors" means we can't read the response back (Google
   * doesn't send CORS headers on Apps Script responses), so we can't truly
   * confirm success client-side — we optimistically show a thank-you state
   * and rely on checking the Sheet directly to verify submissions arrive.
   */
  function initAccessForm() {
    const form = document.getElementById("access-form");
    if (!form) return;

    // Replace with the Web App URL from Deploy > New deployment in Apps Script.
    const SHEET_ENDPOINT = "https://script.google.com/macros/s/AKfycbxPaRBngzyd_WYvNpyAbi_6Jmj42ZfncwoY7aNBVPfZcnuPImHNv-TINB_L-6Do1G4AUA/exec";

    // Work email only: personal mailbox domains are turned away with a note.
    const PERSONAL_DOMAINS = new Set([
      "gmail.com", "googlemail.com", "yahoo.com", "ymail.com", "rocketmail.com",
      "hotmail.com", "outlook.com", "live.com", "msn.com", "icloud.com", "me.com",
      "mac.com", "aol.com", "proton.me", "protonmail.com", "pm.me", "gmx.com",
      "gmx.net", "mail.com", "yandex.com", "zoho.com", "hey.com", "fastmail.com",
      "tutanota.com", "comcast.net", "verizon.net", "att.net", "sbcglobal.net",
    ]);
    const emailInput = form.elements.email;
    const errorEl = document.createElement("p");
    errorEl.className = "cta-error";
    errorEl.id = "email-error";
    errorEl.setAttribute("role", "alert");
    errorEl.hidden = true;
    form.after(errorEl);
    emailInput.setAttribute("aria-describedby", "email-error");
    emailInput.addEventListener("input", () => {
      errorEl.hidden = true;
      emailInput.removeAttribute("aria-invalid");
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const email = emailInput.value.trim();
      const domain = email.split("@").pop().toLowerCase();
      if (PERSONAL_DOMAINS.has(domain) || /^(yahoo|hotmail|outlook|live)\./.test(domain)) {
        errorEl.textContent = "Please use your work email, the one at your company's domain.";
        errorEl.hidden = false;
        emailInput.setAttribute("aria-invalid", "true");
        emailInput.focus();
        return;
      }
      const submitBtn = form.querySelector("button[type=submit]");
      const originalLabel = submitBtn.textContent;

      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";

      fetch(SHEET_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ email }),
      })
        .catch((err) => {
          // no-cors means most failures are invisible to JS anyway; this
          // only catches network-level failures (e.g. offline).
          console.error("Pulse waitlist: submission failed", err);
        })
        .finally(() => {
          form.innerHTML = '<p class="cta-success">Thanks. We\'ll reach out to set up a walkthrough.</p>';
        });
    });
  }


  /**
   * Applicant request form (underwriters and MGAs). Posts to the same
   * Apps Script endpoint as the walkthrough form, tagged type "applicant_request".
   * The Apps Script must store the extra fields (name, company, applicant,
   * applicantContact, notes); otherwise only the email is kept.
   */
  function initRequestForm() {
    const form = document.getElementById("request-form");
    if (!form) return;
    const SHEET_ENDPOINT = "https://script.google.com/macros/s/AKfycbxPaRBngzyd_WYvNpyAbi_6Jmj42ZfncwoY7aNBVPfZcnuPImHNv-TINB_L-6Do1G4AUA/exec";

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const f = form.elements;
      const payload = {
        type: "applicant_request",
        name: f.name.value.trim(),
        email: f.email.value.trim(),
        company: f.company.value.trim(),
        applicant: f.applicant.value.trim(),
        applicantContact: f.applicantContact.value.trim(),
        notes: f.notes.value.trim(),
      };
      const btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      btn.textContent = "Sending…";

      fetch(SHEET_ENDPOINT, { method: "POST", mode: "no-cors", body: JSON.stringify(payload) })
        .catch((err) => console.error("Pulse applicant request: submission failed", err))
        .finally(() => {
          form.innerHTML = '<p class="request-success">Thanks. We\'ll contact ' + (payload.applicant ? payload.applicant.replace(/[<>&"]/g, "") : "the applicant") + ' and send you the report when it\'s ready.</p>';
        });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    setFooterYear();
    initScrollReveal();
    initAccessForm();
    initRequestForm();
  });
})();
