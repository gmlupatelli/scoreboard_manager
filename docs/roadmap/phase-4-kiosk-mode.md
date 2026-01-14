# Phase 4: Kiosk/TV Mode

**Priority:** 🟡 Medium  
**Dependencies:** Phase 1c (Supporter/Free Limits)  
**Estimated Scope:** Large  
**Status:** ✅ Implemented (January 2026)

## Overview

Implement Kiosk/TV mode for Supporters:
- Full-screen, TV-optimized display
- Carousel with scoreboard and custom slides
- Image and PDF upload support
- Configurable timing and order

---

## Implementation Summary

- **Database Migration:** `supabase/migrations/20260114000000_add_kiosk_mode.sql`
- **Service Layer:** `src/services/kioskService.ts`
- **API Routes:** `/api/kiosk/[scoreboardId]/` (config, slides, upload, public access)
- **Kiosk View:** `/kiosk/[id]` with carousel, controls, and PIN protection
- **Management UI:** `KioskSettingsSection` in scoreboard management
- **E2E Tests:** `e2e/kiosk.spec.ts`

---

## Issues

### Issue 4.1: Create Kiosk View Layout

**Title:** Create full-screen kiosk view layout

**Description:**
Create a dedicated kiosk view that:
- Is full-screen optimized
- Has no browser chrome/navigation
- Auto-hides cursor
- Prevents screen sleep (if possible)
- Large, readable fonts for TV viewing

**Acceptance Criteria:**
- [ ] Route `/scoreboard/:id/kiosk` created
- [ ] Full-screen layout (no header/footer)
- [ ] Large, readable typography
- [ ] High contrast for visibility
- [ ] Keyboard shortcut to exit (ESC)
- [ ] Only accessible to Supporter scoreboard owners

---

### Issue 4.2: Design Kiosk Slides Schema

**Title:** Create database schema for kiosk slides

**Description:**
Design schema to store kiosk configuration and slides.

**Proposed Schema:**

```sql
-- Kiosk configuration
CREATE TABLE kiosk_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scoreboard_id UUID NOT NULL REFERENCES scoreboards(id) ON DELETE CASCADE UNIQUE,
  slide_duration_seconds INTEGER NOT NULL DEFAULT 10,
  scoreboard_position INTEGER NOT NULL DEFAULT 0, -- Order in carousel
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Kiosk slides
CREATE TABLE kiosk_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosk_config_id UUID NOT NULL REFERENCES kiosk_configs(id) ON DELETE CASCADE,
  position INTEGER NOT NULL, -- Order in carousel
  slide_type TEXT NOT NULL CHECK (slide_type IN ('image', 'scoreboard')),
  image_url TEXT, -- For image slides
  duration_override_seconds INTEGER, -- Optional per-slide duration
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT uq_kiosk_slides_position UNIQUE (kiosk_config_id, position)
);

-- Index
CREATE INDEX idx_kiosk_slides_config ON kiosk_slides(kiosk_config_id, position);
```

---

### Issue 4.3: Create Slide Upload Functionality

**Title:** Implement slide upload (images and PDF)

**Description:**
Allow users to upload slides:
- Support PNG, JPG, WebP images
- Support PDF (convert to images server-side)
- Store in Supabase Storage
- Generate thumbnails for management UI

**Acceptance Criteria:**
- [ ] Image upload (PNG, JPG, WebP)
- [ ] PDF upload with server-side conversion
- [ ] Files stored in Supabase Storage
- [ ] Thumbnails generated for preview
- [ ] File size limits enforced
- [ ] Secure upload (authenticated users only)

**Technical Notes:**
- Use Supabase Storage with RLS
- For PDF conversion, consider:
  - `pdf-lib` for extraction
  - `sharp` for image processing
  - Or external service like CloudConvert
- Max file size: 10MB per file
- Max slides: 20 per scoreboard

---

### Issue 4.4: Create PDF to Image Conversion

**Title:** Implement server-side PDF to image conversion

**Description:**
Create a service that:
- Accepts uploaded PDF
- Extracts each page as an image
- Stores images in Supabase Storage
- Returns array of image URLs

**Acceptance Criteria:**
- [ ] PDF upload endpoint created
- [ ] Each page converted to PNG/JPG
- [ ] Images stored in storage
- [ ] Returns array of image URLs
- [ ] Handles multi-page PDFs
- [ ] Error handling for invalid PDFs

**Technical Notes:**
Options for PDF conversion:
1. **pdf-poppler** - Node wrapper for Poppler
2. **pdf2pic** - Uses GraphicsMagick/ImageMagick
3. **Serverless function** - Offload to external service

Recommendation: Start with `pdf2pic` or similar, can optimize later.

---

### Issue 4.5: Create Slide Management UI

**Title:** Create slide management interface in scoreboard settings

**Description:**
Create UI within scoreboard management for:
- Enabling/disabling kiosk mode
- Uploading slides
- Reordering slides (drag & drop)
- Setting slide duration
- Positioning scoreboard in carousel
- Preview

**Acceptance Criteria:**
- [ ] Kiosk settings section in scoreboard management
- [ ] Enable/disable toggle
- [ ] Upload button for images/PDF
- [ ] Slide list with thumbnails
- [ ] Drag & drop reordering
- [ ] Delete slide button
- [ ] Duration input (global and per-slide)
- [ ] Scoreboard position in sequence
- [ ] Preview button to test

**UI Mockup:**
```
┌─────────────────────────────────────────────────────┐
│ Kiosk Mode Settings                    [Enabled ✓]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Slide Duration: [10] seconds                        │
│                                                     │
│ Slides (drag to reorder):                           │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐           │
│ │  1  │ │  2  │ │ 📊 │ │  3  │ │  4  │           │
│ │ IMG │ │ IMG │ │SCORE│ │ IMG │ │ IMG │           │
│ │ [x] │ │ [x] │ │BOARD│ │ [x] │ │ [x] │           │
│ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘           │
│                                                     │
│ [+ Upload Slides]                                   │
│                                                     │
│ [Preview Kiosk]  [Copy Kiosk URL]                  │
└─────────────────────────────────────────────────────┘
```

---

### Issue 4.6: Implement Carousel Engine

**Title:** Create carousel display engine for kiosk mode

**Description:**
Build the carousel that:
- Rotates through slides automatically
- Shows scoreboard at configured position
- Respects duration settings
- Smooth transitions
- Auto-advances

**Acceptance Criteria:**
- [ ] Automatic slide advancement
- [ ] Configurable duration per slide
- [ ] Smooth fade/slide transitions
- [ ] Scoreboard integrates into rotation
- [ ] Loops continuously
- [ ] Handles slide loading gracefully

**Technical Notes:**
- Consider using Framer Motion for transitions
- Preload next slide for smooth transition
- Handle network issues gracefully
- Keep scoreboard data fresh (refetch periodically)

---

### Issue 4.7: Create Kiosk URL and Access Control

**Title:** Implement kiosk URL generation and access control

**Description:**
Create shareable kiosk URLs:
- Unique URL per scoreboard kiosk
- Optional PIN protection
- Access logging

**Acceptance Criteria:**
- [ ] Kiosk URL format: `/scoreboard/:id/kiosk`
- [ ] Optional PIN protection setting
- [ ] PIN entry screen if protected
- [ ] Copy URL button
- [ ] Works without login for viewers
- [ ] Respects scoreboard visibility (public/private)
