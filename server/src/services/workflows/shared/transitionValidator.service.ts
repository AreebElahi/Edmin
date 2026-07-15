export const validateStateTransition = (
  currentStatus: string,
  nextStatus: string,
  allowedTransitions: Record<string, string[]>
): boolean => {
  const allowed = allowedTransitions[currentStatus] || [];
  return allowed.includes(nextStatus);
};
