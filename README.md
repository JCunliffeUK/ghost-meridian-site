# ghostmeridian.games

The website for Ghost Meridian, an independent games studio.

## What lives here

This repository is the source for the studio's static marketing pages and the assets they share:

- `index.html`: the studio homepage
- `pixelblitz/index.html`: the Pixel Blitz tool page, with its screenshots in `pixelblitz/screenshots/`
- `assets/css/`: shared design tokens, components and page layout
- `assets/js/horizon.js`: the homepage sky and horizon animation
- `assets/fonts/` and `assets/img/`: shared fonts, logos and images

## Editing

Edit the checked-in HTML, CSS and JavaScript directly. There is no build step.

Older draft generators, standalone Pixel Blitz site exports and build bundles are not the source for this site. Don't copy their output over these files.

The Pixel Blitz app itself is released separately. This repository only holds its marketing page; adding or linking a release here is a deliberate integration step, not something that happens automatically.

## Previewing

Pages use root-relative links such as `/pixelblitz/`, so preview through a local server rather than opening the files directly. From the repository root:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Then open <http://127.0.0.1:8000/>. Binding to `127.0.0.1` keeps the preview on your own machine.

## Publishing

GitHub Pages publishes the root of `main`. `CNAME` sets the custom domain, and `.nojekyll` disables Jekyll processing. Leave both as they are.

## Fonts

Rubik and IBM Plex Mono are used under the SIL Open Font License. See [`assets/fonts/OFL-Rubik.txt`](assets/fonts/OFL-Rubik.txt) and [`assets/fonts/OFL-IBMPlexMono.txt`](assets/fonts/OFL-IBMPlexMono.txt).

Contact: [hello@ghostmeridian.games](mailto:hello@ghostmeridian.games).
