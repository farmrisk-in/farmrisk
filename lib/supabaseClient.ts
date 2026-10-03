import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://meaqfipbbrlqfautkaan.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_jCYy_8ivOndk6MRLJ3nzNw_vT9_R8el';

export const supabase = createClient(supabaseUrl, supabaseKey);
