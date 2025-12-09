import nodemailer from "nodemailer";
import { logger } from "../utils/logger";

// Initialize transporter using closure
let transporter: nodemailer.Transporter | null = null;

const getTransporter = (): nodemailer.Transporter => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

export async function sendWelcomeEmail(
  email: string,
  firstName?: string,
): Promise<void> {
  try {
    await getTransporter().sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Welcome to Resume AI Assistant! 🚀",
      html: `
        <h1>Welcome ${firstName || "there"}!</h1>
        <p>Thank you for joining Resume AI Assistant. We're excited to help you create amazing resumes!</p>
        <p>You start with 10 free credits to explore our AI-powered features:</p>
        <ul>
          <li>Resume Analysis & Scoring</li>
          <li>AI-Powered Tailoring</li>
          <li>Keyword Optimization</li>
          <li>Professional Summary Generation</li>
        </ul>
        <p>Get started by uploading your resume or creating a new one from scratch.</p>
        <a href="${process.env.FRONTEND_URL}/dashboard">Go to Dashboard</a>
      `,
    });

    logger.info(`Welcome email sent to ${email}`);
  } catch (error) {
    logger.error(error, "Failed to send welcome email:");
  }
}

export async function sendAnalysisReport(
  email: string,
  analysisData: any,
): Promise<void> {
  try {
    await getTransporter().sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Resume Analysis Report - Score: ${analysisData.score}%`,
      html: `
        <h2>Your Resume Analysis is Complete!</h2>
        <p>Match Score: <strong>${analysisData.score}%</strong></p>

        <h3>Key Findings:</h3>
        <ul>
          ${analysisData.strengths.map((s: string) => `<li>${s}</li>`).join("")}
        </ul>

        <h3>Recommendations:</h3>
        <ul>
          ${analysisData.suggestions.map((s: string) => `<li>${s}</li>`).join("")}
        </ul>

        <p>View full report in your dashboard.</p>
        <a href="${process.env.FRONTEND_URL}/dashboard">View Report</a>
      `,
    });

    logger.info(`Analysis report sent to ${email}`);
  } catch (error) {
    logger.error(error, "Failed to send analysis report:");
  }
}

export async function sendCreditsLowNotification(
  email: string,
  creditsRemaining: number,
): Promise<void> {
  try {
    await getTransporter().sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Low Credits Alert",
      html: `
        <h2>Your credits are running low</h2>
        <p>You have only <strong>${creditsRemaining}</strong> credits remaining.</p>
        <p>Upgrade to Pro to get unlimited monthly credits and unlock all features!</p>
        <a href="${process.env.FRONTEND_URL}/pricing">Upgrade Now</a>
      `,
    });

    logger.info(`Low credits notification sent to ${email}`);
  } catch (error) {
    logger.error(error, "Failed to send low credits notification:");
  }
}
