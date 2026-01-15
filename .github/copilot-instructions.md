# GitHub Copilot Instructions for Scoreboard Manager

## Project Overview
- **Project Name**: Scoreboard Manager
- **Framework**: Next.js 14 with App Router
- **Backend**: Supabase (PostgreSQL + Real-time subscriptions)
- **Styling**: Tailwind CSS with custom utilities
- **Language**: TypeScript (strict mode)
- **Authentication**: Supabase Auth
- **State Management**: React Context (AuthContext only)

---

## Naming Conventions

### Variables & Functions
- ✅ **camelCase** for all variables, functions, and properties
  ```typescript
  const scoreboardData = [];
  const handleSubmit = () => {};
  const isLoading = true;
  const hasMore = false;
  ```

### Boolean Variables
- ✅ **Prefix with `is`, `has`, or `can`**
  ```typescript
  const isLoading = false;
  const isSubmitting = false;
  const hasMore = true;
  const canEdit = true;
  ```

### Components
- ✅ **PascalCase** for React components
  ```typescript
  function ScoreboardHeader() {}
  function CreateScoreboardModal() {}
  function EntryRow() {}
  ```

### Interfaces & Types
- ✅ **PascalCase** for all interfaces and types
- ✅ **Props interfaces** follow pattern: `{ComponentName}Props`
  ```typescript
  interface ScoreboardHeaderProps {
    title: string;
    description: string;
  }
  
  interface User {
    id: string;
    email: string;
  }
  
  type ScoreType = 'number' | 'time';
  ```

### Constants
- ✅ **SCREAMING_SNAKE_CASE** for constants
  ```typescript
  const DEFAULT_PAGE_SIZE = 30;
  const MAX_TITLE_LENGTH = 100;
  const STYLE_PRESETS = [...];
  ```

### Database & API Types
- ✅ **PascalCase** for type definitions
  ```typescript
  type ScoreboardRow = Database['public']['Tables']['scoreboards']['Row'];
  type ScoreboardInsert = Database['public']['Tables']['scoreboards']['Insert'];
  ```

### Service Objects
- ✅ **camelCase** for exported service objects
  ```typescript
  export const scoreboardService = { ... };
  export const profileService = { ... };
  ```

---

## File Naming Conventions

### Components
- ✅ **PascalCase.tsx** for component files
  ```
  Header.tsx
  CreateScoreboardModal.tsx
  EntryRow.tsx
  ```

### Pages (Next.js App Router)
- ✅ **lowercase-with-hyphens** for page directories
- ✅ **page.tsx** for route pages
  ```
  scoreboard-management/page.tsx
  individual-scoreboard-view/page.tsx
  accept-invite/page.tsx
  ```

### Utilities
- ✅ **camelCase.ts** for utility files
  ```
  timeUtils.ts
  stylePresets.ts
  localStorage.ts
  ```

### Services
- ✅ **camelCase.ts** with "Service" suffix
  ```
  scoreboardService.ts
  profileService.ts
  ```

### API Routes
- ✅ **route.ts** for API endpoints
  ```
  api/scoreboards/route.ts
  api/scoreboards/[id]/route.ts
  api/invitations/accept/route.ts
  ```

---

## Import Organization

### Import Order
1. React/Next.js imports
2. Third-party libraries
3. Internal components (using `@/` alias)
4. Types/interfaces
5. Utilities
6. Services

### Example
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { scoreboardService } from '@/services/scoreboardService';
import { Scoreboard, ScoreboardEntry } from '@/types/models';
import SearchInterface from '@/components/common/SearchInterface';
import Icon from '@/components/ui/AppIcon';
import { formatScoreDisplay } from '@/utils/timeUtils';
```

### Path Aliases
- ✅ **Always use `@/` alias** for imports from `src/`
- ❌ **Avoid relative imports** like `../../` when possible
  ```typescript
  // Good
  import { useAuth } from '@/contexts/AuthContext';
  import Header from '@/components/common/Header';
  
  // Avoid when possible
  import { useAuth } from '../../../contexts/AuthContext';
  ```

### React Imports
- ✅ **Don't import React** unless using specific React APIs
- ✅ **Import only what you need** from 'react'
  ```typescript
  // Good
  import { useState, useEffect } from 'react';
  
  // Bad (unnecessary in Next.js 13+)
  import React from 'react';
  ```

---

## Component Patterns

### Standard Component Structure
```typescript
'use client'; // If client component

