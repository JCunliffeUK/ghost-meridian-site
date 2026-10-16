# ghostmeridian.games

Studio website for Ghost Meridian. It's currently a single coming-soon page, served by GitHub Pages from the root of the `main` branch.

## What's here

| File | Purpose |
| --- | --- |
| `index.html` | The whole page: markup, styles and the pixel horizon animation in one file |
| `CNAME` | Tells GitHub Pages to serve the site on ghostmeridian.games |
| `.nojekyll` | Tells GitHub Pages to serve the files as they are, with no Jekyll build step |

## Making changes

Edit `index.html` and push to `main`. GitHub Pages republishes within a minute or two.

- **Social links:** the `<ul class="socials">` list near the bottom of the markup. There's one `<li>` per profile.
- **YouTube:** a commented-out `<li>` is waiting in that list. Uncomment it and paste in the channel URL.
- **Colours:** the `:root` block at the top of the styles uses the Slingshot palette (Void, Violet, Plasma, Solar, Pearl). The canvas animation has the same colours in its `PAL` object in the script.

## Hosting and DNS

- Hosting is GitHub Pages, deploying from the branch root (`main` /).
- The domain is registered at Porkbun, and DNS is managed there.
- Email forwarding (hello@, admin@) also runs through Porkbun. Don't touch the MX or TXT records when changing website records.

DNS records for the site, set at Porkbun:

| Type | Host | Answer |
| --- | --- | --- |
| A | (blank, the bare domain) | 185.199.108.153 |
| A | (blank) | 185.199.109.153 |
| A | (blank) | 185.199.110.153 |
| A | (blank) | 185.199.111.153 |
| CNAME | www | `<owner>.github.io` |

Optional IPv6 records (AAAA, bare domain): `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`.
