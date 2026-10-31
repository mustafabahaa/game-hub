# Product

## Register

product

## Users

Gamers (initially Egyptian/Arab-region, where buying game accounts from third-party "providers" is common) who own credentials for PlayStation, Xbox, Steam, and PC games purchased across multiple resellers. Their job-to-be-done: keep every account credential, OTP secret, expiry date, and purchase record in one searchable vault so nothing is lost, and so they can re-access an account months later without digging through old WhatsApp chats.

Secondary context: they also want to evaluate and review the providers (resellers) they bought from, share accounts with trusted friends, and discover what other community members own. Trust in providers matters — reputation and ratings exist because the reseller market has scammers.

Context of use: personal device, often mobile, often pulling up a credential mid-conversation with a friend or when a game prompts for login. Speed of access matters more than atmosphere.

## Product Purpose

A private, reliable credential vault for multi-platform game accounts. Success = the user never loses access to a paid account because they forgot where they stored the password, and can make an informed trust decision before buying from a new provider. The community and friends features exist to support trust and sharing, not as social-media ends in themselves.

## Brand Personality

Trustworthy, organized, calm, gamer-aware without being juvenile. Voice is direct and efficient — you're managing your stuff, not browsing a store. Personality shows through the game/provider content (real cover art, real ratings), not through decorative UI chrome.

## Anti-references

- The previous GameHub aesthetic as the DEFAULT treatment: full-bleed Aurora shader backgrounds, glassmorphism on every card, gradient text, neon glow shadows on everything, huge `font-black` hero headlines. These are fine as occasional moments; they fail as a product's everyday vocabulary. They made the credential list feel like a splash page.
- Generic SaaS dashboard templates with hero-metric tiles.
- "Cream/sand/beige" warm-neutral bodies (the saturated AI default).
- Reinvented form controls or custom scrollbars that fight the platform.
- Heavy color or glow on inactive/static states.

## Design Principles

1. **The tool disappears into the task.** The interface should feel like a fast, trustworthy filing cabinet — not a stage. Chrome recedes so credentials, game covers, and provider ratings stay legible and quick to find.
2. **Content is the visual interest.** Real game cover art, provider logos, rating numbers, and platform color-coding carry the color and energy. The surrounding UI is restrained so the content pops without competing with it.
3. **Earned familiarity over invented affordances.** Standard MUI component vocabulary, consistent button/control shapes, system-friendly patterns. A user of Linear/Notion/kippa should sit down and immediately trust this.
4. **Restrained color, committed moments.** Default to kippa-style restrained neutrals + a single accent. A primary CTA, a destructive confirm, a PS-Plus gold badge — those are the moments color earns. Everything else is surface.
5. **Every state designed.** Loading skeletons (not spinners), empty states that teach, hover/focus/disabled everywhere. Half-finished component states are the fastest way to lose trust in a credential app.

## Accessibility & Inclusion

- WCAG AA contrast (4.5:1 body, 3:1 large/bold) in both light and dark modes.
- Respect `prefers-reduced-motion`: Aurora and any entrance animations must have a still/crossfade fallback. The Aurora canvas is allowed as a rare moment but must pause under reduced-motion and must not sit behind body text at low contrast.
- Keyboard navigation for credential reveal, copy-to-clipboard, and modal actions.
- Color is never the sole signal (platform tags need an icon or label, not just hue).