import { useState } from 'react';
// ... other imports

interface ComponentNameProps {
  prop1: string;
  prop2: number;
  onAction?: () => void;
}

export default function ComponentName({ prop1, prop2, onAction }: ComponentNameProps) {
  const [state, setState] = useState(initial);
  
  const handleAction = () => {
    // logic
  };
  
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### Component Declaration
- ✅ **Use standard function declarations** with `export default function`
- ❌ **Never use `React.FC`** or `const Component = () => {}`
  ```typescript
  // Good
  export default function MyComponent({ title }: MyComponentProps) {
    return <div>{title}</div>;
  }
  
  // Bad
  const MyComponent: React.FC<MyComponentProps> = ({ title }) => {
    return <div>{title}</div>;
  };
  export default MyComponent;
  ```

### Client vs Server Components
- ✅ **Add `'use client';`** only when needed:
  - Using React hooks (useState, useEffect, etc.)
  - Using browser APIs
  - Event handlers
  - Context consumers
- ✅ **Default to Server Components** for:
  - Static content
  - Data fetching at page level
  - SEO-critical pages

---

## State Management

### Local State
```typescript
// useState pattern
const [data, setData] = useState<DataType[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### Global State
- ✅ **Use AuthContext for auth state only**
  ```typescript
  const { user, profile, isLoading, signIn, signOut } = useAuth();
  ```
- ✅ **No Redux or other state management libraries**
- ✅ **Keep state local when possible**

### Effect Hooks
- ✅ **Always include dependency arrays**
- ✅ **Use cleanup functions** for subscriptions/timers
  ```typescript
  useEffect(() => {
    const channel = supabase.channel('scoreboard').subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [scoreboardId]);
  ```

---

## Custom Hooks

The project includes several custom hooks located in `src/hooks/`. Import them from `@/hooks`.

### useAuthGuard
Centralized authentication guard with role-based access control. Prevents redirect loops with internal tracking.

```typescript
import { useAuthGuard } from '@/hooks';

// Basic auth guard (redirects to login if not authenticated)
const { isAuthorized, isChecking, user, userProfile, getAuthHeaders } = useAuthGuard();

// Role-based guard (redirects to dashboard if not admin)
const { isAuthorized, isChecking, getAuthHeaders } = useAuthGuard({ 
  requiredRole: 'system_admin' 
});

// Usage
if (isChecking) return <LoadingSpinner />;
if (!isAuthorized) return null; // Will redirect automatically

// Get auth headers for API calls
const headers = await getAuthHeaders();
```

**When to use:**
- ✅ Protecting pages that require authentication
- ✅ Role-based page access (admin pages)
- ✅ Getting auth headers for API requests

**What it provides:**
- `isAuthorized`: boolean - true when user has required access
- `isChecking`: boolean - true during auth check
- `user`: Supabase User object or null
- `userProfile`: User profile with role or null
- `getAuthHeaders`: async function returning `{ Authorization: string }`

### useAbortableFetch
Wrapper around fetch that automatically handles AbortController. Cancels in-flight requests on unmount.

```typescript
import { useAbortableFetch } from '@/hooks';

const { execute, abort, abortAll } = useAbortableFetch();

// Make a request with a unique key for tracking
const response = await execute('/api/data', {
  method: 'POST',
  headers: await getAuthHeaders(),
  body: JSON.stringify(data),
}, 'my-request-key');

// Returns null if aborted, otherwise the Response
if (response && response.ok) {
  const data = await response.json();
}

// Manually abort a specific request
abort('my-request-key');

// Abort all pending requests
abortAll();
```

**When to use:**
- ✅ Any fetch call in a component that might unmount
- ✅ Search/filter requests that may be superseded
- ✅ Preventing state updates after unmount

### useTimeoutRef
Safe setTimeout wrapper with automatic cleanup on unmount. Tracks mount state.

```typescript
import { useTimeoutRef } from '@/hooks';

const { set: setTimeoutSafe, clear, clearAll, isMounted } = useTimeoutRef();

// Set a timeout with a unique key
setTimeoutSafe(() => {
  if (isMounted()) {
    setSuccess('Operation complete!');
  }
}, 3000, 'success-message');

// Clear a specific timeout
clear('success-message');

// Clear all timeouts
clearAll();

// Check mount state before state updates in async callbacks
const handleAsync = async () => {
  const result = await someAsyncOp();
  if (isMounted()) {
    setData(result);
  }
};
```

**When to use:**
- ✅ Delayed redirects after success/error messages
- ✅ Auto-clearing toast/error messages
- ✅ Any setTimeout in a component
- ✅ Checking mount state in async callbacks

### Other Hooks

- **useInfiniteScroll**: IntersectionObserver-based infinite scroll
- **useUndoQueue**: Undo queue with toast notifications

---

## Service Layer Pattern

### Service Structure
```typescript
export const resourceService = {
  async getResource(id: string) {
    try {
      const { data, error } = await supabase
        .from('table_name')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data: data ?? null, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: 'User-friendly error message' 
      };
    }
  },
  
  async createResource(resource: ResourceInsert) {
    try {
      const { data, error } = await supabase
        .from('table_name')
        .insert(resource)
        .select()
        .single();
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data: data ?? null, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: 'Failed to create resource. Please try again.' 
      };
    }
  }
};
```

### Service Rules
- ✅ **Return `{ data, error }` objects**, never throw exceptions
- ✅ **Always check error before using data**
- ✅ **Use `.single()` for single records**, not array access
- ✅ **Provide user-friendly error messages**
- ✅ **Return null for data when error occurs**

---

## API Route Pattern

### Shared API Client Utilities
The project uses shared utility functions in `src/lib/supabase/apiClient.ts`:

```typescript
import { getAuthClient, getServiceRoleClient, extractBearerToken } from '@/lib/supabase/apiClient';

