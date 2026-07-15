import prisma from '../../config/prisma.js';
import { peekSequence } from '../../services/identity/sequenceService.js';
import { DEFAULT_DEPARTMENT_CODE } from './identity.constants.js';
import { buildSequenceKey, formatIdentifier, generateUsername, generateInstitutionalEmail } from './identity.generator.js';


export async function previewIdentity(payload: {
  name: string;
  role: string;
  departmentId?: number;
}): Promise<{ username: string; institutionalEmail: string; identifier: string }> {
  const { name, role, departmentId } = payload;

  // Resolve department code
  let deptCode = DEFAULT_DEPARTMENT_CODE;
  if (departmentId) {
    const dept = await prisma.department.findUnique({
      where: { departmentid: departmentId }
    });
    if (dept) {
      deptCode = dept.code;
    }
  }

  // Preview Username
  const username = await generateUsername(name);
  const institutionalEmail = generateInstitutionalEmail(username);

  // Preview Identifier
  const year = new Date().getFullYear();
  const key = buildSequenceKey(role, deptCode, year);
  const seq = await peekSequence(key);
  const identifier = formatIdentifier(role, deptCode, seq, year);

  return {
    username,
    institutionalEmail,
    identifier
  };
}
