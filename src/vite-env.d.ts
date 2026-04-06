/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_PATH_TODAY: string
  readonly VITE_API_PATH_RESULTS: string
  readonly VITE_API_PATH_POINTS: string
  readonly VITE_API_PATH_PREDICT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
