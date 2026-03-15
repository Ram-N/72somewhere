import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type City = {
  id: string;
  city: string;
  city_ascii: string;
  lat: number;
  lng: number;
  country: string;
  iso2: string;
  iso3: string;
  admin_name: string;
  capital: string;
  population: number;
};

export type ClimateData = {
  city_id: string;
  city_name: string;
  country: string;
  month: number;
  avg_high_temp_c: number;
  avg_low_temp_c: number;
  avg_precip_mm: number;
};
