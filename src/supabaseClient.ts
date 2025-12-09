import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// CONFIGURACIÓN DIRECTA
// ------------------------------------------------------------------
// Hemos vuelto a poner las claves aquí para facilitar el despliegue.
// Nota: Al ser públicas, evita compartir el repositorio con desconocidos.
// ------------------------------------------------------------------

const supabaseUrl = 'https://jyabpltcryefydixthvy.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5YWJwbHRjcnllZnlkaXh0aHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NTg2NjIsImV4cCI6MjA4MDQzNDY2Mn0.XuRW8O7yv5UHW5AiO-UuF4rJwogmcb7Z01be4bySRVM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isConfigured = () => {
  return supabaseUrl.length > 0 && supabaseAnonKey.length > 0 && !supabaseUrl.includes('placeholder');
};