const today = new Date();
const dateToInput = (date) => date.toISOString().slice(0, 10);
const addDays = (days) => {
  const date = new Date(today);
  date.setDate(date.getDate() + days);
  return dateToInput(date);
};

let books = JSON.parse(localStorage.getItem("libraryBooks")) || [
  { id: 1, title: "Introduction to Computer Science", author: "David Reed", category: "Computer Science", isbn: "978-0132305262", copies: 6, borrowed: 2 },
  { id: 2, title: "Database System Concepts", author: "Abraham Silberschatz", category: "Information Technology", isbn: "978-0073523323", copies: 5, borrowed: 1 },
  { id: 3, title: "Research Methodology", author: "C. R. Kothari", category: "Research", isbn: "978-8122415223", copies: 4, borrowed: 0 },
  { id: 4, title: "Digital Libraries", author: "William Arms", category: "Library Science", isbn: "978-0262510699", copies: 3, borrowed: 1 },
  { id: 5, title: "Web Design with HTML and CSS", author: "Jon Duckett", category: "Web Development", isbn: "978-1118008188", copies: 7, borrowed: 2 }
];

let members = JSON.parse(localStorage.getItem("libraryMembers")) || [
  { id: 1, name: "Amaka Johnson", memberId: "LIB/2026/001", department: "Computer Science", email: "amaka@example.com" },
  { id: 2, name: "Chinedu Okafor", memberId: "LIB/2026/002", department: "Mass Communication", email: "chinedu@example.com" },
  { id: 3, name: "Aisha Bello", memberId: "LIB/2026/003", department: "Education", email: "aisha@example.com" }
];

let loans = JSON.parse(localStorage.getItem("libraryLoans")) || [
  { id: 1, bookId: 1, memberId: 1, issueDate: addDays(-8), dueDate: addDays(6), returned: false },
  { id: 2, bookId: 4, memberId: 2, issueDate: addDays(-20), dueDate: addDays(-5), returned: false },
  { id: 3, bookId: 2, memberId: 3, issueDate: addDays(-12), dueDate: addDays(2), returned: true },
  { id: 4, bookId: 5, memberId: 1, issueDate: addDays(-3), dueDate: addDays(11), returned: false }
];

const pageTitle = document.getElementById("page-title");
const searchInput = document.getElementById("globalSearch");
const toast = document.getElementById("toast");
const loginScreen = document.getElementById("loginScreen");
const appShell = document.querySelector(".app-shell");
const adminUser = { username: "admin", password: "admin123" };
const emailService = {
  publicKey: "",
  serviceId: "",
  templateId: ""
};
const reminderLeadDays = 2;

let reminderLog = JSON.parse(localStorage.getItem("libraryReminderLog")) || {};

if (sessionStorage.getItem("libraryAdminLoggedIn") !== "true") {
  appShell.classList.add("locked");
} else {
  loginScreen.classList.add("hidden");
}

document.getElementById("loginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  if (data.username.trim() === adminUser.username && data.password === adminUser.password) {
    sessionStorage.setItem("libraryAdminLoggedIn", "true");
    loginScreen.classList.add("hidden");
    appShell.classList.remove("locked");
    showToast("Admin login successful");
    runAutomaticReminderCheck();
    return;
  }
  showToast("Invalid admin username or password");
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem("libraryAdminLoggedIn");
  appShell.classList.add("locked");
  loginScreen.classList.remove("hidden");
  showToast("Logged out successfully");
});

document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showPage(link.dataset.page);
  });
});

document.getElementById("openBorrow").addEventListener("click", () => showPage("borrow"));
document.getElementById("printReport").addEventListener("click", () => window.print());
document.getElementById("sendAllReminders").addEventListener("click", sendAllDueReminders);

document.getElementById("bookForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  books.push({
    id: Date.now(),
    title: data.title.trim(),
    author: data.author.trim(),
    category: data.category.trim(),
    isbn: data.isbn.trim(),
    copies: Number(data.copies),
    borrowed: 0
  });
  event.target.reset();
  event.target.copies.value = 1;
  saveAndRender("Book added successfully");
});

document.getElementById("memberForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  const requestedMemberId = normalizeMemberId(data.memberId);
  const duplicateMember = members.some((member) => normalizeMemberId(member.memberId) === requestedMemberId);

  if (duplicateMember) {
    showToast("This Library ID is already registered");
    event.target.memberId.focus();
    return;
  }

  members.push({
    id: Date.now(),
    name: data.name.trim(),
    memberId: requestedMemberId,
    department: data.department.trim(),
    email: data.email.trim()
  });
  event.target.reset();
  saveAndRender("Member registered successfully");
});

