import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://xbwkbnqbkpcchwdfpznt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhid2tibnFia3BjY2h3ZGZwem50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNDY1MDMsImV4cCI6MjA5MDYyMjUwM30.0qknrGn_oAmADJQZxmN9og2BCRJQWVM4djWzv-FSQLk'
)