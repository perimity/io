/**
 * Webinar registrations for perimity.io/webinar/
 *
 * Setup (once, signed in to the Perimity Google account):
 * 1. Create a Google Sheet named "Webinar registrations".
 * 2. Extensions > Apps Script. Replace the code with this file. Save.
 * 3. Fill in JOIN_LINK below when the meeting link exists (leave "" until then).
 * 4. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone.
 * 5. Copy the Web App URL into ENDPOINT in webinar/webinar.js.
 * 6. Share the Sheet with Liv as Editor (Share button). No account access needed.
 */
const SHEET_NAME = "Registrations";
const JOIN_LINK = ""; // e.g. the Zoom or Teams link
const EVENT = "What verified MFA evidence looks like";
const WHEN = "Friday, January 22, 2027, 1:00-1:30 PM ET";

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents || "{}");
    const email = String(d.email || "").trim().toLowerCase();
    if (!email || d.website) return ContentService.createTextOutput("ignored");

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Registered (UTC)", "First", "Last", "Email", "Company", "Title", "Role", "Question", "Invited by", "Attended", "Notes"]);
    }
    // Skip duplicates by email.
    const existing = sheet.getLastRow() > 1 ? sheet.getRange(2, 4, sheet.getLastRow() - 1, 1).getValues().flat() : [];
    if (existing.includes(email)) return ContentService.createTextOutput("duplicate");

    const clean = (v) => String(v || "").replace(/^[=+\-@]/, "'").slice(0, 500); // stop spreadsheet formulas
    sheet.appendRow([new Date().toISOString(), clean(d.first), clean(d.last), email, clean(d.company),
      clean(d.title), clean(d.role), clean(d.question), clean(d.ref), "", ""]);

    const joinLine = JOIN_LINK ? "Join link: " + JOIN_LINK : "We'll email your join link the week before.";
    MailApp.sendEmail({
      to: email,
      replyTo: "cjacobs@perimity.io",
      name: "Perimity",
      subject: "You're registered: " + EVENT + " (Jan 22)",
      body: "Hi " + (d.first || "there") + ",\n\n"
        + "You're registered for " + EVENT + ".\n\n"
        + WHEN + "\n" + joinLine + "\n\n"
        + "Add it to your calendar: https://perimity.io/webinar/perimity-webinar-2027-01-22.ics\n\n"
        + "Questions before the session? Just reply to this email.\n\n"
        + "Cojo Jacobs\nFounder, Perimity\nperimity.io",
    });
    return ContentService.createTextOutput("ok");
  } finally {
    lock.releaseLock();
  }
}
