const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Replace standard missing deletes
schema = schema.replace(/@relation\(fields: \[assignee_id\], references: \[userid\]\)/g, '@relation(fields: [assignee_id], references: [userid], onDelete: Cascade)');
schema = schema.replace(/@relation\(fields: \[requester_id\], references: \[userid\]\)/g, '@relation(fields: [requester_id], references: [userid], onDelete: Cascade)');
schema = schema.replace(/@relation\(fields: \[sender_id\], references: \[userid\]\)/g, '@relation(fields: [sender_id], references: [userid], onDelete: Cascade)');
schema = schema.replace(/@relation\(fields: \[created_by_id\], references: \[userid\]\)/g, '@relation(fields: [created_by_id], references: [userid], onDelete: Cascade)');
schema = schema.replace(/@relation\(fields: \[actor_id\], references: \[userid\]\)/g, '@relation(fields: [actor_id], references: [userid], onDelete: Cascade)');

schema = schema.replace(/@relation\("assessment_createdby", fields: \[createdby\], references: \[userid\]\)/g, '@relation("assessment_createdby", fields: [createdby], references: [userid], onDelete: SetNull)');
schema = schema.replace(/@relation\("assessment_publishedby", fields: \[publishedby\], references: \[userid\]\)/g, '@relation("assessment_publishedby", fields: [publishedby], references: [userid], onDelete: SetNull)');
schema = schema.replace(/@relation\("assessment_updatedby", fields: \[updatedby\], references: \[userid\]\)/g, '@relation("assessment_updatedby", fields: [updatedby], references: [userid], onDelete: SetNull)');

schema = schema.replace(/@relation\(fields: \[studentid\], references: \[studentid\]\)/g, '@relation(fields: [studentid], references: [studentid], onDelete: Cascade)');

// For all those explicitly set to NoAction which might block
schema = schema.replace(/onDelete: NoAction/g, 'onDelete: Cascade');
schema = schema.replace(/onUpdate: NoAction/g, 'onUpdate: Cascade');

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Schema fixed!');