document.getElementById("loanForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  const book = books.find((item) => item.id === Number(data.bookId));
  if (!book || availableCopies(book) < 1) {
    showToast("Selected book is not available");
    return;
  }
  book.borrowed += 1;
  loans.unshift({
    id: Date.now(),
    bookId: Number(data.bookId),
    memberId: Number(data.memberId),
    issueDate: data.issueDate,
    dueDate: data.dueDate,
    returned: false
  });
  event.target.reset();
  setDefaultDates();
  saveAndRender("Book issued successfully");
});

searchInput.addEventListener("input", renderTables);

function showPage(pageId) {
  document.querySelectorAll(".page").forEach((page) => page.classList.toggle("active", page.id === pageId));
  document.querySelectorAll(".nav-link").forEach((link) => link.classList.toggle("active", link.dataset.page === pageId));
  pageTitle.textContent = document.querySelector(`[data-page="${pageId}"] span`).textContent;
  window.location.hash = pageId;
}

function saveAndRender(message) {
  localStorage.setItem("libraryBooks", JSON.stringify(books));
  localStorage.setItem("libraryMembers", JSON.stringify(members));
  localStorage.setItem("libraryLoans", JSON.stringify(loans));
  localStorage.setItem("libraryReminderLog", JSON.stringify(reminderLog));
  renderAll();
  showToast(message);
}

function renderAll() {
  renderStats();
  renderTables();
  renderSelects();
  renderCategories();
  renderReports();
  renderReminders();
}

function renderStats() {
  document.getElementById("totalBooks").textContent = books.reduce((sum, book) => sum + book.copies, 0);
  document.getElementById("totalMembers").textContent = members.length;
  document.getElementById("borrowedBooks").textContent = loans.filter((loan) => !loan.returned).length;
  document.getElementById("overdueBooks").textContent = loans.filter((loan) => getLoanStatus(loan) === "overdue").length;
}

function renderTables() {
  const term = searchInput.value.trim().toLowerCase();
  const filteredBooks = books.filter((book) => Object.values(book).join(" ").toLowerCase().includes(term));
  const filteredMembers = members.filter((member) => Object.values(member).join(" ").toLowerCase().includes(term));
  const filteredLoans = loans.filter((loan) => {
    const book = findBook(loan.bookId);
    const member = findMember(loan.memberId);
    return `${book?.title || ""} ${member?.name || ""} ${loan.issueDate} ${loan.dueDate}`.toLowerCase().includes(term);
  });

  document.getElementById("booksTable").innerHTML = filteredBooks.map((book) => `
    <tr>
      <td>${escapeHtml(book.title)}</td>
      <td>${escapeHtml(book.author)}</td>
      <td>${escapeHtml(book.category)}</td>
      <td>${escapeHtml(book.isbn)}</td>
      <td><span class="badge available">${availableCopies(book)} of ${book.copies}</span></td>
    </tr>
  `).join("");

  document.getElementById("membersTable").innerHTML = filteredMembers.map((member) => `
    <tr>
      <td>${escapeHtml(member.name)}</td>
      <td>${escapeHtml(member.memberId)}</td>
      <td>${escapeHtml(member.department)}</td>
      <td>${escapeHtml(member.email)}</td>
    </tr>
  `).join("");

  const loanRows = filteredLoans.map((loan) => loanRow(loan, true)).join("");
  document.getElementById("loansTable").innerHTML = loanRows || emptyRow("No borrowing records found", 6);
  document.getElementById("recentLoans").innerHTML = loans.slice(0, 5).map((loan) => loanRow(loan, false)).join("");
}

function loanRow(loan, showAction) {
  const book = findBook(loan.bookId);
  const member = findMember(loan.memberId);
  const status = getLoanStatus(loan);
  return `
    <tr>
      <td>${escapeHtml(book?.title || "Unknown book")}</td>
      <td>${escapeHtml(member?.name || "Unknown member")}</td>
      <td>${loan.issueDate}</td>
      <td>${loan.dueDate}</td>
      <td><span class="badge ${status}">${statusLabel(status)}</span></td>
      ${showAction ? `<td>${loan.returned ? "Completed" : `<button class="action-btn" onclick="returnBook(${loan.id})">Return</button> <button class="action-btn" onclick="sendLoanReminder(${loan.id})">Email</button>`}</td>` : ""}
    </tr>
  `;
}

