import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import csv from "csv-parser";
import { pipeline } from "stream";
import nodemailer from "nodemailer";

dotenv.config();
const app = express();
const port = 8000;
app.use(express.json());

const array = [];

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.Email,
    pass: process.env.EMAIL_PASS,
  },
});

const stream = fs.createReadStream("./recruiters.csv").pipe(csv());
stream.on("data", (data) => {
  array.push(data);
});
stream.on("end", async () => {
  for (let row of array) {
    try {
      await transporter.sendMail({
        from: `\"Aaradhya Malaviya\" <${process.env.Email}>`,
        to: row.Email,
        subject: `Internship Application at ${row.Company}`,

        html: `
  <p>Hi ${row.Name},</p>

  <p>
  I’m Aaradhya Malaviya, and I’ve attached my resume to apply for an internship role at your company. 
  I am a passionate software developer with a strong drive to build meaningful projects and solve real-world problems.
</p>

  <p>
    I’m currently looking for an internship opportunity at <b>${row.Company}</b> where I can contribute from day one and continue learning in a fast-paced environment.
  </p>

  <p>
    I’ve attached my resume for your review. I’d really appreciate the opportunity to connect and explore if there’s a fit.
  </p>

  <p>
    Thank you for your time.<br/><br/>
    Aaradhya Malaviya<br/>
    Phone: 9260940347<br/>
    LinkedIn: https://www.linkedin.com/in/aradhya-malaviya-26bb31303/<br/>
    GitHub: https://github.com/AradhyaMalaviya
  </p>
`,

        attachments: [
          {
            filename: "Aaradhya_Malaviya_Resume.pdf",
            path: "./Aaradhya_Malaviya_Resume (1).pdf",
          },
        ],
      });

      console.log(`email sent to  ${row.Email}`);
      await new Promise((r) => setTimeout(r, 60000));
    } catch (err) {
      console.log(err);
    }
  }
});

app.listen(port, () => {
  console.log(`server is running on ${port}`);
});
