import { prisma } from "@/lib/prisma";

export async function createAuditLog({
  action,
  actorId,
  actorEmail,
  actorName,
  targetId = null,
  targetName = null,
  details = null,
}: {
  action: string;
  actorId: string;
  actorEmail: string;
  actorName: string;
  targetId?: string | null;
  targetName?: string | null;
  details?: Record<string, unknown> | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        actorId,
        actorEmail,
        actorName,
        targetId,
        targetName,
        details: details ? JSON.parse(JSON.stringify(details)) : null,
      },
    });
  } catch (error) {
    console.error("Audit log creation error:", error);
  }
}
