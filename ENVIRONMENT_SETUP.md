# Environment Setup

## Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Getting Started

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your actual Supabase values in the `.env` file

3. Validate your environment setup:
   ```bash
   npm run env:check
   ```

4. Start the development server:
   ```bash
   npm run start
   ```

## Available Scripts

- `npm run env:check` - Validate that all required environment variables are set
- `npm run env:validate` - Same as env:check (alias)
- `npm run start` - Start the Expo development server
- `npm run dev` - Start with telemetry disabled

## Security Notes

- ✅ Never commit `.env` files to version control
- ✅ The `.env` file is already included in `.gitignore`
- ✅ Use `.env.example` as a template for other developers
- ⚠️ Environment variables prefixed with `EXPO_PUBLIC_` are exposed to the client
- 🔒 For sensitive data, use server-side environment variables instead

## Troubleshooting

If you get "Missing Supabase configuration" errors:

1. Check that your `.env` file exists in the root directory
2. Verify the variable names are exactly: `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. Run `npm run env:check` to validate your setup
4. Restart your development server after making changes to `.env`