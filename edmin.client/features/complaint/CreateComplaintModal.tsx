import React, { useState } from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Button,
  Field,
  Input,
  Textarea,
  Spinner,
  Select
} from '@fluentui/react-components';
import { ComplaintService, Complaint } from './ComplaintService';

interface CreateComplaintModalProps {
  onSuccess: (complaint: Complaint) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function CreateComplaintModal({ onSuccess, isOpen, setIsOpen }: CreateComplaintModalProps) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setError('Please fill out all fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const newComplaint = await ComplaintService.createComplaint(subject, description, priority);
      onSuccess(newComplaint);
      setSubject('');
      setDescription('');
      setPriority('MEDIUM');
      setIsOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create complaint.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(e, data) => setIsOpen(data.open)}>
      <DialogSurface aria-describedby={undefined}>
        <form onSubmit={handleSubmit}>
          <DialogBody>
            <DialogTitle>Submit a New Complaint / Ticket</DialogTitle>
            <DialogContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                {error && <div style={{ color: 'red', fontSize: '14px' }}>{error}</div>}
                
                <Field label="Subject" required>
                  <Input 
                    value={subject} 
                    onChange={(e, data) => setSubject(data.value)}
                    placeholder="Briefly describe the issue..."
                    disabled={isSubmitting}
                  />
                </Field>

                <Field label="Priority">
                  <Select 
                    value={priority} 
                    onChange={(e, data) => setPriority(data.value)}
                    disabled={isSubmitting}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </Select>
                </Field>

                <Field label="Description" required>
                  <Textarea 
                    value={description}
                    onChange={(e, data) => setDescription(data.value)}
                    placeholder="Provide detailed information..."
                    rows={5}
                    disabled={isSubmitting}
                  />
                </Field>
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" appearance="primary" disabled={isSubmitting || !subject || !description}>
                {isSubmitting ? <Spinner size="tiny" /> : 'Submit'}
              </Button>
            </DialogActions>
          </DialogBody>
        </form>
      </DialogSurface>
    </Dialog>
  );
}