// getAuthClient(token) - Creates client authenticated with user's JWT
// getServiceRoleClient() - Creates admin client (returns null if key not configured)
// extractBearerToken(authHeader) - Extracts token from Authorization header
```

### Standard API Route Structure
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, getServiceRoleClient, extractBearerToken } from '@/lib/supabase/apiClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // 1. Extract and validate token
    const token = extractBearerToken(request.headers.get('Authorization'));
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // 2. Get authenticated user
    const authClient = getAuthClient(token);
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // 3. Parse request body
    const body = await request.json();
    
    // 4. Validate input
    if (!body.required_field) {
      return NextResponse.json(
        { error: 'Missing required field' },
        { status: 400 }
      );
    }
    
    // 5. Process request (use serviceClient for admin operations)
    const serviceClient = getServiceRoleClient();
    const dbClient = serviceClient || authClient;
    
    const { data, error } = await dbClient
      .from('table_name')
      .insert({ ...body, owner_id: user.id })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    // 6. Return success
    return NextResponse.json({ data }, { status: 201 });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### API Route Rules
- ✅ **Always export `dynamic = 'force-dynamic'`** for API routes
- ✅ **Validate Authorization header** before processing
- ✅ **Use service role client** only for system admin operations
- ✅ **Return proper HTTP status codes**
- ✅ **Validate input before processing**
- ✅ **Handle errors gracefully** with try/catch

---

## Error Handling

### In Services
```typescript
// Always return { data, error } objects
try {
  const { data, error } = await supabase.from('table').select();
  if (error) {
    return { data: null, error: error.message };
  }
  return { data: data ?? null, error: null };
} catch (error) {
  return { data: null, error: 'User-friendly error message' };
}
```

### In Components
```typescript
// Use try/catch for async operations
const handleSubmit = async () => {
  setIsSubmitting(true);
  setError(null);
  
  try {
    const { data, error } = await scoreboardService.create(formData);
    if (error) {
      setError(error);
      return;
    }
    
    // Success handling
    router.push('/dashboard');
  } catch (err) {
    setError('An unexpected error occurred. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};
```

### Error Display
- ✅ **Set error state** for UI display
- ✅ **Show user-friendly messages**
- ✅ **Use ErrorBoundary** for React component errors
- ✅ **Keep console.error minimal** (only in ErrorBoundary and localStorage utils)

---

## Database Queries

### Query Pattern
```typescript
// Always destructure { data, error }
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column', value)
  .single(); // Use .single() for one record

// Check error first
if (error) {
  return { data: null, error: error.message };
}

// Use nullish coalescing
return { data: data ?? null, error: null };
```

### Type Safety
```typescript
// Apply database types
type ScoreboardRow = Database['public']['Tables']['scoreboards']['Row'];

// Type assertion for optional columns
const customStyles = scoreboard.custom_styles as ScoreboardCustomStyles | null;
```

### Real-time Subscriptions
```typescript
const channel = supabase
  .channel(`realtime-scoreboard-${scoreboardId}`)
  .on('postgres_changes', 
    { 
      event: '*', 
      schema: 'public', 
      table: 'scoreboard_entries',
      filter: `scoreboard_id=eq.${scoreboardId}`
    }, 
    handleChange
  )
  .subscribe();

// Cleanup
return () => {
  supabase.removeChannel(channel);
};
```

### Database Rules
- ✅ **Always destructure `{ data, error }`**
- ✅ **Check error before using data**
- ✅ **Use `.single()` for single records**
- ✅ **Clean up subscriptions** in useEffect cleanup
- ✅ **Transform snake_case to camelCase** for application models

---

## Styling

### Tailwind Usage
- ✅ **Use Tailwind utility classes**
  ```tsx
  <div className="bg-surface border border-border rounded-lg p-6">
  ```

### Custom Utilities
- ✅ **Use predefined utilities** from `tailwind.css`
  ```tsx
  className="elevation-1 hover-lift transition-smooth"
  ```
  - `elevation-1`, `elevation-2`, `elevation-3` - Box shadows
  - `hover-lift` - Slight elevation on hover
  - `transition-smooth` - Smooth transitions

### Style Customization
- ✅ **Use ScoreboardCustomStyles interface** for user customization
- ✅ **Apply inline styles only for user-customized colors**
  ```tsx
  style={{ 
    backgroundColor: customStyles?.backgroundColor,
    color: customStyles?.textColor 
  }}
  ```

### Styling Rules
- ❌ **Never use inline styles** except for user-customized colors
- ✅ **Use CSS variables** from `index.css` for theming
- ✅ **Keep responsive design** with Tailwind breakpoints (sm:, md:, lg:)

### "Tips" Info Boxes
- ✅ **Use gray theme** for tips and helpful information
- ✅ **Use bullet list format** with `<ul>` and `<li>` elements
- ✅ **Include InformationCircleIcon** as the indicator
- ✅ **Title must start with "Tips"** (e.g., "Tips for best results", "Tips for styling")

```tsx
<div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
  <div className="flex gap-3">
    <Icon
      name="InformationCircleIcon"
      size={20}
      className="text-gray-600 flex-shrink-0 mt-0.5"
    />
    <div className="text-sm text-gray-700">
      <p className="font-medium mb-1">Tips for [context]</p>
      <ul className="list-disc list-inside space-y-1 text-gray-600">
        <li>First tip</li>
        <li>Second tip</li>
        <li>Third tip</li>
      </ul>
    </div>
  </div>
</div>
```

### "How To" Info Boxes
- ✅ **Use amber theme** for step-by-step instructional content
- ✅ **Use numbered list format** with `<ol>` and `<li>` elements
- ✅ **Include LightBulbIcon** as the indicator
- ✅ **Title must start with "How to"** (e.g., "How to embed your scoreboard")

```tsx
<div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
  <div className="flex gap-3">
    <Icon
      name="LightBulbIcon"
      size={20}
      className="text-amber-600 flex-shrink-0 mt-0.5"
    />
    <div className="text-sm text-amber-800">
      <p className="font-medium mb-1">How to [do something]</p>
      <ol className="list-decimal list-inside space-y-1">
        <li>First step</li>
        <li>Second step</li>
        <li>Third step</li>
      </ol>
    </div>
  </div>
</div>
```

### CSS Variable Opacity Limitation

**CRITICAL**: Tailwind opacity modifiers (`/10`, `/20`, `/90`) do **NOT** work with CSS variable colors.

```tsx
// ❌ BROKEN - CSS variables don't support opacity modifiers
className="bg-primary/10"      // Renders nothing
className="hover:bg-primary/20" // Hover won't work
className="bg-warning/10"       // Renders nothing

// ✅ WORKING - Use standard Tailwind colors with opacity
className="bg-red-600/10"       // Works correctly
className="hover:bg-red-600/20" // Hover works
className="bg-yellow-500/10"    // Works correctly
```

#### Color Mapping Reference
| CSS Variable | Standard Tailwind Equivalent |
|--------------|------------------------------|
| `primary` (#c43e41) | `red-600` or `red-700` |
| `secondary` (#eba977) | `orange-600` or `orange-900` |
| `warning` | `yellow-500` |
| `success` | `green-500` |
| `destructive` | `red-500` |
| `accent` | `amber-600` |

### Button Patterns
- ✅ **Primary buttons** - For main actions (Submit, Save, Create)
- ✅ **Secondary action buttons** - For copy/utility actions (Copy URL, Copy Code)
- ✅ **Preview/navigation buttons** - For opening links/previews

#### Primary Buttons (Solid)
```tsx
<button className="px-4 py-2 bg-primary text-white rounded-md font-medium text-sm hover:bg-red-700">
  Save Changes
</button>
```

#### Secondary Action Buttons (Copy URL, Copy Code)
- ✅ **Use `text-orange-900`** for text color (no background)
- ✅ **Use `hover:bg-orange-900/10`** for hover state only
- ❌ **Never use `text-secondary`** (#eba977) - poor contrast on white

```tsx
<button className="px-4 py-2 text-orange-900 rounded-md font-medium text-sm hover:bg-orange-900/10 flex items-center gap-2">
  <Icon name="ClipboardDocumentIcon" size={16} />
  Copy URL
</button>
```

#### Preview/Navigation Buttons
```tsx
<button className="px-4 py-2 text-primary rounded-md font-medium text-sm hover:bg-red-600/10 transition-colors duration-150 flex items-center gap-2">
  <Icon name="ArrowTopRightOnSquareIcon" size={16} />
  Preview
</button>
```

#### Button Color Reference
| Button Type | Background | Text Color | Hover |
|-------------|------------|------------|-------|
| Primary (solid) | `bg-primary` | `text-white` | `hover:bg-red-700` |
| Primary (ghost) | (none) | `text-primary` | `hover:bg-red-600/10` |
| Secondary action | (none) | `text-orange-900` | `hover:bg-orange-900/10` |
| Danger | `bg-red-600` | `text-white` | `hover:bg-red-700` |

#### Button Requirements
- ✅ **All buttons must have hover states** - Use appropriate hover classes
- ✅ **All buttons must have tooltips** - Use `title` attribute for accessibility
- ✅ **Include transition classes** - Use `transition-colors duration-150` for smooth hover effects

```tsx
// Example: Complete button with all requirements
<button
  onClick={handleAction}
  className="px-4 py-2 text-primary rounded-md font-medium text-sm hover:bg-red-600/10 transition-colors duration-150 flex items-center gap-2"
  title="Descriptive tooltip for accessibility"
>
  <Icon name="IconName" size={16} />
  <span>Button Text</span>
</button>
```

#### Disabled Button States
- ✅ **Always include `disabled:opacity-50 disabled:cursor-not-allowed`** for visual feedback
- ✅ **Prevent hover color change** on disabled buttons with `disabled:hover:bg-*` classes
- ✅ **Ghost buttons**: Use `disabled:hover:bg-transparent` to maintain transparent background
- ✅ **Solid buttons**: Use `disabled:hover:bg-{same-as-default}` to maintain original background

```tsx
// Ghost button (transparent background)
<button
  disabled={isLoading}
  className="px-4 py-2 text-primary hover:bg-red-600/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
>
  Cancel
</button>

// Solid button (colored background)
<button
  disabled={isLoading}
  className="px-4 py-2 bg-primary text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
>
  Save
</button>

// Muted background button
<button
  disabled={isLoading}
  className="px-4 py-2 bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-muted"
>
  Cancel
</button>
```

| Button Type | Disabled Hover Class |
|-------------|---------------------|
| Ghost (no bg) | `disabled:hover:bg-transparent` |
| Primary solid | `disabled:hover:bg-primary` |
| Muted solid | `disabled:hover:bg-muted` |
| Blue solid | `disabled:hover:bg-blue-600` |

#### Status Badge Colors
```tsx
// Use standard Tailwind colors for status badges
const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-500/10 text-warning';
    case 'accepted':
      return 'bg-green-500/10 text-success';
    case 'expired':
      return 'bg-muted text-text-secondary';
    case 'cancelled':
      return 'bg-red-500/10 text-destructive';
    default:
      return 'bg-muted text-text-secondary';
  }
};
```

---

## Page Structure (Next.js App Router)

### Page Organization
```
src/app/
  layout.tsx                    # Root layout with AuthProvider
  page.tsx                      # Landing page (server component)
  providers.tsx                 # Client-side providers wrapper
  
  [feature]/
    page.tsx                    # Server component (default)
    components/
      *Interactive.tsx          # Main interactive client component
      *Modal.tsx               # Modal components
      ComponentName.tsx        # Other components
```

### Interactive Component Pattern
- ✅ **Create `*Interactive.tsx` components** for client-side logic
- ✅ **Keep page.tsx as server component** when possible
- ✅ **Pass data from page to interactive component**

Example:
```typescript
// page.tsx (Server Component)
export default function ScoreboardPage() {
  return <ScoreboardInteractive />;
}

// components/ScoreboardInteractive.tsx (Client Component)
'use client';

export default function ScoreboardInteractive() {
  const [data, setData] = useState([]);
  // ... all client-side logic
  return <div>{/* interactive UI */}</div>;
}
```

---

## Component Organization

### Three-Tier Structure

#### 1. `src/components/common/` - Shared Components
- SearchInterface
- Header
- Footer
- ErrorBoundary

#### 2. `src/components/ui/` - UI Primitives
- AppIcon
- ColorPicker
- Logo
- Button (if created)

### AppIcon Component - Adding New Icons

The `AppIcon` component (`src/components/ui/AppIcon.tsx`) centralizes all Heroicons usage. When you need to use an icon that isn't already in the component, you must add it to **four locations**:

1. **Outline import** - Add to the outline icons import block from `@heroicons/react/24/outline`
2. **Solid import** - Add to the solid icons import block from `@heroicons/react/24/solid` (with `Solid` suffix alias)
3. **outlineIcons map** - Add to the `outlineIcons` object mapping
4. **solidIcons map** - Add to the `solidIcons` object mapping

**Example - Adding `Cog6ToothIcon`:**
```typescript
// 1. Outline import
import {
  // ... existing icons
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

// 2. Solid import
import {
  // ... existing icons
  Cog6ToothIcon as Cog6ToothIconSolid,
} from '@heroicons/react/24/solid';

// 3. outlineIcons map
const outlineIcons: IconMap = {
  // ... existing icons
  Cog6ToothIcon,
};

// 4. solidIcons map
const solidIcons: IconMap = {
  // ... existing icons
  Cog6ToothIcon: Cog6ToothIconSolid,
};
```

**Usage:**
```tsx
<Icon name="Cog6ToothIcon" size={20} />
<Icon name="Cog6ToothIcon" size={20} variant="solid" />
```

⚠️ **If an icon shows as `QuestionMarkCircleIcon` (fallback), it means the icon name is not registered in the AppIcon component.**

#### 3. Page-Specific Components - Colocated with Pages
- `dashboard/components/`
- `scoreboard-management/components/`
- `individual-scoreboard-view/components/`

### When to Create Components
- ✅ **Create in `common/`** if used across multiple pages
- ✅ **Create in `ui/`** if it's a reusable UI primitive
- ✅ **Create in page folder** if only used in that feature
- ✅ **Colocate related components** with their parent feature

---

## TypeScript Patterns

### Type Definitions
```typescript
// Two-tier type system:
// 1. Database types (generated from Supabase)
type ScoreboardRow = Database['public']['Tables']['scoreboards']['Row'];

// 2. Application models (transformed from database)
interface Scoreboard {
  id: string;
  ownerId: string;  // camelCase instead of owner_id
  title: string;
  createdAt: string;
}
```

### Transformation Pattern
```typescript
// Convert database row to application model
const rowToScoreboard = (row: ScoreboardRow): Scoreboard => ({
  id: row.id,
  ownerId: row.owner_id,      // snake_case → camelCase
  title: row.title,
  createdAt: row.created_at,
  // ... more fields
});
```

### Type Assertion
```typescript
// For optional columns that may not exist in DB
const customStyles = row.custom_styles as ScoreboardCustomStyles | null;
```

### Avoiding `any` Types
- ❌ **Never use `any` type** - ESLint enforces `@typescript-eslint/no-explicit-any`
- ✅ **Use proper types** for all variables, parameters, and return values

#### Common Patterns to Replace `any`:

**1. Dynamic object access with `keyof`:**
```typescript
// Bad
const value = (obj as any)[key];

// Good
const getStyleValue = (key: keyof ScoreboardCustomStyles): string | undefined => {
  return customStyles[key] as string | undefined;
};
```

**2. Supabase insert/update operations:**
```typescript
// When Supabase types don't match, use `as never` for insert/update calls
const insertData: ScoreboardInsert = { ... };
const { data, error } = await supabase
  .from('scoreboards')
  .insert(insertData as never)  // Use `as never` to bypass Supabase type issues
  .select()
  .single();
```

**3. Event handlers with specific types:**
```typescript
// Bad
onChange={(e) => setValue(e.target.value as any)}

// Good - use union type
onChange={(e) => setValue(e.target.value as 'newest' | 'oldest' | 'title')}
```

**4. Component refs with proper types:**
```typescript
// Bad
ref={ref as any}

// Good - use proper Ref type
ref={ref as React.Ref<HTMLButtonElement>}
```

**5. Unused variables (prefix with underscore):**
```typescript
// Bad - triggers unused variable warning
} catch (error) {
  return { data: null, error: 'Failed' };
}

// Good - underscore prefix signals intentionally unused
} catch (_error) {
  return { data: null, error: 'Failed' };
}
```

**6. Icon/component props:**
```typescript
// Bad
<Icon name={icon as any} />

