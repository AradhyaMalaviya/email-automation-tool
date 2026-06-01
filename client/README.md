# 🚀 Email Automation Tool - React Dashboard

This is the frontend client for the Email Automation Tool. It is built using React and Vite, featuring a modern, responsive UI to manage your email campaigns effortlessly.

## 📌 Features
- **Dashboard**: Overview of analytics, recently sent emails, and quick actions.
- **Recruiters Management**: Table view to list, add, edit, and delete recruiters. Support for CSV imports.
- **Template Editor**: Create and edit email templates with dynamic variables like `{{Name}}` and `{{Company}}`.
- **Email Sender**: Trigger email campaigns with real-time progress tracking.
- **Settings & History**: Configure app preferences, toggle Dark/Light mode, and view past email logs.

## 🛠️ Tech Stack
- React
- Vite
- Custom CSS (Modern Aesthetic, CSS Modules structure, Dark/Light mode)

## ⚙️ Setup & Scripts

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## 🎨 Design System
The client leverages a custom design system focusing on:
- **Glassmorphism & Gradients**: For a premium feel.
- **Micro-animations**: Hover states and page transitions.
- **Theme Variables**: Managed via CSS custom properties in `src/index.css`.
