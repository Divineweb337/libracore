# LibraCore Library Management System

Final year project website for managing a library catalogue, members, borrowing records, returns, and reports.

## Admin Login

- Username: `admin`
- Password: `admin123`

## Deploying To Vercel

1. Upload this folder to GitHub.
2. In Vercel, choose **Add New Project**.
3. Import the GitHub repository.
4. Leave the framework preset as **Other**.
5. Use the project root as this folder.
6. Deploy.

This is a static website. The records are stored in the browser using local storage for project demonstration purposes.

## Email Reminder Setup

The Reminders module checks active borrowing records and prepares reminders for books due within two days, due today, or overdue.

To send emails directly from the deployed site, create an EmailJS account and add your `publicKey`, `serviceId`, and `templateId` inside `script.js`.

Recommended EmailJS template variables:

- `to_email`
- `to_name`
- `book_title`
- `due_date`
- `reminder_message`
