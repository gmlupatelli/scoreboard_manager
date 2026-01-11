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

### Standard API Route Structure
```typescript
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getAuthClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );
}

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    // 1. Validate Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // 2. Get authenticated user
    const token = authHeader.substring(7);
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
    
    // 5. Process request
    const { data, error } = await authClient
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
