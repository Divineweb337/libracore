const RESEND_API_URL = "https://api.resend.com/emails";

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  response.end(JSON.stringify(payload));
}

module.exports = async function handler(request, response) {
  if (request.method === "OPTIONS") {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    sendJson(response, 500, { error: "Email service is not configured" });
    return;
  }

  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);

  let body;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch (error) {
    sendJson(response, 400, { error: "Invalid request body" });
    return;
  }

  const { to, toName, subject, message, bookTitle, dueDate } = body;
  if (!to || !subject || !message) {
    sendJson(response, 400, { error: "Recipient email, subject, and message are required" });
    return;
  }

  const from = process.env.FROM_EMAIL || "LibraCore Library <onboarding@resend.dev>";
  const safeName = toName || "Library Member";
  const html = `
    <div style="font-family: Arial, sans-serif; color: #17202a; line-height: 1.6;">
      <h2 style="color: #0f766e;">Library Book Reminder</h2>
      <p>Dear ${escapeHtml(safeName)},</p>
      <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
      <div style="margin: 18px 0; padding: 14px; border: 1px solid #dfe5eb; border-radius: 8px; background: #f7faf9;">
        <strong>Book:</strong> ${escapeHtml(bookTitle || "Borrowed book")}<br>
        <strong>Due Date:</strong> ${escapeHtml(dueDate || "Not specified")}
      </div>
      <p>Please return the book promptly to avoid violating the library rule.</p>
      <p>Thank you.<br>Library Administrator</p>
    </div>
  `;

  const resendResponse = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      text: message
    })
  });

  const result = await resendResponse.json().catch(() => ({}));
  if (!resendResponse.ok) {
    sendJson(response, resendResponse.status, { error: result.message || "Email could not be sent" });
    return;
  }

  sendJson(response, 200, { ok: true, id: result.id });
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}
