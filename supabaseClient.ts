import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// PASO OBLIGATORIO:
// Sustituye las comillas vacías '' con tus claves de Supabase.
// Las encuentras en: supabase.com -> Tu Proyecto -> Settings -> API
// ------------------------------------------------------------------

const supabaseUrl = 'https://jyabpltcryefydixthvy.supabase.co'; 
// Ejemplo: 'https://xyzxyzxyz.supabase.co'

const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5YWJwbHRjcnllZnlkaXh0aHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NTg2NjIsImV4cCI6MjA4MDQzNDY2Mn0.XuRW8O7yv5UHW5AiO-UuF4rJwogmcb7Z01be4bySRVM'; 
// Ejemplo: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

// ------------------------------------------------------------------

// Función auxiliar para validar que has puesto algo
const isValidConfig = () => {
  return supabaseUrl.length > 0 && supabaseAnonKey.length > 0;
};

// Evitamos que la app explote si las claves están vacías
const urlToUse = isValidConfig() ? supabaseUrl : 'https://placeholder.supabase.co';
const keyToUse = isValidConfig() ? supabaseAnonKey : 'placeholder';

export const supabase = createClient(urlToUse, keyToUse);

export const isConfigured = () => {
  return isValidConfig() && !supabaseUrl.includes('placeholder');
};