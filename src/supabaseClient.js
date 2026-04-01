import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xbwkbnqbkpcchwdfpznt.supabase.co'
const SUPABASE_KEY = 'sb_publishable_V_so4-uryABD-3LFUXHszg_bHIU2o5L'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)