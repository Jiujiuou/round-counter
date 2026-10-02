---
name: Monochrome Swiss Minimalist
colors:
  surface: '#f9f9fa'
  surface-dim: '#dadadb'
  surface-bright: '#f9f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeef'
  surface-container-high: '#e8e8e9'
  surface-container-highest: '#e2e2e3'
  on-surface: '#1a1c1d'
  on-surface-variant: '#444748'
  inverse-surface: '#2f3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#5d5e66'
  on-secondary: '#ffffff'
  secondary-container: '#e3e1ec'
  on-secondary-container: '#63646c'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1d1b1a'
  on-tertiary-container: '#868381'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474646'
  secondary-fixed: '#e3e1ec'
  secondary-fixed-dim: '#c6c5cf'
  on-secondary-fixed: '#1a1b22'
  on-secondary-fixed-variant: '#46464e'
  tertiary-fixed: '#e6e1df'
  tertiary-fixed-dim: '#cac6c3'
  on-tertiary-fixed: '#1d1b1a'
  on-tertiary-fixed-variant: '#484645'
  background: '#f9f9fa'
  on-background: '#1a1c1d'
  surface-variant: '#e2e2e3'
typography:
  display:
    fontFamily: Hanken Grotesk
    fontSize: 3.5rem
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  display-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 2.25rem
    fontWeight: '600'
    lineHeight: '1.15'
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 2.25rem
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: -0.03em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 1.75rem
    fontWeight: '500'
    lineHeight: '1.25'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 1.5rem
    fontWeight: '500'
    lineHeight: '1.3'
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 1.125rem
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: -0.01em
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: 0.01em
  label-md:
    fontFamily: Geist
    fontSize: 0.8125rem
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Geist
    fontSize: 0.6875rem
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.06em
  code:
    fontFamily: Geist
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: '1.4'
    letterSpacing: '0'
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 3rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system embraces an uncompromising, reductionist philosophy rooted in Swiss typography, modern architectural restraint, and International Typographic Style principles. Every element serves an explicit functional purpose: structural hierarchy replaces ornamental decoration, precise spatial rhythm replaces heavy containment, and typographical contrast takes precedence over chromatic variance.

### Target Audience & Emotional Intent

- **Audience:** Discerning professionals, architects, designers, developers, and researchers requiring dense, high-clarity interfaces devoid of cognitive noise.
- **Perception:** Surgical precision, quiet authority, clarity, and structural poise.
- **Design Philosophy:** Utilitarian purism. Color is never decorative; contrast, scale, and hairline grid alignments provide all spatial cues.

## Colors

The palette is strictly achromatic, composed of calculated stops across light values to establish depth and optical legibility without color intervention.

### Palette Architecture

- **Primary Base Surfaces:** `#ffffff` for canvas; `#fcfcfc` for layered sub-surfaces and structural groupings.
- **Text & Key Accents:** `#111111` for high-priority headlines, body text, and active interactive elements; `#000000` reserved for inverted buttons or decisive focal points.
- **Secondary & Meta Hierarchy:** `#71717a` for secondary descriptions, captions, and deactivated states; `#a1a1aa` for tertiary placeholders, breadcrumbs, and subtle labels.
- **Borders & Partitions:** `#e4e4e7` for 1px hairline delimiters; `#f4f4f5` for soft structural fills and subtle interactive hover foundations.

Color shifts are forbidden across system alerts or states; status is expressed through structural typography, weight shifts, and standardized icon markers.

## Typography

The typography system relies on **Hanken Grotesk** for its precise geometry, neutral voice, and balanced proportions, supported by **Geist** for technical metadata, tags, and small data labels.

### Typographic Rules

- Line height is strictly coupled to font size to avoid optical drift.
- Display sizes utilize tighter tracking (`-0.03em` to `-0.04em`) to maintain a clean editorial presence.
- Body copy adheres to comfortable reading widths (45–65 characters).
- Never mix italic styles with standard body copy; emphasis is created solely through weight shifts (`400` regular to `500` or `600` semi-bold).

