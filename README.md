# Blueprint Local Mirror

This workspace contains a public-site mirror workflow for `https://blueprint.bryanjohnson.com`.

What this gives you:
- A local copy of the public storefront HTML, CSS, JS, images, and fonts.
- Rewritten links so the mirrored site can be served locally.

What it does not give you:
- Shopify admin/theme source that is not publicly shipped.
- Working checkout, account, cart, or other backend-powered flows.

Usage:

```bash
python3 scripts/mirror_blueprint.py --out-dir mirror
cd mirror
python3 -m http.server 4173
```

Then open:

`http://localhost:4173/blueprint.bryanjohnson.com/index.html`
