// src/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://fyymtfzpzoxksgkazhgw.supabase.co";  
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5eW10Znpwem94a3Nna2F6aGd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMjA3NzEsImV4cCI6MjA3OTU5Njc3MX0.SVRyMLXQ2YCVqIUYU5lJdaord1X8Zf1Zh19BKLCODb4";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