// Good - icon is already string type, no cast needed
<Icon name={icon} />
```

**7. Array/object with known structure:**
```typescript
// Bad
const items: any[] = [];

// Good - define interface
interface NavItem {
  label: string;
  path: string;
  icon: string;
}
const items: NavItem[] = [];
```

---

## Async/Await Patterns

### Always Use Async/Await
- ✅ **Never use raw Promise chains** (`.then()`, `.catch()`)
- ✅ **Always use try/catch** for error handling
  ```typescript
  // Good
  try {
    const result = await someAsyncFunction();
  } catch (error) {
    console.error(error);
  }
  
  // Bad
  someAsyncFunction()
    .then(result => {})
    .catch(error => {});
  ```

---

## Search & Pagination

### Server-Side Search
```typescript
const [searchQuery, setSearchQuery] = useState('');
const [debouncedSearch, setDebouncedSearch] = useState('');

// Debounce at 300ms
useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(searchQuery);
  }, 300);
  
  return () => clearTimeout(timer);
}, [searchQuery]);
```

### Infinite Scroll Pattern
```typescript
// Use custom hook
const { observerRef, hasMore } = useInfiniteScroll({
  onLoadMore: loadNextPage,
  hasMore: paginationResult.hasMore,
  isLoading: isLoading,
});

