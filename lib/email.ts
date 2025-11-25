import nodemailer from "nodemailer";
import { FacilityRequest, User, Severity } from "@prisma/client";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
  secure: process.env.EMAIL_SERVER_PORT === "465",
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

const ADMIN_EMAIL = "lehrick@yrefy.com";
const APP_URL = process.env.NEXTAUTH_URL || "https://facilities.it.yrefy";

function getSeverityColor(severity: Severity): string {
  switch (severity) {
    case "CRITICAL":
      return "#DC2626";
    case "HIGH":
      return "#EA580C";
    case "MEDIUM":
      return "#F59E0B";
    case "LOW":
      return "#10B981";
    default:
      return "#6B7280";
  }
}

export async function sendNewRequestNotification(
  request: FacilityRequest,
  user: User
) {
  try {
    const severityColor = getSeverityColor(request.severity);

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: ADMIN_EMAIL,
      subject: `New Facility Request - ${request.severity} Priority`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600;">New Facility Request</h1>
              <div style="background: ${severityColor}; color: white; display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 14px; font-weight: 600; margin-bottom: 16px;">
                ${request.severity} PRIORITY
              </div>
            </div>

            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
              <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #111827;">Request Details</h2>

              <div style="margin-bottom: 16px;">
                <div style="font-weight: 600; color: #6b7280; font-size: 14px; margin-bottom: 4px;">Location</div>
                <div style="font-size: 16px;">${request.location}</div>
              </div>

              <div style="margin-bottom: 16px;">
                <div style="font-weight: 600; color: #6b7280; font-size: 14px; margin-bottom: 4px;">Description</div>
                <div style="font-size: 16px; white-space: pre-wrap;">${request.description}</div>
              </div>

              <div style="margin-bottom: 16px;">
                <div style="font-weight: 600; color: #6b7280; font-size: 14px; margin-bottom: 4px;">Submitted By</div>
                <div style="font-size: 16px;">${user.name || "Unknown"}</div>
                <div style="font-size: 14px; color: #6b7280;">${user.email}</div>
                ${user.department ? `<div style="font-size: 14px; color: #6b7280;">${user.department}</div>` : ""}
                ${user.jobTitle ? `<div style="font-size: 14px; color: #6b7280;">${user.jobTitle}</div>` : ""}
              </div>

              <div style="margin-bottom: 16px;">
                <div style="font-weight: 600; color: #6b7280; font-size: 14px; margin-bottom: 4px;">Request ID</div>
                <div style="font-size: 14px; font-family: monospace; color: #6b7280;">${request.id}</div>
              </div>
            </div>

            <div style="text-align: center; margin-top: 24px;">
              <a href="${APP_URL}/admin/${request.id}" style="background: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; display: inline-block; font-weight: 600;">
                View and Respond
              </a>
            </div>

            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
              <p>This is an automated notification from the Facility Requests system.</p>
            </div>
          </body>
        </html>
      `,
    });

    console.log(`Email notification sent for request ${request.id}`);
  } catch (error) {
    console.error("Failed to send email notification:", error);
    // Don't throw - we don't want to fail the request creation if email fails
  }
}

export async function sendResponseNotification(
  request: FacilityRequest,
  user: User,
  responseMessage: string
) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: `Update on Your Facility Request - ${request.location}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
              <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600;">Facility Request Update</h1>
              <p style="margin: 0; color: #6b7280;">Your request has been updated</p>
            </div>

            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
              <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #111827;">Request Information</h2>

              <div style="margin-bottom: 16px;">
                <div style="font-weight: 600; color: #6b7280; font-size: 14px; margin-bottom: 4px;">Location</div>
                <div style="font-size: 16px;">${request.location}</div>
              </div>

              <div style="margin-bottom: 16px;">
                <div style="font-weight: 600; color: #6b7280; font-size: 14px; margin-bottom: 4px;">Status</div>
                <div style="font-size: 16px; font-weight: 600; color: #2563eb;">${request.status}</div>
              </div>

              <div style="margin-bottom: 16px;">
                <div style="font-weight: 600; color: #6b7280; font-size: 14px; margin-bottom: 4px;">Response</div>
                <div style="font-size: 16px; white-space: pre-wrap; background: #f8f9fa; padding: 16px; border-radius: 6px; border-left: 4px solid #2563eb;">
                  ${responseMessage}
                </div>
              </div>
            </div>

            <div style="text-align: center; margin-top: 24px;">
              <a href="${APP_URL}/requests/${request.id}" style="background: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; display: inline-block; font-weight: 600;">
                View Request Details
              </a>
            </div>

            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
              <p>This is an automated notification from the Facility Requests system.</p>
            </div>
          </body>
        </html>
      `,
    });

    console.log(`Response notification sent to ${user.email}`);
  } catch (error) {
    console.error("Failed to send response notification:", error);
  }
}
