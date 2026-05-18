import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://acjufczrwyztsmzmljdk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjanVmY3pyd3l6dHNtem1samRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MDk2ODUsImV4cCI6MjA5NDM4NTY4NX0.05hhZnnaF1U-X_XQpaeNb5JNB3dqYkK-4eqtlpE2UW0'

export const supabase = createClient(supabaseUrl, supabaseKey)