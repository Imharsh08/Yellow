// Hand-maintained mirror of supabase/migrations. Regenerate with:
//   npx supabase gen types typescript --linked > src/lib/types.ts
// once the project is linked.

export type PoiCategory =
  | "bhojan_shivir"
  | "medical_point"
  | "rush_area"
  | "personal_vlog"
  | "charging_point"
  | "other";

export type PoiStatus = "visible" | "hidden" | "under_review";

export type Profile = {
  id: string;
  full_name: string;
  phone: string | null;
  destination: string;
  photo_url: string | null;
  onboarded_at: string | null;
  created_at: string;
  updated_at: string;
}

export type Route = {
  id: string;
  slug: string;
  name: string;
  origin_name: string;
  origin_lat: number;
  origin_lng: number;
  dest_name: string;
  dest_lat: number;
  dest_lng: number;
  total_km: number;
  is_active: boolean;
  created_at: string;
}

export type Checkpoint = {
  id: string;
  route_id: string;
  seq: number;
  name: string;
  lat: number;
  lng: number;
  km_from_start: number;
  notes: string | null;
  created_at: string;
}

export type Poi = {
  id: string;
  user_id: string;
  category: PoiCategory;
  title: string;
  note: string | null;
  lat: number;
  lng: number;
  photo_url: string | null;
  status: PoiStatus;
  report_count: number;
  created_at: string;
}

/** Public map feed: POI fields plus contributor display name (FR-5). */
export type PoiFeedItem = {
  id: string;
  category: PoiCategory;
  title: string;
  note: string | null;
  lat: number;
  lng: number;
  photo_url: string | null;
  created_at: string;
  user_id: string;
  submitted_by: string;
}

export type UserProgress = {
  id: string;
  user_id: string;
  route_id: string;
  started_at: string;
  last_lat: number | null;
  last_lng: number | null;
  last_seen_at: string | null;
  km_covered: number;
  last_checkpoint_seq: number;
  completed_at: string | null;
  certificate_issued_at: string | null;
}

export type PoiReport = {
  id: string;
  poi_id: string;
  user_id: string;
  reason: string;
  created_at: string;
}

// Must satisfy postgrest-js `GenericSchema`, which requires `Tables`,
// `Views` and `Functions`, and a `Relationships` tuple on every table.
//
// Every row type above is a `type` alias, not an `interface`, and that is
// load-bearing: interfaces have no implicit index signature, so they fail
// the `Row: Record<string, unknown>` constraint. When that happens the
// generic does not error here — it quietly resolves the whole schema to
// `never`, and every `.from(...)` result in the app becomes `never`.
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Pick<Profile, "id" | "full_name"> &
          Partial<Omit<Profile, "id" | "full_name">>;
        Update: Partial<Profile>;
        Relationships: [];
      };
      routes: {
        Row: Route;
        Insert: Omit<Route, "id" | "created_at"> & { id?: string };
        Update: Partial<Route>;
        Relationships: [];
      };
      checkpoints: {
        Row: Checkpoint;
        Insert: Omit<Checkpoint, "id" | "created_at"> & { id?: string };
        Update: Partial<Checkpoint>;
        Relationships: [];
      };
      pois: {
        Row: Poi;
        Insert: Pick<Poi, "user_id" | "category" | "title" | "lat" | "lng"> &
          Partial<
            Omit<Poi, "user_id" | "category" | "title" | "lat" | "lng">
          >;
        Update: Partial<Poi>;
        Relationships: [];
      };
      poi_reports: {
        Row: PoiReport;
        Insert: { poi_id: string; user_id: string; reason: string };
        Update: Partial<PoiReport>;
        Relationships: [];
      };
      user_progress: {
        Row: UserProgress;
        // Only user_id and route_id are required; the rest have DB defaults.
        Insert: Pick<UserProgress, "user_id" | "route_id"> &
          Partial<Omit<UserProgress, "user_id" | "route_id">>;
        Update: Partial<UserProgress>;
        Relationships: [];
      };
    };
    Views: {
      poi_feed: { Row: PoiFeedItem; Relationships: [] };
    };
    // Must not be `Record<string, never>` — `never` fails the
    // `GenericFunction` constraint, which silently collapses the whole
    // schema (and every query result) to `never`.
    Functions: Record<
      string,
      { Args: Record<string, unknown>; Returns: unknown }
    >;
    Enums: {
      poi_category: PoiCategory;
      poi_status: PoiStatus;
    };
  };
};

/** Display metadata for each POI category: icon, label, colour. */
export const POI_META: Record<
  PoiCategory,
  { label: string; icon: string; hue: string; pin: string }
> = {
  bhojan_shivir: {
    label: "Bhojan Shivir",
    icon: "restaurant",
    hue: "text-tertiary",
    pin: "#e2a900",
  },
  medical_point: {
    label: "Medical Point",
    icon: "local_hospital",
    hue: "text-error",
    pin: "#ba1a1a",
  },
  rush_area: {
    label: "Rush Area",
    icon: "groups",
    hue: "text-surface-tint",
    pin: "#8f4e00",
  },
  charging_point: {
    label: "Charging Point",
    icon: "battery_charging_full",
    hue: "text-secondary",
    pin: "#ad2c00",
  },
  personal_vlog: {
    label: "Personal Vlog",
    icon: "play_circle",
    hue: "text-primary",
    pin: "#ff9933",
  },
  other: {
    label: "Other",
    icon: "push_pin",
    hue: "text-on-surface-variant",
    pin: "#554336",
  },
};

export const POI_CATEGORIES = Object.keys(POI_META) as PoiCategory[];

