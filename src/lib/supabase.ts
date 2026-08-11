import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Field = {
  id: string;
  name: string;
  slug: string;
  display_order: number;
};

export type Profession = {
  id: string;
  field_id: string;
  name: string;
  slug: string;
  keywords: string[];
  display_order: number;
  fields?: Field;
};

export type UserProfile = {
  id: string;
  primary_profession_id: string;
  onboarded: boolean;
};

export type PulseItem = {
  id: string;
  profession_id: string;
  headline: string;
  summary: string;
  source: string;
  source_url: string | null;
  published_date: string | null;
  why_it_matters: string | null;
  fetched_date: string;
};

export type AscendingSkill = {
  id: string;
  profession_id: string;
  name: string;
  description: string;
  why_rising: string;
  fetched_date: string;
};

export type FadingSkill = {
  id: string;
  profession_id: string;
  name: string;
  why_fading: string;
  still_useful_for: string;
  modern_alternative: string;
  fetched_date: string;
};

export type LibraryItem = {
  id: string;
  profession_id: string;
  type: "book" | "paper" | "tool";
  title: string;
  author_or_source: string;
  why_it_matters: string;
  url: string | null;
  fetched_date: string;
};

export type CompassPick = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  week_label: string;
};
