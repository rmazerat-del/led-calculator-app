import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
```

Sauvegardez avec **Ctrl+S**.

Ensuite créez un fichier **`.env`** à la racine de `led-calculator-app` (pas dans `src`, mais au même niveau que `package.json`) avec ce contenu :
```
VITE_SUPABASE_URL=https://xbwkbnqbkpcchwdfpznt.supabase.co
VITE_SUPABASE_KEY=sb_publishable_V_so4-uryABD-3LFUXHszg_bHIU2o5L