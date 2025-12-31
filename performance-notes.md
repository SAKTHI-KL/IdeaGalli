Performance optimizations added and recommended checks

What I changed:
- Added mobile-specific hero at `assets/images/hero-mobile.svg` and used <picture> with `loading="lazy"` on desktop image.
- Lazy-loading and async decoding set for heavy images.
- Added cookie-consent to defer GA script until consent is given.

Local Lighthouse run:
- Install dependencies: `npm install` (or `npm i -g lhci serve` and `npm i -g serve`)
- Start local server: `npm run start` (serves at http://localhost:5000)
- Run Lighthouse: `npm run lighthouse` (requires LHCI)

Common fixes to improve Lighthouse:
- Serve compressed images (webp) and scaled images for mobile.
- Preload critical fonts or use system fonts to reduce FCP.
- Reduce unused JS and remove polyfills; split scripts if necessary.
- Minify CSS and JS in production builds (Vercel/Netlify do this automatically when building assets).

Next steps I can help with:
- Convert hero and icons to optimized WebP/AVIF variants and add srcset for multiple DPRs.
- Inline-critical CSS for above-the-fold content.
- Add font-display swap or switch to system fonts to remove FOUT impact.
- Replace large external libraries with smaller alternatives or dynamic imports.
