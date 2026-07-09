
CREATE POLICY "Admins read report files" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'reports' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins upload report files" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'reports' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete report files" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'reports' AND public.has_role(auth.uid(), 'admin'));
