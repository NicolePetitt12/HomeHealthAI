# Testing & Quality

## Edge Function Tests

### Test analyze-scan locally

With `supabase start` running, serve functions and send a test request:

```bash
cd apps/backend
npx supabase functions serve
```

In another terminal:
```bash
# Get the service role key
cd apps/backend && npx supabase status

# Send a test scan payload
curl -X POST http://127.0.0.1:54321/functions/v1/analyze-scan \
  -H "Authorization: Bearer <service_role_key>" \
  -H "Content-Type: application/json" \
  -d '{
    "record": {
      "id": "00000000-0000-0000-0000-000000000099",
      "user_id": "00000000-0000-0000-0000-000000000001",
      "location": "Basement - West Wall",
      "image_path": "test/image.jpg",
      "notes": null,
      "status": "pending"
    }
  }'
```

Expected response: `{"success": true, "scanId": "..."}` and a new row in `analysis_results`.

Verify in Supabase Studio (`http://127.0.0.1:54323`) or:
```bash
cd apps/backend
npx supabase db query "SELECT * FROM analysis_results ORDER BY created_at DESC LIMIT 1;"
```

## Type Checking

### Shared package

```bash
cd packages/shared
npx tsc --noEmit
```

### Mobile

The mobile app does not emit files — type checking is the build step:

```bash
cd apps/mobile
npm run build   # runs tsc --noEmit
```

### All packages (via Turborepo)

```bash
npm run build   # from workspace root
```

Turborepo builds packages in the correct order (shared → mobile).

## Linting

### All packages

```bash
npm run lint    # from workspace root
```

### Single package

```bash
cd apps/mobile && npm run lint
cd packages/shared && npm run lint
```

## Formatting

### Check formatting (no writes)

```bash
npm run format:check
```

### Fix formatting

```bash
npm run format
```

Prettier rules (in `.prettierrc`):
- Single quotes
- Trailing commas
- Semicolons
- Print width: 100
- Tab width: 2
