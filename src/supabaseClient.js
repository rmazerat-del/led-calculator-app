import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xbwkbnqbkpcchwdfpznt.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhid2tibnFia3BjY2h3ZGZwem50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNDY1MDMsImV4cCI6MjA5MDYyMjUwM30.0qknrGn_oAmADJQZxmN9og2BCRJQWVM4djWzv-FSQLk'  // votre clé legacy anon complète

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)