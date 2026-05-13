# Automated Internship Email Sender

## Project Overview

This project is a Node.js automation tool designed to send personalized internship application emails to recruiters. It reads recruiter details (Name, Company, Email) from a CSV file (`recruiters.csv`) and sends out emails using the `nodemailer` library. The emails include a predefined HTML body and an attached resume PDF. It incorporates a delay (60 seconds) between sending emails to prevent spam detection.

**Main Technologies:**
*   **Node.js**: The runtime environment.
*   **Express.js**: Set up as a basic web server, though currently the primary logic runs as a script.
*   **Nodemailer**: Used for handling the SMTP email sending.
*   **csv-parser**: Used to read and parse the `recruiters.csv` file via streams.
*   **dotenv**: Used to manage secure credentials (email and app password) via a `.env` file.

## Directory Structure

*   `server/`: Contains all the application code and assets.
    *   `server.js`: The main entry point containing the email sending logic.
    *   `package.json`: Project dependencies and metadata.
    *   `recruiters.csv`: The input data source for recruiter contacts.
    *   `Aaradhya_Malaviya_Resume (1).pdf`: The resume file attached to the emails.
    *   `.env`: (Ignored in git) Stores `Email` and `EMAIL_PASS` variables.

## Building and Running

### Prerequisites
*   Node.js installed.
*   A Gmail account with an "App Password" generated (standard passwords will not work for security reasons).

### Setup Steps
1.  Navigate to the server directory:
    ```bash
    cd server
    ```
2.  Install the required dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the `server` directory with your credentials:
    ```env
    Email=your_email@gmail.com
    EMAIL_PASS=your_gmail_app_password
    ```
4.  Update the `recruiters.csv` file with the target recipients (Format: Name,Company,Email).
5.  Ensure the resume file named `Aaradhya_Malaviya_Resume (1).pdf` is present in the `server` directory.

### Running the Script
Start the server and initiate the email sending process:
```bash
cd server
node server.js
```
*(Alternatively, you can use `npm run dev` as defined in package.json)*

## Development Conventions & Notes

*   **Credential Management**: Never hardcode credentials. Always use the `.env` file for `Email` and `EMAIL_PASS`.
*   **Rate Limiting**: The script includes a deliberate `await new Promise((r) => setTimeout(r, 60000));` (60 seconds) after each email sent. This is a critical convention to avoid having the Gmail account flagged or banned for spamming.
*   **Data Source**: Recipient data is strictly managed via the `recruiters.csv` file to keep code and data separated.
*   **Module Type**: The project uses ES modules (`"type": "module"` in `package.json`), utilizing `import` syntax instead of `require()`.
