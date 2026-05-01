// ============================================================
// CYBERNET VAULT // Supabase client
// ============================================================

const SUPABASE_URL = 'https://udnljsorngwiitflcocj.supabase.co';  // <-- твой Project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkbmxqc29ybmd3aWl0Zmxjb2NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MTg0MTIsImV4cCI6MjA5MzE5NDQxMn0._rHCuVqISmfWTLMgd0MtuGG5YAYjoRmDAKrg46H2Dmw';                         // <-- твой anon key

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);