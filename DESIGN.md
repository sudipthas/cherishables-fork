# Design Brief

## Direction

Caricature Corner By Sharon — Premium artist studio caricature booking platform redesigned with bold hero, structured sections (How-it-Works, Gallery, Pricing, FAQ), and artistic FULL PINK aesthetic.

## Tone

Bold and inviting with editorial confidence — oversized serif headlines + customer gallery create gallery-studio presence; vibrant pink palette conveys artistic creativity, warmth, and premium positioning.

## Differentiation

Customer caricature gallery (portraits 1–10+) as primary design element + structured how-it-works section set apart from generic SaaS booking flows — feels like discovering an artist's portfolio, not filling a form. Full pink theme creates distinctive, memorable brand identity.

## Color Palette

| Token        | OKLCH         | Role                          |
| ------------ | ------------- | ----------------------------- |
| background   | 0.97 0.01 350 | Soft blush pink base           |
| foreground   | 0.20 0.04 340 | Deep rose-brown text          |
| card         | 0.99 0.008 350| Near-white pink tinted card   |
| primary      | 0.50 0.25 340 | Vivid hot pink CTAs & accents |
| accent       | 0.72 0.18 340 | Medium pink highlight         |
| muted        | 0.93 0.02 350 | Very light pink section bands |

## Typography

- Display: Lora — bold serif for hero (7xl), section headings (5xl), premium positioning
- Body: General Sans — clean UI labels, body text, descriptions
- Scale: hero `text-6xl md:text-7xl font-bold tracking-tight`, h2 `text-4xl md:text-5xl font-bold tracking-tight`, label `text-sm font-semibold`, body `text-base`

## Elevation & Depth

Escalated shadow hierarchy (soft 8px → elevated 28px on cards) with pink hue undertones; rounded 16px cards + 24px section spacing create studio-gallery rhythm and approachability.

## Structural Zones

| Zone     | Background                | Border       | Notes                                         |
| -------- | ------------------------- | ------------ | --------------------------------------------- |
| Header   | bg-card with shadow-md    | soft border  | Elevated, pink shadow                         |
| Hero     | bg-background             | —            | Soft blush pink, full-width, generous padding |
| Sections | bg-background / bg-muted  | —            | Alternating bands (muted every other section) |
| Gallery  | bg-muted                  | —            | Light pink for image grid context             |
| Footer   | bg-primary                | —            | Vivid hot pink with cream text                |

## Spacing & Rhythm

Hero 10–12rem top/bottom, sections 8–10rem vertical gaps, cards 1.5–2rem padding, gallery grid 1.5rem gaps — generous spacing reinforces premium studio feel and guides eye through structured flow.

## Component Patterns

- Buttons: Rounded 16px, hot pink bg with cream text, shadow-md at rest, shadow-lg + scale-105 on hover
- Cards: Rounded 16px, blush bg, shadow-md, hot pink accent border (2px) on hover, shadow-lg scaled-102
- Gallery items: Rounded 12px, image with overlay label on hover (style tags: Cute, Professional, Aesthetic, Exaggerated)
- Badges/tags: Rounded-full, light pink bg with rose foreground, 0.75rem padding

## Motion

- Entrance: Section cards cascade in via `fadeInUp 0.6s ease-out` (staggered 0.1s offset)
- Gallery: Subtle `float 4s ease-in-out infinite` on hover for gallery images
- Hover: Button scale-105 + shadow-lg; card shadow-md → shadow-lg with 0.3s transition

## Constraints

- Light theme primary (dark mode supported via --dark tokens)
- Gallery uses portrait1.jpg – portrait10.jpg+ from assets/images/
- No AI preview UI shown (external delivery)
- FAQ uses native HTML5 `<details>` accordion, not custom JS
- All shadows use pink undertones (hue 340°)

## Signature Detail

Customer portrait gallery as design centerpiece with full PINK color story — transforms booking flow from abstract form into concrete gallery preview; combined with oversized serif headlines and vivid pink accents, creates memorable artist-studio brand distinct from competition.
