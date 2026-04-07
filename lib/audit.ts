import { prisma } from "./prisma";

interface AuditLogEntry {
  requestId: string;
  actorId: string | null;
  action: string;
  field?: string;
  oldValue?: string | null;
  newValue?: string | null;
}

/**
 * Create a single audit log entry.
 */
export async function logAudit(entry: AuditLogEntry) {
  try {
    await prisma.auditLog.create({
      data: {
        requestId: entry.requestId,
        actorId: entry.actorId,
        action: entry.action,
        field: entry.field,
        oldValue: entry.oldValue ?? null,
        newValue: entry.newValue ?? null,
      },
    });
  } catch (error) {
    console.error("[AUDIT] Failed to write audit log:", error);
  }
}

/**
 * Log multiple field changes at once (e.g. when a request is edited).
 * Compares oldValues and newValues objects and logs each changed field.
 */
export async function logFieldChanges(
  requestId: string,
  actorId: string | null,
  action: string,
  oldValues: Record<string, string | null | undefined>,
  newValues: Record<string, string | null | undefined>
) {
  const entries: AuditLogEntry[] = [];

  for (const field of Object.keys(newValues)) {
    const oldVal = oldValues[field] ?? null;
    const newVal = newValues[field] ?? null;
    if (oldVal !== newVal) {
      entries.push({
        requestId,
        actorId,
        action,
        field,
        oldValue: oldVal,
        newValue: newVal,
      });
    }
  }

  if (entries.length === 0) return;

  try {
    await prisma.auditLog.createMany({
      data: entries.map((e) => ({
        requestId: e.requestId,
        actorId: e.actorId,
        action: e.action,
        field: e.field,
        oldValue: e.oldValue,
        newValue: e.newValue,
      })),
    });
  } catch (error) {
    console.error("[AUDIT] Failed to write audit logs:", error);
  }
}
