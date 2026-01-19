# Google One‑Tap setup (Scoreboard Manager)

This file describes how to enable and test Google One‑Tap sign‑in locally and in production.

## Requirements

- Google Cloud OAuth client configured with your app's **Authorized JavaScript origins** and **Authorized redirect URIs**. For local dev you should have `http://localhost:5000` in the origins list and `http://localhost:5000/auth/callback` in redirect URIs.
- Supabase: Google provider enabled and configured with the **Client ID** and **Client Secret** (enter the client id & secret in the Supabase dashboard under Authentication → Settings → External OAuth Providers).
- Environment variables set locally and in your hosting (Netlify) for the client id and any server secret.

## Google Cloud Console setup (step‑by‑step)

1. Go to the Google Cloud Console → APIs & Services → Credentials → Create Credentials → OAuth client ID.
2. Choose **Web application**.
3. Set a descriptive name (e.g., "Scoreboard Manager - Web Client").
4. Under **Authorized JavaScript origins** add each origin where your app will run (examples):
   - `http://localhost:5000` (local dev)
   - `https://your-production-domain.com`
   - Any preview domains you use for Deploy Previews (e.g., `https://deploy-preview-<id>--your-site.netlify.app`) — add each preview origin explicitly.
5. Under **Authorized redirect URIs** add the callback path used by the app-hosted OAuth exchange (examples):
   - `http://localhost:5000/auth/callback`
   - `https://your-production-domain.com/auth/callback`
   - Add preview callback URIs as needed.
6. Save and copy the **Client ID** and **Client secret** to set in your environment and in the Supabase dashboard (Client ID is public; Client secret is server-only).
7. OAuth consent screen: ensure the app has a **Support email** configured and the app is published (or add any test users required while in testing mode).

Notes:
- Google does not support wildcard domains in Authorized redirect URIs; add each preview origin separately if you want One‑Tap/redirects to work on preview builds.
- If you forget to add a preview origin, you may see `redirect_uri_mismatch` or the One‑Tap prompt will not initialize on that origin.

## Environment variables

Add to `.env.local` (local testing):

```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-google-client-id>
# Optional (used for local Supabase config):
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET=<your-google-client-secret>
```

In Netlify (or your hosting provider) add the same variables (do NOT expose the secret as NEXT_PUBLIC_*).

## How it works in this app

- We initialize Google One‑Tap using `google.accounts.id.initialize` with a SHA‑256 hashed nonce (hashedNonce). The unhashed nonce is passed to `supabase.auth.signInWithIdToken` to validate the token.
- The app injects the One‑Tap script (`https://accounts.google.com/gsi/client`) and calls the One‑Tap callback that sends the returned credential to Supabase using `signInWithIdToken`.

## Local testing

1. Ensure `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is in your `.env.local`.
2. Run the app: `npm run dev` (the dev server runs on port **5000**).
3. Visit `http://localhost:5000/login` and either:
   - Wait for the One‑Tap prompt, or
   - Click the **Sign in with Google** button (the app now uses Google Identity Services to show the consent prompt tied to your origin when possible).
4. Complete consent; you should be redirected to `/auth/callback` and then to the Dashboard if successful.

### GSI popup button behavior

- When `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is configured and the Google Identity Services script loads successfully, the **Sign in with Google** button will use the GSI ID‑token flow (popup/prompt) and call `supabase.auth.signInWithIdToken` under the hood. This will show your site's origin on the Google consent screen and does **not** return a refresh token (short‑lived ID token only).
- If the GSI script isn't available or initialization fails, the button falls back to the app-hosted OAuth redirect (PKCE) using Supabase. If you want refresh tokens, configure the Google client secret in Supabase and use the PKCE/code exchange (Supabase handles refresh tokens when available).

### Where One‑Tap shows

- **One‑Tap is only shown on the Login page** by default. It is intentionally **hidden on the Register page** to make the sign-up flow explicit and less surprising to users. The Register page shows an explicit **Create account with Google** button below the manual sign-up form.

### Content Security Policy (CSP) requirements

- If your deployment sets a Content Security Policy, ensure external Google scripts are allowed. Add `https://accounts.google.com` to your `script-src` directive (and `script-src-elem` if you use it explicitly). Example:

  ```
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com; ...
  ```

