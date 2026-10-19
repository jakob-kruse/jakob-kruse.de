# jakob-kruse.de

Personal website built with SvelteKit 3, Svelte 5, Tailwind CSS 3, and Vite 8.
The entire site is prerendered and deployed as static assets on Cloudflare Workers
using **Alchemy 2.0.0-beta.83**. Deployment state lives in Cloudflare, not this checkout.

## Development

Use Node.js 22.17 or newer and Bun 1.3.10 (pinned in `package.json`).

```sh
bun install --frozen-lockfile
bun run dev
bun run check
bun run lint
bun run build
```

Tailwind 3 and the legacy-compatible Bits UI, Sonner, and Tailwind Variants lines
are retained to preserve the existing components and styling. Other packages are
updated to current compatible releases.

## Amp orbs

`.agents/setup` installs the pinned Bun version if needed, restores dependencies
from the lockfile, generates SvelteKit types, and installs Tailscale. Setup is
noninteractive and safe to rerun on a warm snapshot. It needs no deployment secrets.
Node.js, Python, curl, and jq are supplied by the standard orb image.

`.agents/resume` only reconnects Tailscale using the current orb workload identity.
It skips successfully when the owner's personal Tailscale selectors are absent.
No login, node identity, or deployment credential is baked into the setup snapshot.

Run `amp orb services ensure` to start the supervised Vite service declared in
`.amp/services.yaml`. Use `amp orb portal 5173` to obtain its authenticated portal URL.
The `.agents` files must reach the project's default branch before future orbs use them.
Normal setup changes refresh snapshots automatically; manual snapshot deletion is unnecessary.

## Production deployment

From this project's Amp orb, run:

```sh
scripts/with-openbao --production --check
bun run deploy --yes --no-input
```

The wrapper exchanges a project-bound Amp OIDC identity for a five-minute OpenBao
session, reads `jakob-kruse-de/prod/deployment`, revokes the session, and starts
Alchemy with only the project deployment token and account ID. No `.env` file or
saved Alchemy login is needed. The production role cannot write secrets or read
personal administrator credentials. Production access must be explicitly selected.

Alchemy manages the site's Worker and the `jakob-kruse.de` custom domain in the
existing Cloudflare zone. Existing mail records are not managed or changed.
The deployment token has account-level Workers Scripts and Secrets Store write
access (required by Alchemy's remote state discovery), Account Settings read, and
DNS write, Workers Routes write, and Zone read limited to the website's zone.
For deployment outside Amp, supply `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID` securely, then run `bunx alchemy deploy --stage prod --yes`.

Other stages omit the production custom domain and receive their own Workers URL.
They require separately authorized deployment credentials; the production wrapper
does not provide a development credential.