// Pagination result interface
interface PaginatedResult<T> {
  data: T[] | null;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
}
```

### Pagination Rules
- ✅ **Server-side search** - send query to backend
- ✅ **Debounce search input** at 300ms
- ✅ **Use IntersectionObserver** for infinite scroll
- ✅ **Default page size**: 30 items

---

## Common Patterns

### Loading States
```typescript
const [isLoading, setIsLoading] = useState(true);

if (isLoading) {
  return <LoadingSkeleton />;
}
```

### Empty States
```typescript
if (!data || data.length === 0) {
  return <EmptyState searchQuery={searchQuery} />;
}
```

### Error States
```typescript
if (error) {
  return <ErrorDisplay message={error} onRetry={handleRetry} />;
}
```

### Modal Pattern
```typescript
const [isModalOpen, setIsModalOpen] = useState(false);

const handleOpenModal = () => setIsModalOpen(true);
const handleCloseModal = () => setIsModalOpen(false);

return (
  <>
    <button onClick={handleOpenModal}>Open</button>
    {isModalOpen && <Modal onClose={handleCloseModal} />}
  </>
);
```

---

## Documentation

### Comment Style
```typescript
/**
 * Get user profile by user ID
 */
async getProfile(userId: string) { ... }

// Helper function to convert database row to application model
const rowToModel = (row: Row): Model => { ... };
```

### When to Comment
- ✅ **Add JSDoc comments** to exported functions
- ✅ **Explain complex logic** with inline comments
- ✅ **Document type assertions** when needed
- ❌ **Don't over-comment** obvious code

---

## Environment Variables

### Required Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-secret-key
```

