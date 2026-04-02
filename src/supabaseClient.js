import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://xbwkbnqbkpcchwdfpznt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhid2tuYnFia3BjY2h3ZGZwem50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MTMxNzQsImV4cCI6MjA1OTA4OTE3NH0.Ht0WnAyOvRDkE-OTtVkjE7Y8hJHFKS1NMmRL_x4NKZA'
)