## Layout & Spacing

Layouts conform to a disciplined, column-based structural grid derived from traditional Swiss poster design.

### Grid & Responsiveness

- **Desktop (1024px+):** 12-column grid, `3rem` margins, `1.5rem` gutters. Content containers cap at `1280px` max-width.
- **Tablet (640px - 1023px):** 8-column grid, `2rem` margins, `1.25rem` gutters.
- **Mobile (<640px):** 4-column grid, `1.25rem` margins, `1rem` gutters.

### Rhythm

Components follow an 8pt base grid with a 4pt sub-increment (`space-xs`). Spacing tokens are reserved exclusively for exterior clearance and interior component padding. Spatial distribution favors generous, purposeful white space over framed containers to indicate relationship and separation.

## Elevation & Depth

This system operates without drop shadows, elevation blurs, or volumetric gradients. Surface depth is entirely flat, organized via hairline structural lines and tonal step-downs.

### Elevation Principles

- **Hairline Delimiters:** Separation between panels, headers, and rows is handled through solid `1px` borders using `#e4e4e7`.
- **Tonal Layers:** Layered depths (such as sidebars, drawers, and modal backdrops) rely on pure color blocking: `#ffffff` canvas over `#fcfcfc` foundation panels, with active selections highlighted by `#f4f4f5`.
- **Modals & Overlays:** Modals use an unblurred 20% opacity black shroud (`rgba(0, 0, 0, 0.2)`) and are encased in a solid `1px` `#111111` or `#e4e4e7` border on `#ffffff` surfaces.

## Shapes

The shape system is strictly sharp (`0px` corner radii). Every container, button, input field, chip, and popover maintains clean, precise 90-degree corners.

- **Perimeter Geometry:** No softened vertices, chamfers, or circular capsules.
- **Visual Rationale:** Sharp geometries anchor the interface to the underlying grid matrix, mirroring classical typographic and architectural layouts.

## Components

### Buttons

- **Primary:** Solid `#111111` background, `#ffffff` text, sharp corners, 0px radius. Hover shifts to `#000000` with subtle inverse tracking.
- **Secondary:** Transparent background, `1px` solid `#e4e4e7` border, `#111111` text. Hover shifts to `#f4f4f5` background with a `#111111` border.
- **Text/Ghost:** Transparent background, `#111111` text with an underline offset of 4px. Hover deepens underline weight from 1px to 1.5px.

### Inputs & Text Areas

- Built with a transparent or `#ffffff` surface, framed by a `1px` solid `#e4e4e7` border.
- Focus state instantly switches the border to `#111111` (0px outline ring).
- Placeholder text uses `#a1a1aa`. Floating labels use `label-sm` in `#71717a`.

### Cards & Panels

- Cards use no drop shadows. Structure is defined by a `1px` solid `#e4e4e7` perimeter border over `#ffffff` or `#fcfcfc`.
- Interactive cards shift border color to `#111111` on hover with zero vertical translation.

### Chips & Tags

- Rectangular containers with sharp edges (`0px` radius).
- Background `#f4f4f5`, text `#111111`, font scale `label-sm`.
- Active or filter states invert the chip: `#111111` background with `#ffffff` text.

### Checkboxes & Radios

- **Checkbox:** `14px x 14px` sharp square with a `1px` solid `#111111` border. Checked state fills solid `#111111` with an interior sharp white square or check glyph.
- **Radio:** `14px x 14px` sharp square outer container with a concentric sharp interior `#111111` square on selection.

### Lists & Dividers

- Lists employ hairline dividers (`1px` solid `#e4e4e7`) running edge-to-edge.
- Row hover triggers a solid `#f4f4f5` background fill across the entire row surface.

### Status Indicators & Badges

- No saturated colors (reds, greens, ambers).
- Status is communicated via typographic tags (e.g., `[ACTIVE]`, `[OFFLINE]`) in `Geist`, or mono-weight iconography paired with descriptive text.
