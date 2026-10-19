export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
  },
});
