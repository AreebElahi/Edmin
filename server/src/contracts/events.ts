export type DomainEvent = 
  | "INVOICE_GENERATED"
  | "PAYMENT_RECEIVED"
  | "GRADES_PUBLISHED"
  | "STUDENT_ENROLLED"
  | "COURSE_COMPLETED";

export interface OutboxEventPayload {
  [key: string]: any;
}
