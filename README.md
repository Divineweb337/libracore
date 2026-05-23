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

The Reminders module checks active borrowing records and sends reminders for books due within two days, due today, or overdue.

The deployed site sends email through the Vercel API route at `/api/send-reminder`.

Add these environment variables in Vercel:

- `RESEND_API_KEY`: your Resend API key.
- `FROM_EMAIL`: the sender email address, for example `LibraCore Library <onboarding@resend.dev>`.

After adding the variables, redeploy the Vercel project.
