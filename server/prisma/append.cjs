const fs = require('fs');

const content = `

model ApprovalHistory {
  id            String   @id @default(cuid())
  entityType    ApprovalEntityType
  entityId      Int
  action        ApprovalAction
  comments      String?
  actorId       Int
  actor         user     @relation(fields: [actorId], references: [userid])
  departmentId  Int?
  createdAt     DateTime @default(now())
  metadata      Json?
}

enum ApprovalEntityType {
  TEACHING_LOAD
  ENROLLMENT
  LEAVE
  ACTIVITY_REPORT
}

enum ApprovalAction {
  SUBMITTED
  RECOMMENDED
  APPROVED
  REJECTED
  RETURNED
  COMMENTED
}

`;

fs.appendFileSync('d:/edmin-afterupdate/server/prisma/schema.prisma', content);
