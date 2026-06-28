CREATE POLICY "Users can update messages in their sessions"
ON public.chat_messages FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.chat_sessions
  WHERE chat_sessions.id = chat_messages.session_id
    AND chat_sessions.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.chat_sessions
  WHERE chat_sessions.id = chat_messages.session_id
    AND chat_sessions.user_id = auth.uid()
));