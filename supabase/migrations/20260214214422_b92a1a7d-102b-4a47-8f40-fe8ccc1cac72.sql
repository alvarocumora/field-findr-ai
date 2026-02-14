
-- Create missing index (the others were already created)
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON public.messages (recipient_id, read);
