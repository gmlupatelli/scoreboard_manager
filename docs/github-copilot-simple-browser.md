# GitHub Copilot Simple Browser Configuration

## Overview
This document explains how the Scoreboard Manager application supports GitHub Copilot's Simple Browser feature while maintaining security in production.

## Problem Statement
The application uses `@dhiwise/component-tagger` to add data attributes to UI components, enabling GitHub Copilot to identify and reference specific UI elements. However, GitHub Copilot's Simple Browser displays the application in an iframe, which was blocked by the application's Content Security Policy (CSP) headers.

## Solution
The application now uses **environment-aware CSP configuration** that:
- **Allows iframe embedding in development mode** (for Copilot Simple Browser)
- **Blocks unauthorized iframe embedding in production** (for security)

## Technical Implementation

### Configuration Location
The CSP configuration is in `next.config.mjs` within the `headers()` function.

### Development Mode
When `NODE_ENV === 'development'`:
- **CSP**: `frame-ancestors *` (allows any origin to embed the page)
- **X-Frame-Options**: Not set (allowing iframe embedding)

This allows GitHub Copilot Simple Browser to load the application in an iframe and select UI elements.

### Production Mode
When `NODE_ENV === 'production'`:
- **CSP**: `frame-ancestors 'self'` (only same-origin can embed)
- **X-Frame-Options**: `SAMEORIGIN` (legacy browser support)

This prevents clickjacking attacks and unauthorized embedding.

### Embed Routes
Routes matching `/embed/*` always allow iframe embedding in all environments:
- **CSP**: `frame-ancestors *`
- Used for embeddable scoreboards that need to be displayed on external sites

## How It Works

### Code Structure
```javascript
async headers() {
  // Detect environment
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Build CSP header with conditional frame-ancestors
  const cspHeader = [
    // ... other directives ...
    isDevelopment ? 'frame-ancestors *' : "frame-ancestors 'self'",
  ].join('; ');
  
  return [
    // Main pages use environment-aware CSP
    {
      source: '/:path*',
      headers: [
        { key: 'Content-Security-Policy', value: cspHeader },
        // X-Frame-Options only in production
        ...(isDevelopment ? [] : [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' }
        ]),
      ],
    },
    // Embed routes always allow framing
    {
      source: '/embed/:path*',
      headers: [
        { key: 'Content-Security-Policy', value: cspHeaderEmbeddable },
      ],
    },
  ];
}
```

## Security Considerations

### Why This is Safe

1. **Development-Only Relaxation**: The permissive CSP only applies when `NODE_ENV=development`, which is never true in production deployments.

2. **Production Security Maintained**: Production builds automatically use strict CSP with `frame-ancestors 'self'` and `X-Frame-Options: SAMEORIGIN`.

3. **Explicit Embed Routes**: Routes that need to be embeddable (`/embed/*`) are explicitly configured regardless of environment.

4. **No User Data Exposure**: GitHub Copilot Simple Browser only displays the UI for reference; it doesn't execute actions or access user data.

### Attack Vectors Prevented

In production, the strict CSP prevents:
- **Clickjacking**: Malicious sites can't embed the application to trick users
- **UI Redressing**: Attackers can't overlay deceptive UI elements
- **Phishing**: The application can't be embedded in fake login pages

## Usage with GitHub Copilot

### Prerequisites
1. Install `@dhiwise/component-tagger` package (already included)
2. Configure webpack to use the component tagger loader (already configured)
3. Run the application in development mode: `npm run dev`

### How to Select UI Elements
1. Open GitHub Copilot chat
2. Use Simple Browser to navigate to your local application (e.g., http://localhost:5000)
3. The application will load in an iframe
4. Select UI elements in the browser view
5. Copilot can now reference specific components by their data attributes

### Example
When you click on a button in Simple Browser, Copilot can see:
```html
<button data-component-id="submit-button-123" class="...">
  Submit
</button>
```

This allows Copilot to make precise suggestions about specific UI components.

## Testing

### Verify Development Configuration
```bash
# Start dev server
NODE_ENV=development npm run dev

# Check headers (in another terminal)
curl -I http://localhost:5000/ | grep -i "frame-ancestors"
# Should show: frame-ancestors *
```

### Verify Production Configuration
```bash
# Build and start production server
NODE_ENV=production npm run build
NODE_ENV=production npm run start

# Check headers (in another terminal)
curl -I http://localhost:5000/ | grep -i "frame-ancestors"
# Should show: frame-ancestors 'self'

curl -I http://localhost:5000/ | grep -i "x-frame-options"
# Should show: X-Frame-Options: SAMEORIGIN
```

### Automated Test
A test script is available to verify the configuration:
```javascript
// test-headers.mjs
import nextConfig from './next.config.mjs';

async function testHeaders() {
  // Test development
  process.env.NODE_ENV = 'development';
  const devHeaders = await nextConfig.headers();
  // ... verify frame-ancestors * ...
  
  // Test production
  process.env.NODE_ENV = 'production';
  const prodHeaders = await nextConfig.headers();
  // ... verify frame-ancestors 'self' ...
}
```

## Deployment

### Netlify
Netlify automatically sets `NODE_ENV=production` for production builds, so the strict CSP is automatically applied.

### Replit
Replit deployments should set `NODE_ENV=production` in the environment variables to ensure strict CSP.

### Local Development
Run with `npm run dev` which uses development mode by default.

## Troubleshooting

### Simple Browser Shows "Refused to Connect"
- Ensure you're running in development mode: `NODE_ENV=development npm run dev`
- Check that the CSP header includes `frame-ancestors *`
- Verify the dev server is accessible at the URL you're using

### Production Site Can Be Embedded
- Check that `NODE_ENV=production` is set in your deployment
- Verify headers using browser DevTools Network tab
- Ensure Next.js is using the production configuration

### Component Tags Not Showing
- Verify `@dhiwise/component-tagger` is installed
- Check webpack configuration in `next.config.mjs`
- Ensure the tagger loader is processing `.tsx` files

## Related Files
- `next.config.mjs` - CSP header configuration
- `package.json` - Lists `@dhiwise/component-tagger` dependency
- `README.md` - Project documentation with security notes

## Further Reading
- [Content Security Policy (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [X-Frame-Options (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options)
- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [Next.js Custom Headers](https://nextjs.org/docs/app/api-reference/next-config-js/headers)
