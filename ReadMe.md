# 🚀 Full-Stack Automated Internship Email Sender

A comprehensive full-stack automation tool built with React, Node.js, Express, and SQLite. It provides a beautiful dashboard to manage recruiters, email templates, settings, and track the progress of your internship application emails.

---

## 📌 Key Features

* **🖥️ Modern React Dashboard**: Beautiful, responsive UI with Dark/Light mode support.
* **📊 Analytics & Tracking**: Visual analytics to track sent emails and success rates.
* **📇 Recruiter Management**: Add recruiters manually or import via CSV.
* **📝 Template System**: Create, edit, and manage rich HTML email templates with dynamic variables (e.g. `{{Name}}`, `{{Company}}`).
* **📧 Automated Sending**: Send personalized emails with built-in delays to avoid spam detection.
* **🗄️ SQLite Database**: Robust local data storage for recruiters, history, templates, and analytics.
* **📎 Resume Management**: Upload and manage your resume securely.
* **🔐 Secure Credentials**: Environment variables (`.env`) for SMTP/App passwords.

---

## 🛠️ Tech Stack

* **Frontend**: React, Vite, Custom CSS with Theme Variables
* **Backend**: Node.js, Express.js
* **Database**: SQLite
* **Email Service**: Nodemailer
* **Data parsing/Uploads**: `csv-parser`, `multer`

---

## 📂 Project Structure

```
project-root/
│
├── client/              # React Frontend (Vite)
│   ├── src/             # Components, Pages, Styles, etc.
│   └── package.json
│
├── server/              # Node.js/Express Backend
│   ├── routes/          # API endpoints (emails, recruiters, analytics, etc.)
│   ├── services/        # Email service logic
│   ├── data.db          # SQLite Database
│   ├── .env             # Environment variables
│   └── package.json
└── ReadMe.md
```

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the repository

```bash
git clone https://github.com/AradhyaMalaviya/email-automation-tool.git
cd email-automation-tool
```

---

### 2️⃣ Backend Setup (Server)

Navigate to the server directory and install packages:

```bash
cd server
npm install
```

Create a `.env` file inside the `server/` directory:

```env
Email=your_email@gmail.com
EMAIL_PASS=your_app_password
PORT=5000
```
*(👉 Use Gmail App Password, not your real password)*

Start the backend server:

```bash
npm run dev
# or: node server.js
```

---

### 3️⃣ Frontend Setup (Client)

Open a new terminal window, navigate to the client directory, and install packages:

```bash
cd client
npm install
```

Start the frontend development server:

```bash
npm run dev
```

The dashboard will be available at `http://localhost:5173`.

---

## 📧 How It Works

1. **Dashboard**: Get an overview of your campaigns and recent activity.
2. **Templates**: Set up your email templates using dynamic placeholders (e.g., `{{Name}}`, `{{Company}}`).
3. **Recruiters**: Add recipients individually or upload a CSV file with their details.
4. **Send Emails**: Select your preferred template, and the tool will automatically send personalized emails with delays to keep your account safe from spam filters.
5. **History & Analytics**: View logs and track the progress of your overall campaigns.

---

## ⚠️ Important Notes

* **Rate Limits**: Do NOT send too many emails at once to avoid being marked as spam. Recommended limit: 100–150 emails/day.
* **Testing**: Always test using your own email first before sending to actual recruiters.

---

## 👨‍💻 Author

Aaradhya Malaviya  
AI-Powered Product Builder  
GitHub: https://github.com/AradhyaMalaviya  
LinkedIn: https://www.linkedin.com/in/aradhya-malaviya-26bb31303/