- On Next.js, we set this in `next.config.mjs` headers; on other platforms, configure your platform-specific headers or reverse proxy to allow the Google script. After updating CSP, redeploy so the script can load and One‑Tap/GSI popup will work on your site.

### Netlify CSP Headers (Repo-Level Configuration)

This repository includes a **repo-level Netlify headers configuration** in `netlify.toml` to ensure Google Identity Services (GSI) work correctly on deploy previews and production. The CSP header includes `https://accounts.google.com` in the following directives:

- **script-src**: Allows GSI JavaScript to load
- **style-src**: Allows GSI inline styles and stylesheets
- **connect-src**: Allows GSI fedcm/status API calls

**Current CSP configuration in netlify.toml:**

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accounts.google.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://images.unsplash.com https://images.pexels.com https://images.pixabay.com https://*.supabase.co; frame-ancestors 'self'; base-uri 'self'; form-action 'self'"
```

**After updating CSP headers:**

If you modify the CSP configuration in `netlify.toml`, you must **"Clear cache & deploy"** in Netlify for the changes to take effect:

1. Go to your Netlify dashboard → Site → Deploys
2. Click "Trigger deploy" → "Clear cache and deploy site"
3. Wait for the deploy to complete
4. Verify the headers by running: `curl -I https://your-site.netlify.app/login`
5. Check that the `Content-Security-Policy` header includes `https://accounts.google.com` in script-src, style-src, and connect-src


## Troubleshooting

- If the One‑Tap prompt does not show, check the browser console for errors. One common issue is missing or mismatched Client ID.
- If you see `redirect_uri_mismatch`, verify the exact redirect URIs in the Google Cloud Console.
- If One‑Tap fails silently, try the fallback `Sign in with Google` button to ensure the OAuth flow works.
- If you complete Google consent and are redirected back to the site but nothing happens (for example, the URL looks like `/login?error=auth_callback_error#access_token=...`), this usually means the provider returned tokens in the URL fragment (implicit flow) instead of a server-side `code`.
  - Confirm the Google provider is fully configured in the **Supabase** dashboard (Client ID and **Client secret**) so Supabase can perform a server-side code exchange (PKCE). If the secret is missing, some flows may return tokens in the fragment instead of using the code exchange.
  - The app now includes a client-side fallback that will process fragment tokens and set the session. If you still see issues after configuring Supabase and redeploying, collect the full redirect URL and browser console/network logs and file an issue or share them here for debugging.

## Security notes

- The nonce is generated per-session and hashed before sending to Google. This prevents replay attacks.
- Keep Google client secrets and Supabase service keys out of version control; use Netlify / secret manager.

## Controlling One‑Tap (enablement options)

The app uses an **explicit flag** approach (recommended): One‑Tap will only initialize when both of the following are true:

- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set (non-empty)
- `NEXT_PUBLIC_ENABLE_GOOGLE_ONE_TAP` is set to the string `true`

Notes and recommendations:

- **Enable in Netlify**: Set `NEXT_PUBLIC_ENABLE_GOOGLE_ONE_TAP=true` in the contexts where you want One‑Tap active (Production, Deploy Previews, Branch deploys, Preview Server). See `docs/netlify-env-vars.md` for a table and guidance.
- **Local testing**: Add `NEXT_PUBLIC_ENABLE_GOOGLE_ONE_TAP=true` to your `.env.local` to test One‑Tap locally. You can still use the `Sign in with Google` button regardless of the flag.
- **Rollouts**: If you want staged rollouts, consider using a remote feature flag service and read the flag in the client before initializing One‑Tap.

This explicit approach prevents accidental One‑Tap activation in environments where you haven't configured origins or client IDs properly.

---

If you'd like, I can add a short section to the project README or link this doc from `docs/supabase-manual-setup.md`.