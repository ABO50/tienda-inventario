const SUPABASE_URL = 'https://mookgkuwsszezoqnuivk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vb2tna3V3c3N6ZXpvcW51aXZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU2ODc4MjAsImV4cCI6MjExMTI2MzgyMH0.tvT9CRe6c1JGQQ9wNDMfDizkJZEXyHOqWjcacV4XEGM';

// Mientras no pongas tus datos, la página avisa en lugar de fallar.
const supabaseConfigurado = !SUPABASE_URL.includes('TU-PROYECTO');

// Cliente que usaremos en todos los archivos para hablar con Supabase.
const clienteSupabase = supabaseConfigurado
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;