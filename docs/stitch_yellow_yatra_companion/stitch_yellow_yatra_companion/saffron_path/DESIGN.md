---
name: Saffron Path
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#554336'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#887364'
  outline-variant: '#dbc2b0'
  surface-tint: '#8f4e00'
  primary: '#8f4e00'
  on-primary: '#ffffff'
  primary-container: '#ff9933'
  on-primary-container: '#693800'
  inverse-primary: '#ffb77a'
  secondary: '#ad2c00'
  on-secondary: '#ffffff'
  secondary-container: '#d83900'
  on-secondary-container: '#fffbff'
  tertiary: '#795900'
  on-tertiary: '#ffffff'
  tertiary-container: '#e2a900'
  on-tertiary-container: '#594000'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdcc2'
  primary-fixed-dim: '#ffb77a'
  on-primary-fixed: '#2e1500'
  on-primary-fixed-variant: '#6d3a00'
  secondary-fixed: '#ffdbd1'
  secondary-fixed-dim: '#ffb5a0'
  on-secondary-fixed: '#3b0900'
  on-secondary-fixed-variant: '#872000'
  tertiary-fixed: '#ffdfa0'
  tertiary-fixed-dim: '#fbbc00'
  on-tertiary-fixed: '#261a00'
  on-tertiary-fixed-variant: '#5c4300'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  title-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  touch-target: 56px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: 40px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 40px
---

## Brand & Style

The design system is centered on the concept of "Digital Pilgrimage"—fusing ancient tradition with modern safety and utility. The brand personality is protective, energetic yet calm, and deeply community-oriented. 

The design style is **Modern Tactile Minimalism**. It utilizes heavy whitespace for clarity under direct sunlight, combined with large, high-contrast touch targets for one-handed operation. Subtle glassmorphic layers are reserved for the "Night Walking" mode to simulate the soft glow of lanterns, while the daytime interface remains flat and punchy to combat glare. The overall emotional response should be one of "Safe Guidance."

## Colors

The palette is anchored by **Warm Saffron** (#FF9933) and **Deep Orange** (#FF4500), representing energy and the traditional attire of the pilgrims. 

- **Daylight Mode**: Uses an off-white background (#FAFAFA) to reduce harsh reflections. Text is set in Deep Charcoal (#1A1A1A) to ensure a high contrast ratio for readability in outdoor environments.
- **Night Walking Mode**: Shifts to a deep navy-black (#0A0E14). Accents transition to **Warm Amber** (#FFBF00) with soft outer glows to mimic low-light visibility without causing night-blindness.
- **Semantic Colors**: Green is used for safe zones/water points, and Red is reserved exclusively for medical or emergency SOS features.

## Typography

This design system prioritizes legibility at a distance. **Inter** is used across all levels for its tall x-height and exceptional clarity. 

- **Scale**: Typography is intentionally oversized to accommodate users who may be walking or in motion. 
- **Body Text**: `body-lg` (18px) is the default for most descriptive content to reduce eye strain during long journeys.
- **Hierarchy**: Headlines use a tighter letter-spacing and heavier weights to stand out against vibrant background colors.

## Layout & Spacing

The layout follows a **Fluid Mobile-First** model. Because users are often walking, the system avoids complex multi-column grids in favor of a single-stack vertical flow.

- **Touch Safety**: All interactive elements maintain a minimum height of `touch-target` (56px) to ensure ease of use for tired or wet hands.
- **Margins**: A generous 20px side margin prevents content from hugging the edge of mobile screens.
- **Rhythm**: Spacing follows an 8px linear scale. Large vertical gaps (`stack-lg`) are used to separate distinct journey sections (e.g., Map vs. Logistics).

## Elevation & Depth

Elevation is used to communicate "Safe Zones" and priority information.

- **Daytime Elevation**: Uses low-opacity, wide-dispersion shadows (15% opacity Saffron tint) to make cards appear lifted off the off-white base.
- **Nighttime Elevation**: Switches from shadows to **Tonal Layering**. Interactive elements are slightly lighter than the background (e.g., #161B22) with a subtle 1px Amber inner-stroke to define boundaries in the dark.
- **Floating Actions**: The SOS and Navigation buttons use high elevation (24px blur) to appear globally accessible over all content layers.

## Shapes

The shape language is extremely approachable, utilizing "Super-ellipses" and generous corner radii. 

- **Primary Radius**: 16px (`rounded-lg`) is the standard for cards and input containers.
- **Secondary Radius**: 8px (`rounded-md`) for smaller elements like tags or secondary buttons.
- **Full Radius**: Used for "Live" indicators and floating action buttons to signify a dynamic, organic status. 
Avoid sharp corners entirely to maintain the "calm and safe" brand promise.

## Components

### Buttons
- **Primary**: Solid Saffron (#FF9933) with Charcoal text. Height: 56px. Fully rounded corners.
- **Ghost**: Deep Charcoal outline (2px) with transparent center for secondary actions.

### Cards
- Journey cards use a 16px radius with a soft #FF4500-tinted shadow. 
- In Night Mode, cards use a semi-transparent background (Glassmorphism) with a 20px background blur.

### Input Fields
- Inputs feature a large 18px font size and a 16px border-radius. The focus state uses a 3px Saffron outer glow.

### Road Markers & Chips
- Status chips (e.g., "Water Nearby," "Rest Stop") use a pill-shape with a soft background tint of the primary color and bold label-caps typography.

### Progress Trackers
- A "Footstep" progress bar shows distance covered. The active track is a gradient from Saffron to Deep Orange, while the inactive track is a low-contrast neutral.

### Special Component: SOS Button
- A persistent, circular floating button in the bottom right. It uses a pulsing animation in Deep Orange (#FF4500) to ensure it is the most visible element on the screen at all times.