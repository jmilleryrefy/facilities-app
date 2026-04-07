/**
 * Centralized application configuration.
 *
 * Admin usernames, notification emails, and allowed domains are
 * defined here so every module references a single source of truth.
 */

/** Email domains permitted to sign in via Microsoft Entra ID. */
export const ALLOWED_DOMAINS = ["yrefy.com", "investyrefy.com", "invessio.com"];

/**
 * Usernames (the part before @domain) that are granted the ADMIN role.
 * Keep in sync with any manual database role overrides.
 */
export const ADMIN_USERNAMES = [
  "lehrick",
  "jmiller",
  "crees",
  "kwilson",
  "jsanchez",
];

/** Email addresses that receive notifications for new facility requests. */
export const ADMIN_NOTIFICATION_EMAILS = [
  "lehrick@yrefy.com",
  "jsanchez@yrefy.com",
];

/** Sender address used for all outgoing email notifications. */
export const FROM_EMAIL = "facilities@yrefy.com";

/** Base URL of the application, used in email links. */
export const APP_URL =
  process.env.NEXTAUTH_URL || "https://facilities.it.yrefy";
