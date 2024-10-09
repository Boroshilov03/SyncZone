import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'URL';
const SUPABASE_API_KEY = 'API';

export const supabase = createClient(SUPABASE_URL, SUPABASE_API_KEY);
