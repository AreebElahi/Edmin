import prisma from '../../../config/prisma.js';

export const createAuditEntry = async (
  actorId: number,
  action: string,
  tableName: string,
  recordId: number,
  snapshot: any,
  tx?: any
) => {
  const client = tx || prisma;
  return await client.auditLog.create({
    data: {
      actor_id: actorId,
      action,
      table_name: tableName,
      record_id: recordId,
      snapshot: snapshot || {}
    }
  });
};
