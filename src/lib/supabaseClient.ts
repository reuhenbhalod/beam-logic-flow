import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://adkgrkjqbtbjogkbjjpf.supabase.co'
const supabaseAnonKey = 'YOUR_ANON_KEY_HERE' // replace with your anon key

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
