# Pichonia Website

Marketing site for **Pichonia LLC** — built with [Astro](https://astro.build) and deployed on [Cloudflare Pages](https://pages.cloudflare.com/), with a production contact form powered by [Resend](https://resend.com/).

- Live site: https://pichonia.com  
- Policies hub: https://pichonia.com/policies/privacy and https://pichonia.com/policies/terms  
- Product policies (markdown): https://policies.pichonia.com  

---

## 1. Tech Stack

- **Framework:** Astro (static output)
- **Styling:** Tailwind v4-style utilities via `@import "tailwindcss";` + custom component/utility layers (`global.css`)
- **Hosting:** Cloudflare Pages
- **Functions:** Cloudflare Pages Functions (for `/api/contact`)
- **Email:** Resend (send-only API keys)
- **DNS:** Cloudflare (main site) + GitHub Pages (policies subdomain)

---

## 2. Project Structure

Key files and directories:

```text
website/
├── astro.config.mjs          # Astro configuration
├── package.json              # Scripts + dependencies
├── wrangler.toml             # Cloudflare Pages / Workers config
├── .nvmrc                    # Node version hint
├── README.md                 # This file
├── src/
│   ├── layouts/
│   │   └── Layout.astro      # Global layout shell (header/footer)
│   ├── pages/
│   │   ├── index.astro       # Home page
│   │   ├── services.astro    # Services overview
│   │   ├── products.astro    # Products (Dropt, Derbest AI)
│   │   ├── about.astro       # About Pichonia
│   │   ├── contact.astro     # Contact page + form
│   │   └── policies/
│   │       ├── privacy.astro # Policy hub → links to product-specific policies
│   │       └── terms.astro   # Terms hub → links to product-specific terms
│   └── styles/
│       └── global.css        # Global styles, helpers, and animations
└── functions/
    └── api/
        └── contact.ts        # Cloudflare Pages Function for contact form
```

External policies repository (separate GitHub repo):

```text
~/Documents/pichonia-policies/   # GitHub: pichonia-policies
  ├── logistics/*.md             # Dropt policies
  └── trading_ai/*.md            # Derbest AI policies
```

---

## 3. Layout & Styling

### Global Layout

**File:** `src/layouts/Layout.astro`

- Provides the HTML shell for every page:
  - `<head>`: sets `<title>` and `<meta name="description">` from props.
  - `<header>`: sticky navigation with links to `/services`, `/products`, `/about`, `/contact`.
  - `<footer>`: company info and links to:
    - `/policies/privacy`
    - `/policies/terms`

Use it in pages like:

```astro
---
import Layout from "../layouts/Layout.astro";
---

<Layout title="Contact — Pichonia">
  <!-- Page content -->
</Layout>
```

### Global Styles

**File:** `src/styles/global.css`

Defines reusable helpers via Tailwind layers:

- Layout + spacing:

  ```css
  .section       { @apply mx-auto max-w-7xl px-6 py-16 md:py-20; }
  .section-tight { @apply mx-auto max-w-7xl px-6 py-12 md:py-14; }
  ```

- Typography + components:

  ```css
  .eyebrow { @apply text-xs font-semibold tracking-wide text-slate-500 uppercase; }
  .h1      { @apply text-4xl md:text-5xl font-bold tracking-tight text-slate-900; }
  .h2      { @apply text-2xl md:text-3xl font-bold tracking-tight text-slate-900; }
  .lead    { @apply text-lg text-slate-600 leading-relaxed; }

  .card       { @apply rounded-2xl border border-slate-100 bg-white p-6 shadow-sm; }
  .card-muted { @apply rounded-2xl border border-slate-100 bg-slate-50 p-6; }

  .btn-primary   { @apply rounded-xl bg-[#2158FF] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90; }
  .btn-secondary { @apply rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50; }
  ```

- Hero animation (`.hero-grid`) and micro-pulse dots for Dropt / Derbest AI (`.product-dot`, `.ai-dot`).
- Utility `.gradient-underline` for emphasis.

---

## 4. Contact Form Architecture

### 4.1 Frontend (Astro page)

**File:** `src/pages/contact.astro`

- Left column: marketing copy + contact info.
- Right column: form that sends a POST request to `/api/contact`.

Key pieces:

```html
<form
  id="contact-form"
  action="/api/contact"
  method="POST"
  class="card grid gap-4"
>
  <!-- Honeypot (bots fill this, humans won't) -->
  <label class="hidden">
    Website
    <input
      type="text"
      name="website"
      tabindex="-1"
      autocomplete="off"
    />
  </label>

  <!-- Required + optional fields -->
  <input name="name"    required />
  <input name="email"   required />
  <input name="company" />
  <input name="phone"   />
  <textarea name="message" required></textarea>

  <button id="contact-submit" type="submit" class="btn-primary">
    Send message
  </button>
  <p id="form-status" class="text-sm text-slate-600" aria-live="polite"></p>
</form>
```

Progressive enhancement script (inline, `is:inline`):

- Prevents default browser submit.
- Sends `FormData` using `fetch(form.action, { method: "POST", body: formData })`.
- Shows status text:

  - `"Sending…"`
  - `"Message sent. We’ll reply soon."` on success.
  - Generic error text on failure.

- Disables the submit button while the request is in flight and re-enables afterward.

### 4.2 Backend (Cloudflare Pages Function)

**File:** `functions/api/contact.ts`

Entry point:

```ts
export const onRequestPost = async (context: any) => {
  // ...
};
```

Behavior:

1. Reads `FormData` from `context.request`.
2. Extracts fields:
   - Required: `name`, `email`, `message`
   - Optional: `company`, `phone`
   - Honeypot: `website` — if filled, short-circuits and returns `{ ok: true }` without sending mail.
3. Validates required fields; returns `400` with JSON if any are missing.
4. Reads environment variables from `context.env`:
   - `RESEND_API_KEY` (required)
   - `CONTACT_TO` (default: `info@pichonia.com`)
   - `CONTACT_FROM` (default: `noreply@pichonia.com`)
5. Escapes message contents and builds a simple HTML email.
6. Calls Resend:

   ```ts
   const resendResp = await fetch("https://api.resend.com/emails", {
     method: "POST",
     headers: {
       Authorization: `Bearer ${apiKey}`,
       "Content-Type": "application/json",
     },
     body: JSON.stringify({
       from,
       to: [to],
       reply_to: email,
       subject,
       html,
     }),
   });
   ```

7. Returns:

   - `{"ok": true}` with status `200` on success.
   - JSON error with status `502` if Resend call fails.
   - JSON error with status `500` on unexpected server errors.

---

## 5. Environment Variables

### 5.1 Local development (`.dev.vars`)

Create a `.dev.vars` file at the project root:

```env
RESEND_API_KEY=your_dev_resend_key_here
CONTACT_TO=info@pichonia.com
CONTACT_FROM=noreply@pichonia.com
```

> **Note:** This file should **not** be committed. Make sure it’s covered by `.gitignore` (or add it).

Wrangler uses this file automatically when running `wrangler pages dev`.

### 5.2 Cloudflare Pages (Production & Preview)

In the Cloudflare dashboard:

1. Go to **Workers & Pages → pichonia-website → Settings → Environment variables**.
2. Add these variables for both **Production** and **Preview**:

   - `RESEND_API_KEY` → Resend API key with **Sending access**.
   - `CONTACT_TO` → `info@pichonia.com`
   - `CONTACT_FROM` → `noreply@pichonia.com`

Once set, redeploy the project (push to `main`), and the live form at `https://pichonia.com/contact` will use these values.

---

## 6. Local Development & Commands

All commands are run from the root of the project:

| Command                                | Action                                                                                   |
| :------------------------------------- | :--------------------------------------------------------------------------------------- |
| `npm install`                          | Installs dependencies                                                                    |
| `npm run dev`                          | Starts Astro dev server at `http://localhost:4321` (no Cloudflare functions)            |
| `npm run build`                        | Builds the production site to `./dist/`                                                  |
| `npm run preview`                      | Preview the built site locally (Astro’s preview mode)                                    |
| `npx wrangler pages dev dist`         | Run Cloudflare Pages dev with Functions + env vars at `http://localhost:8788`           |
| `npx wrangler pages dev dist --port …`| Same as above, but on a custom port if `8788` is already in use                          |
| `npm run astro ...`                    | Run CLI commands like `astro add`, `astro check`                                         |
| `npm run astro -- --help`             | Get help using the Astro CLI                                                             |

Recommended flow:

- Use `npm run dev` when working on layout, copy, or styles.
- Use `npm run build && npx wrangler pages dev dist` when testing the contact form end-to-end.

---

## 7. Deployment (Cloudflare Pages)

- GitHub repo: `DerBesJC/pichonia-website`
- Default branch: `main`
- Cloudflare Pages project: `pichonia-website`

Build settings:

- Build command: `npm run build`
- Build output directory: `dist`

Each push to `main` triggers:

1. Cloudflare build (`npm install`, `npm run build`).
2. Deploy to:
   - `pichonia-website.pages.dev`
   - `pichonia.com` (via CNAME)
   - `www.pichonia.com` (via CNAME)

---

## 8. DNS & Domains

In Cloudflare DNS for `pichonia.com`:

```text
CNAME  pichonia.com  pichonia-website.pages.dev  (Proxied)
CNAME  www           pichonia-website.pages.dev  (Proxied)
CNAME  policies      derbesjc.github.io          (DNS only)
```

- Root + `www` → Cloudflare Pages (Astro marketing site).
- `policies.pichonia.com` → GitHub Pages (`pichonia-policies` repo), which serves product-specific markdown policies.

---

## 9. Troubleshooting

### 9.1 `POST /api/contact` returns 404 in dev

**Symptom:** Console shows:

```text
POST http://localhost:4321/api/contact 404 (Not Found)
```

**Cause:** Using Astro dev server (`npm run dev`) which does **not** run Cloudflare Pages Functions.

**Fix:**

```bash
npm run build
npx wrangler pages dev dist
# then open http://localhost:8788/contact
```

---

### 9.2 `POST /api/contact` returns 502 (Email error)

**Symptom:** Form status text shows an error, and the response body looks like:

```json
{
  "ok": false,
  "error": "Email send failed.",
  "details": "{"statusCode":401,..."API key is invalid"}"
}
```

**Cause:** `RESEND_API_KEY` is invalid or restricted.

**Debug:**

```bash
# Load key from .dev.vars
RESEND_API_KEY=$(grep RESEND_API_KEY .dev.vars | cut -d= -f2-)

curl -sS https://api.resend.com/emails   -H "Authorization: Bearer $RESEND_API_KEY"   -H "Content-Type: "application/json"   -d '{
    "from": "noreply@pichonia.com",
    "to": ["info@pichonia.com"],
    "subject": "Pichonia contact test",
    "html": "<p>Test email from local dev verification.</p>"
  }'
```

- If you get `{"id": "..."}`, the key is valid.
- If you get a 401 error, fix the key in `.dev.vars` and Cloudflare Pages env vars.

---

### 9.3 Port already in use

**Symptom:**

```text
Address already in use (127.0.0.1:8788)
```

**Fix:**

- Stop any existing Wrangler process (`Ctrl + C` where it’s running), or:
- Use a different port:

  ```bash
  npx wrangler pages dev dist --port=8789
  ```

---

## 10. Future Enhancements

- Add `src/pages/404.astro` for a custom 404 page.
- Add SEO metadata (Open Graph, Twitter cards) per page.
- Integrate privacy-friendly analytics (e.g., Cloudflare Web Analytics).
- Wire up final logo mark/wordmark in the header once the brand system is fully locked.

---

## 11. Astro Docs

For general Astro usage:

- Docs: https://docs.astro.build  
- Discord: https://astro.build/chat  

This project is now a fully configured, Cloudflare-native Astro site with a live contact form and external policy hub.