function renderSelects() {
  const bookSelect = document.getElementById("bookSelect");
  const memberSelect = document.getElementById("memberSelect");
  bookSelect.innerHTML = books
    .filter((book) => availableCopies(book) > 0)
    .map((book) => `<option value="${book.id}">${escapeHtml(book.title)} (${availableCopies(book)} available)</option>`)
    .join("");
  memberSelect.innerHTML = members
    .map((member) => `<option value="${member.id}">${escapeHtml(member.name)} - ${escapeHtml(member.memberId)}</option>`)
    .join("");
}

function renderCategories() {
  const counts = books.reduce((acc, book) => {
    acc[book.category] = (acc[book.category] || 0) + book.copies;
    return acc;
  }, {});
  const highest = Math.max(...Object.values(counts));
  document.getElementById("categoryList").innerHTML = Object.entries(counts).map(([category, count]) => `
    <div class="category-row">
      <strong>${escapeHtml(category)}</strong>
      <span>${count}</span>
      <div class="meter"><span style="width: ${(count / highest) * 100}%"></span></div>
    </div>
  `).join("");
}

function renderReports() {
  const counts = books.reduce((acc, book) => {
    acc[book.category] = (acc[book.category] || 0) + book.copies;
    return acc;
  }, {});
  const popular = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
  document.getElementById("popularCategory").textContent = popular;
  document.getElementById("availableCopies").textContent = books.reduce((sum, book) => sum + availableCopies(book), 0);
  document.getElementById("returnedBooks").textContent = loans.filter((loan) => loan.returned).length;
}

function renderReminders() {
  const reminders = getReminderCandidates();
  const configStatus = document.getElementById("emailConfigStatus");
  const remindersTable = document.getElementById("remindersTable");

  configStatus.innerHTML = isEmailConfigured()
    ? `<span class="badge available">Automatic email is active</span><p>The system can send reminder emails directly to registered members.</p>`
    : `<span class="badge available">Reminder system ready</span><p>The system detects due and overdue books, then prepares the reminder email for the registered member.</p>`;

  remindersTable.innerHTML = reminders.map(({ loan, book, member, reminderType }) => {
    const sentText = reminderLog[getReminderKey(loan)] ? "Sent today" : statusLabel(reminderType);
    return `
      <tr>
        <td>${escapeHtml(member.name)}</td>
        <td>${escapeHtml(member.email)}</td>
        <td>${escapeHtml(book.title)}</td>
        <td>${loan.dueDate}</td>
        <td><span class="badge ${reminderType === "overdue" ? "overdue" : "borrowed"}">${sentText}</span></td>
        <td><button class="action-btn" onclick="sendLoanReminder(${loan.id})">Send Email</button></td>
      </tr>
    `;
  }).join("") || emptyRow("No books are due within two days or overdue", 6);
}

function getReminderCandidates() {
  return loans
    .filter((loan) => !loan.returned)
    .map((loan) => {
      const book = findBook(loan.bookId);
      const member = findMember(loan.memberId);
      const daysUntilDue = getDaysUntilDue(loan);
      const reminderType = daysUntilDue < 0 ? "overdue" : "dueSoon";
      return { loan, book, member, daysUntilDue, reminderType };
    })
    .filter(({ book, member, daysUntilDue }) => book && member && member.email && daysUntilDue <= reminderLeadDays);
}

function runAutomaticReminderCheck() {
  if (!isEmailConfigured()) {
    renderReminders();
    return;
  }

  const dueReminders = getReminderCandidates().filter(({ loan }) => !reminderLog[getReminderKey(loan)]);
  if (!dueReminders.length) return;
  Promise.allSettled(dueReminders.map(({ loan }) => sendLoanReminder(loan.id, true)));
}

async function sendAllDueReminders() {
  const dueReminders = getReminderCandidates();
  if (!dueReminders.length) {
    showToast("No due or overdue reminders to send");
    return;
  }

  const results = await Promise.allSettled(dueReminders.map(({ loan }) => sendLoanReminder(loan.id, true)));
  const sent = results.filter((result) => result.status === "fulfilled" && result.value).length;
  showToast(`${sent} reminder email${sent === 1 ? "" : "s"} processed`);
  renderReminders();
}