### Usage
```typescript
// Client-side (NEXT_PUBLIC_ prefix)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// Server-side only (API routes)
const secretKey = process.env.SUPABASE_SECRET_KEY!;
```

---

## Testing & Quality

### Before Committing
1. Test locally: `npm run dev`
2. Check for errors: `npm run lint`
3. Build check: `npm run build`
4. Type check: `npm run type-check`

### Commit Message Convention
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `style:` - Code style changes
- `docs:` - Documentation changes
- `chore:` - Maintenance tasks

---

## Quick Reference

### Component Template
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export default function MyComponent({ title, onAction }: MyComponentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const handleClick = async () => {
    setIsLoading(true);
    try {
      await onAction();
      router.push('/success');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">{title}</h1>
      <button onClick={handleClick} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Submit'}
      </button>
    </div>
  );
}
```

### Service Template
```typescript
export const myService = {
  async getItem(id: string) {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data: data ?? null, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to fetch item' };
    }
  }
};
```

---

## Database Architecture

### Schema Overview

The application uses Supabase (PostgreSQL) with the following tables:

#### Tables
| Table | Purpose |
|-------|---------|
| `user_profiles` | User account data, synced from Supabase Auth via trigger |
| `scoreboards` | Scoreboard definitions with owner, visibility, styling |
| `scoreboard_entries` | Individual entries/scores within scoreboards |
| `invitations` | User invitations with status tracking |
| `system_settings` | Global app settings (single row table) |

#### Key Columns

**user_profiles**
- `id` (UUID, FK to auth.users)
- `email` (unique, validated format)
- `full_name` (optional, max 255 chars)
- `role` (enum: 'system_admin' | 'user')

**scoreboards**
- `id` (UUID, primary key)
- `owner_id` (FK to user_profiles with CASCADE)
- `title` (3-100 chars required)
- `description` (optional, max 200 chars)
- `visibility` (enum: 'public' | 'private')
- `score_type` (enum: 'number' | 'time')
- `sort_order` (enum: 'asc' | 'desc')
- `time_format` (nullable, for time-based scores)
- `custom_styles` (JSONB, styling configuration)
- `style_scope` (enum: 'main' | 'embed' | 'both')

**scoreboard_entries**
- `id` (UUID, primary key)
- `scoreboard_id` (FK to scoreboards with CASCADE)
- `name` (1-100 chars, alphanumeric pattern)
- `score` (numeric)
- `details` (optional, max 500 chars)

**invitations**
- `id` (UUID, primary key)
- `inviter_id` (FK to user_profiles, SET NULL on delete)
- `invitee_email` (validated format)
- `status` (enum: 'pending' | 'accepted' | 'expired' | 'cancelled')
- `expires_at` (must be > created_at)
- `accepted_at` (required when status = 'accepted')

### PostgreSQL Enums
```sql
user_role: 'system_admin' | 'user'
scoreboard_visibility: 'public' | 'private'
invitation_status: 'pending' | 'accepted' | 'expired' | 'cancelled'
```

### RLS Helper Functions
```sql
is_system_admin()              -- Returns true if current user is system_admin
owns_scoreboard(scoreboard_uuid)   -- Returns true if user owns the scoreboard
can_view_scoreboard(scoreboard_uuid) -- Returns true if public or user owns it
```

### Key Constraints
- All tables have `created_at <= updated_at` timestamp validation
- Email format validation on user_profiles and invitations
- Title length: 3-100 characters
- Description length: max 200 characters
- Entry name pattern: alphanumeric with spaces, hyphens, apostrophes

### Indexes
- `idx_entries_scoreboard_score` - Composite index for leaderboard queries
- `idx_scoreboards_title_trgm` - GIN trigram for fast ILIKE search
- `idx_scoreboards_description_trgm` - GIN trigram for description search
- `idx_scoreboards_visibility_created` - Composite for public listing

### Cascade Behavior
- Deleting a scoreboard CASCADE deletes all entries
- Deleting a user CASCADE deletes their scoreboards
- Deleting an inviter SET NULL on invitation.inviter_id

---

## Summary

**Key Principles:**
1. Use TypeScript strictly
2. Components use standard function declarations (no React.FC)
3. Services return { data, error } objects
4. Use @/ alias for imports
5. Keep state management minimal (AuthContext only)
6. Always use async/await (never .then())
7. Style with Tailwind utilities
8. Follow naming conventions consistently
9. Handle errors gracefully
10. Keep console logging minimal

**Architecture:**
- Next.js 14 App Router
- Supabase backend
- Service layer for data operations
- Context for auth state only
- Component colocation by feature