async function sendLoanReminder(loanId, silent = false) {
  const loan = loans.find((item) => item.id === loanId);
  const book = loan ? findBook(loan.bookId) : null;
  const member = loan ? findMember(loan.memberId) : null;

  if (!loan || !book || !member) {
    if (!silent) showToast("Reminder record could not be found");
    return false;
  }

  const reminder = buildReminderMessage(loan, book, member);

  if (!isEmailConfigured()) {
    openPreparedEmail(member.email, reminder.subject, reminder.body);
    if (!silent) showToast("Reminder email prepared");
    return false;
  }

  try {
    initializeEmailService();
    await emailjs.send(emailService.serviceId, emailService.templateId, {
      to_email: member.email,
      to_name: member.name,
      book_title: book.title,
      due_date: loan.dueDate,
      reminder_message: reminder.body
    });
    reminderLog[getReminderKey(loan)] = new Date().toISOString();
    localStorage.setItem("libraryReminderLog", JSON.stringify(reminderLog));
    if (!silent) showToast("Reminder email sent successfully");
    renderReminders();
    return true;
  } catch (error) {
    console.error(error);
    openPreparedEmail(member.email, reminder.subject, reminder.body);
    if (!silent) showToast("Reminder email prepared");
    return false;
  }
}

function returnBook(loanId) {
  const loan = loans.find((item) => item.id === loanId);
  const book = findBook(loan.bookId);
  if (loan && book && !loan.returned) {
    loan.returned = true;
    book.borrowed = Math.max(0, book.borrowed - 1);
    saveAndRender("Book returned successfully");
  }
}

function findBook(id) {
  return books.find((book) => book.id === id);
}

function findMember(id) {
  return members.find((member) => member.id === id);
}

function availableCopies(book) {
  return Math.max(0, book.copies - book.borrowed);
}

function getLoanStatus(loan) {
  if (loan.returned) return "returned";
  return new Date(loan.dueDate) < new Date(dateToInput(today)) ? "overdue" : "borrowed";
}

function statusLabel(status) {
  return {
    borrowed: "Borrowed",
    dueSoon: "Due Soon",
    overdue: "Overdue",
    returned: "Returned"
  }[status];
}

function emptyRow(message, columns) {
  return `<tr><td colspan="${columns}">${message}</td></tr>`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2400);
}

function setDefaultDates() {
  document.querySelector("[name='issueDate']").value = dateToInput(today);
  document.querySelector("[name='dueDate']").value = addDays(14);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function normalizeMemberId(memberId) {
  return memberId.trim().toUpperCase().replace(/\s+/g, "");
}

function getDaysUntilDue(loan) {
  const start = new Date(dateToInput(today));
  const due = new Date(loan.dueDate);
  return Math.ceil((due - start) / 86400000);
}

function getReminderKey(loan) {
  return `${loan.id}-${dateToInput(today)}`;
}

function isEmailConfigured() {
  return Boolean(emailService.publicKey && emailService.serviceId && emailService.templateId && window.emailjs);
}

function initializeEmailService() {
  if (!window.emailjs || window.emailServiceReady) return;
  emailjs.init({ publicKey: emailService.publicKey });
  window.emailServiceReady = true;
}

function buildReminderMessage(loan, book, member) {
  const daysUntilDue = getDaysUntilDue(loan);
  const duePhrase = daysUntilDue < 0
    ? `is overdue by ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) === 1 ? "" : "s"}`
    : daysUntilDue === 0
      ? "is due today"
      : `will be due in ${daysUntilDue} day${daysUntilDue === 1 ? "" : "s"}`;

  const subject = `Library book reminder: ${book.title}`;
  const body = `Dear ${member.name},

This is a reminder from LibraCore Library Management System that the book "${book.title}" ${duePhrase}. The due date is ${loan.dueDate}.

Please return the book on or before the due date. If it is already overdue, kindly return it immediately to avoid violating the library rule.

Thank you.
Library Administrator`;

  return { subject, body };
}

function openPreparedEmail(email, subject, body) {
  const mailto = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;
}

setDefaultDates();
renderAll();

if (sessionStorage.getItem("libraryAdminLoggedIn") === "true") {
  window.setTimeout(runAutomaticReminderCheck, 800);
}

if (window.location.hash) {
  const requestedPage = window.location.hash.replace("#", "");
  if (document.getElementById(requestedPage)) showPage(requestedPage);
}
