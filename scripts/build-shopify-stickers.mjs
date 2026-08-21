import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '..');
const outputDir = resolve(projectRoot, 'tmp', 'shopify-stickers');
const themeDir = join(outputDir, 'theme');
const assetsDir = join(themeDir, 'assets');
const templatesDir = join(themeDir, 'templates');

const stagingTheme = {
  id: 'gid://shopify/OnlineStoreTheme/164625055801',
  previewId: '164625055801',
  name: 'Merchcraft Rebrand Staging — 2026-08-13',
};

const liveThemeId = 'gid://shopify/OnlineStoreTheme/135988805689';
if (stagingTheme.id === liveThemeId) throw new Error('Refusing to package against the live theme ID.');

const routeMap = {
  '/': '/pages/mc-rebrand-home',
  '/services': '/pages/mc-rebrand-services',
  '/about': '/pages/mc-rebrand-about',
  '/contact': '/pages/mc-rebrand-contact',
  '/quote': '/pages/mc-rebrand-quote',
  '/stickers': '/pages/mc-rebrand-stickers',
};

const publicAssetMap = {
  '/assets/brand/merchcraft-primary-full.svg': 'mc-brand-primary-full.svg',
  '/assets/fonts/anton-regular.woff2': 'mc-font-anton-regular.woff2',
  '/assets/fonts/inter-variable.woff2': 'mc-font-inter-variable.woff2',
  '/assets/fonts/inter-variable-italic.woff2': 'mc-font-inter-variable-italic.woff2',
  '/assets/fonts/space-grotesk-variable.woff2': 'mc-font-space-grotesk-variable.woff2',
  '/assets/images/stickers-matte-v2.webp': 'mc-stickers-matte-v2.webp',
  '/assets/images/stickers-gloss-v2.webp': 'mc-stickers-gloss-v2.webp',
  '/assets/images/stickers-clear-v2.webp': 'mc-stickers-clear-v2.webp',
  '/assets/images/stickers-holographic-v2.webp': 'mc-stickers-holographic-v2.webp',
  '/assets/images/stickers-hero-v2.webp': 'mc-stickers-hero-v2.webp',
  '/assets/images/stickers-process-v2.webp': 'mc-stickers-process-v2.webp',
  '/assets/3d/stickers-scene-brand-v3.splinecode': 'mc-stickers-scene-brand-v3.splinecode',
};

const require = createRequire(import.meta.url);
const esbuildPath = require.resolve('esbuild', { paths: [resolve(projectRoot, 'node_modules', 'vite')] });
const { build } = await import(pathToFileURL(esbuildPath).href);

const packageVersion = (name) => {
  const packageJsonPath = resolve(projectRoot, 'node_modules', name, 'package.json');
  return JSON.parse(readFileSync(packageJsonPath, 'utf8')).version;
};

const packageVersions = {
  react: packageVersion('react'),
  reactDom: packageVersion('react-dom'),
  router: packageVersion('react-router-dom'),
  motion: packageVersion('motion'),
  lucide: packageVersion('lucide-react'),
  gsap: packageVersion('gsap'),
  splineReact: packageVersion('@splinetool/react-spline'),
  splineRuntime: packageVersion('@splinetool/runtime'),
};

const importMap = {
  imports: {
    react: `https://esm.sh/react@${packageVersions.react}?target=es2022`,
    'react/jsx-runtime': `https://esm.sh/react@${packageVersions.react}/jsx-runtime?target=es2022`,
    'react-dom': `https://esm.sh/react-dom@${packageVersions.reactDom}?external=react&target=es2022`,
    'react-dom/client': `https://esm.sh/react-dom@${packageVersions.reactDom}/client?external=react&target=es2022`,
    'react-router-dom': `https://esm.sh/react-router-dom@${packageVersions.router}?external=react,react-dom&target=es2022`,
    'motion/react': `https://esm.sh/motion@${packageVersions.motion}/react?external=react,react-dom&target=es2022`,
    'lucide-react': `https://esm.sh/lucide-react@${packageVersions.lucide}?external=react&target=es2022`,
    gsap: `https://esm.sh/gsap@${packageVersions.gsap}?target=es2022`,
    'gsap/ScrollTrigger': `https://esm.sh/gsap@${packageVersions.gsap}/ScrollTrigger?target=es2022`,
    '@splinetool/react-spline': `https://esm.sh/@splinetool/react-spline@${packageVersions.splineReact}?external=react,react-dom,@splinetool/runtime&target=es2022`,
    // Do not transpile the Spline runtime through esm.sh. Its renderer modules
    // must remain byte-for-byte compatible with the package's relative chunks.
    '@splinetool/runtime': `https://unpkg.com/@splinetool/runtime@${packageVersions.splineRuntime}/build/runtime.js`,
  },
};

const replaceRouteLiterals = (source) => {
  let transformed = source;

  // Protect the native Shopify contact action before remapping page routes.
  transformed = transformed.replaceAll("shopifyContactForm.action || '/contact'", "shopifyContactForm.action || '__MC_NATIVE_CONTACT__'");
  transformed = transformed.replaceAll('shopifyContactForm.action || "/contact"', 'shopifyContactForm.action || "__MC_NATIVE_CONTACT__"');

  for (const [localRoute, shopifyRoute] of Object.entries(routeMap).filter(([route]) => route !== '/')) {
    transformed = transformed.replaceAll(`'${localRoute}'`, `'${shopifyRoute}'`);
    transformed = transformed.replaceAll(`"${localRoute}"`, `"${shopifyRoute}"`);
  }

  // Root only appears as a Link target in the selected header/footer source.
  transformed = transformed.replaceAll('to="/"', `to="${routeMap['/']}"`);
  transformed = transformed.replaceAll("to='/'", `to='${routeMap['/']}'`);

  return transformed.replaceAll('__MC_NATIVE_CONTACT__', '/contact');
};

const sourceTransformPlugin = {
  name: 'shopify-stickers-source-transform',
  setup(buildApi) {
    buildApi.onLoad({ filter: /src[\\/].*\.[cm]?[jt]sx?$/ }, (args) => {
      const source = readFileSync(args.path, 'utf8');
      const extension = args.path.split('.').pop();
      const loader = extension === 'tsx' ? 'tsx' : extension === 'ts' ? 'ts' : extension === 'jsx' ? 'jsx' : 'js';
      return { contents: replaceRouteLiterals(source), loader };
    });
  },
};

const findCompiledCss = () => {
  const viteAssetsDir = resolve(projectRoot, 'dist', 'assets');
  if (!existsSync(viteAssetsDir)) throw new Error('dist/assets is missing. Run npm run build first.');
  const cssFiles = readdirSync(viteAssetsDir).filter((name) => /^index-.*\.css$/.test(name));
  if (cssFiles.length !== 1) {
    throw new Error(`Expected one compiled index CSS file in dist/assets; found ${cssFiles.length}. Run npm run build first.`);
  }
  const cssPath = join(viteAssetsDir, cssFiles[0]);
  const srcRoot = resolve(projectRoot, 'src');
  const latestSourceMtime = readdirSync(srcRoot, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => statSync(resolve(entry.parentPath, entry.name)).mtimeMs)
    .reduce((latest, value) => Math.max(latest, value), 0);
  if (statSync(cssPath).mtimeMs < latestSourceMtime) {
    throw new Error('Compiled CSS is older than current source. Run npm run build before packaging Shopify.');
  }
  return cssPath;
};

const outputRoot = resolve(projectRoot, 'tmp') + sep;
if (!outputDir.startsWith(outputRoot)) throw new Error(`Refusing to clean unexpected output path: ${outputDir}`);
rmSync(outputDir, { recursive: true, force: true });
mkdirSync(assetsDir, { recursive: true });
mkdirSync(templatesDir, { recursive: true });

const appOutput = join(assetsDir, 'mc-stickers-app.js');
await build({
  stdin: {
    contents: [
      "import { createElement } from 'react';",
      "import { createRoot } from 'react-dom/client';",
      "import { BrowserRouter } from 'react-router-dom';",
      "import BrandedScrollbar from './src/components/BrandedScrollbar.tsx';",
      "import SiteHeader from './src/components/SiteHeader.tsx';",
      "import SiteFooter from './src/components/SiteFooter.tsx';",
      "import StickerScenePreheat from './src/components/StickerScenePreheat.tsx';",
      "import StickersPage from './src/pages/StickersPage.tsx';",
      'function StickerStorefront(){',
      "  return createElement(BrowserRouter, null, createElement(StickerScenePreheat), createElement(BrandedScrollbar), createElement(SiteHeader), createElement(StickersPage), createElement(SiteFooter));",
      '}',
      "createRoot(document.getElementById('mc-stickers-root')).render(createElement(StickerStorefront));",
    ].join('\n'),
    loader: 'tsx',
    resolveDir: projectRoot,
    sourcefile: 'shopify-stickers-entry.tsx',
  },
  bundle: true,
  outfile: appOutput,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  splitting: false,
  minify: true,
  legalComments: 'none',
  treeShaking: true,
  plugins: [sourceTransformPlugin],
  external: [
    'react',
    'react/jsx-runtime',
    'react-dom',
    'react-dom/client',
    'react-router-dom',
    'motion/react',
    'lucide-react',
    'gsap',
    'gsap/ScrollTrigger',
    '@splinetool/react-spline',
    '@splinetool/runtime',
  ],
  define: {
    'import.meta.env.DEV': 'false',
    'import.meta.env.VITE_FORM_PROVIDER': '""',
    'import.meta.env.VITE_STICKER_QUOTE_ENDPOINT': '""',
  },
});

let appJavaScript = readFileSync(appOutput, 'utf8');
const referencedPublicAssets = new Set();
appJavaScript = appJavaScript.replace(/(["'])(\/assets\/(?:images|brand|3d)\/[^"']+)\1/g, (_match, _quote, publicPath) => {
  referencedPublicAssets.add(publicPath);
  return `__mcAsset(${JSON.stringify(publicPath)})`;
});

const runtimePrelude = [
  'const __mcAsset=(path)=>globalThis.__MC_STICKER_ASSETS__?.[path]??path;',
  '',
].join('\n');
appJavaScript = `${runtimePrelude}${appJavaScript}`;
writeFileSync(appOutput, appJavaScript);

if (/(?<!__mcAsset\()(["'])\/assets\/(?:images|brand|3d)\//.test(appJavaScript)) {
  throw new Error('Generated app bundle still contains an unresolved public image, brand, or 3D asset URL.');
}
if (!appJavaScript.includes('import("@splinetool/react-spline")')) {
  throw new Error('Spline React is not preserved as an external dynamic import.');
}
if (/<\/script/i.test(appJavaScript)) {
  throw new Error('Generated JavaScript contains a closing script sequence.');
}
for (const shopifyRoute of Object.values(routeMap)) {
  if (!appJavaScript.includes(shopifyRoute)) throw new Error(`Generated bundle is missing Shopify route ${shopifyRoute}.`);
}

const cssPath = findCompiledCss();
let css = readFileSync(cssPath, 'utf8');
const referencedFonts = new Set();
css = css.replace(/url\((["']?)(\/assets\/fonts\/[^)'"\s]+)\1\)/g, (_match, _quote, publicPath) => {
  referencedFonts.add(publicPath);
  // Font faces are emitted in the Liquid template so asset_url can be resolved there.
  return 'url(about:blank)';
});
css = css.replace(/@font-face\{[^}]*url\(about:blank\)[^}]*\}/g, '');
if (/\/assets\//.test(css)) throw new Error('Generated CSS still contains an unresolved public asset URL.');
const cssOutput = join(assetsDir, 'mc-stickers-app.css');
writeFileSync(cssOutput, css);

const usedPublicAssets = new Set([...referencedPublicAssets, ...referencedFonts]);
for (const publicPath of usedPublicAssets) {
  const themeFilename = publicAssetMap[publicPath];
  if (!themeFilename) throw new Error(`No Shopify asset mapping exists for ${publicPath}.`);
  const source = resolve(projectRoot, 'public', publicPath.replace(/^\/assets\//, 'assets/'));
  if (!existsSync(source)) throw new Error(`Referenced public asset is missing: ${source}`);
  copyFileSync(source, join(assetsDir, themeFilename));
}

const assetMapLiquid = [...referencedPublicAssets]
  .sort()
  .map((publicPath) => `      ${JSON.stringify(publicPath)}: {{ ${JSON.stringify(publicAssetMap[publicPath])} | asset_url | json }}`)
  .join(',\n');

const fontFaceLiquid = [
  `@font-face{font-family:"Anton";src:url("{{ '${publicAssetMap['/assets/fonts/anton-regular.woff2']}' | asset_url }}") format("woff2");font-display:swap;font-style:normal;font-weight:400}`,
  `@font-face{font-family:"Inter";src:url("{{ '${publicAssetMap['/assets/fonts/inter-variable.woff2']}' | asset_url }}") format("woff2-variations");font-display:swap;font-style:normal;font-weight:100 900}`,
  `@font-face{font-family:"Inter";src:url("{{ '${publicAssetMap['/assets/fonts/inter-variable-italic.woff2']}' | asset_url }}") format("woff2-variations");font-display:swap;font-style:italic;font-weight:100 900}`,
  `@font-face{font-family:"Space Grotesk";src:url("{{ '${publicAssetMap['/assets/fonts/space-grotesk-variable.woff2']}' | asset_url }}") format("woff2-variations");font-display:swap;font-style:normal;font-weight:300 700}`,
].join('');

const serverPreheatStyles = `
html,body{margin:0}html:has(.mc-preheat-shell),body:has(.mc-preheat-shell){overflow:hidden;overscroll-behavior:none}.mc-preheat-shell{position:fixed;inset:0;z-index:220;display:grid;overflow:auto;overscroll-behavior:contain;background:#fff;color:#101820;font-family:Inter,Arial,sans-serif}.mc-preheat-shell__inner{display:flex;width:min(512px,calc(100% - 40px));min-height:100%;margin:auto;padding:48px 0;box-sizing:border-box;flex-direction:column;align-items:center;justify-content:center;text-align:center}.mc-preheat-shell__logo{width:min(240px,64vw);height:auto}.mc-preheat-shell__phase{display:flex;align-items:center;gap:12px;margin:40px 0 0;color:#CC112C;font:700 11px/1 "Space Grotesk",sans-serif;letter-spacing:.16em;text-transform:uppercase}.mc-preheat-shell__dot{width:8px;height:8px;border-radius:999px;background:#CC112C;animation:mc-preheat-pulse 1s ease-in-out infinite}.mc-preheat-shell__title{max-width:12ch;margin:20px 0 0;font:700 clamp(50px,7vw,84px)/.9 Anton,sans-serif;letter-spacing:-.035em;text-transform:uppercase}.mc-preheat-shell__detail{max-width:384px;margin:18px 0 0;color:rgba(16,24,32,.58);font:600 15px/1.65 Inter,Arial,sans-serif}.mc-preheat-shell__progress{width:100%;margin-top:40px;text-align:left}.mc-preheat-shell__progress-meta{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;color:rgba(16,24,32,.5);font:700 10px/1 "Space Grotesk",sans-serif;letter-spacing:.14em;text-transform:uppercase}.mc-preheat-shell__progress-meta strong{color:rgba(16,24,32,.72);font-size:11px;letter-spacing:0}.mc-preheat-shell__bar{height:8px;margin-top:12px;overflow:hidden;border-radius:999px;background:rgba(16,24,32,.1)}.mc-preheat-shell__bar:after{content:"";display:block;width:32%;height:100%;border-radius:999px;background:#CB9933;transform:translateX(-100%);animation:mc-preheat-load 1.3s ease-in-out infinite}.mc-preheat-shell__progress-status{margin:12px 0 0;text-align:center;color:rgba(16,24,32,.45);font:700 9px/1 "Space Grotesk",sans-serif;letter-spacing:.13em;text-transform:uppercase}@keyframes mc-preheat-pulse{50%{opacity:.32}}@keyframes mc-preheat-load{0%{transform:translateX(-100%)}100%{transform:translateX(315%)}}@media(max-width:540px){.mc-preheat-shell__inner{width:min(100% - 32px,512px);padding:36px 0}}@media(prefers-reduced-motion:reduce){.mc-preheat-shell__dot,.mc-preheat-shell__bar:after{animation:none}.mc-preheat-shell__bar:after{transform:none}}
`;

const physicalRoutesJson = JSON.stringify(Object.values(routeMap));
const template = [
  '{% layout none %}',
  '<!doctype html>',
  '<html lang="{{ request.locale.iso_code | default: \'en\' }}">',
  '  <head>',
  '    <meta charset="utf-8">',
  '    <meta name="viewport" content="width=device-width,initial-scale=1">',
  '    <meta name="theme-color" content="#ffffff">',
  '    <title>Custom Stickers | Merchcraft</title>',
  '    <meta name="description" content="Explore custom sticker formats and surface directions, then request an official sticker quote from Merchcraft.">',
  '    {{ content_for_header }}',
  `    {{ '${publicAssetMap['/assets/fonts/anton-regular.woff2']}' | asset_url | preload_tag: as: 'font', type: 'font/woff2' }}`,
  `    {{ '${publicAssetMap['/assets/images/stickers-hero-v2.webp']}' | asset_url | preload_tag: as: 'image' }}`,
  `    <link rel="preload" href="{{ '${publicAssetMap['/assets/3d/stickers-scene-brand-v3.splinecode']}' | asset_url }}" as="fetch" crossorigin="anonymous" fetchpriority="high" data-mc-sticker-scene-preheat>`,
  `    {{ 'mc-stickers-app.css' | asset_url | stylesheet_tag }}`,
  `    <style>${fontFaceLiquid}${serverPreheatStyles}</style>`,
  '    <script async crossorigin src="/cdn/shopifycloud/importmap-polyfill/es-modules-shim.2.4.0.js"></script>',
  `    <script type="importmap">${JSON.stringify(importMap)}</script>`,
  '    <script>',
  '      (() => {',
  '        const current = new URL(location.href);',
  '        const originalRenderer = current.searchParams.get("renderer");',
  '        if (originalRenderer !== "webgl") {',
  '          current.searchParams.set("renderer", "webgl");',
  '          history.replaceState(history.state, "", current);',
  '          const restoreRenderer = () => {',
  '            const restored = new URL(location.href);',
  '            if (originalRenderer === null) restored.searchParams.delete("renderer");',
  '            else restored.searchParams.set("renderer", originalRenderer);',
  '            history.replaceState(history.state, "", restored);',
  '          };',
  '          window.addEventListener("mc:spline-ready", restoreRenderer, { once: true });',
  '          window.addEventListener("mc:spline-error", restoreRenderer, { once: true });',
  '        }',
  '      })();',
  '      window.addEventListener("mc:preheat-mounted", () => document.getElementById("mc-stickers-preheat-shell")?.remove(), { once: true });',
  '      globalThis.__MC_STICKER_ASSETS__ = {',
  assetMapLiquid,
  '      };',
  '      (() => {',
  `        const physicalRoutes = new Set(${physicalRoutesJson});`,
  '        const previewThemeId = new URLSearchParams(location.search).get("preview_theme_id");',
  '        document.addEventListener("click", (event) => {',
  '          if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;',
  '          const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;',
  '          if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;',
  '          const next = new URL(anchor.href, location.href);',
  '          if (next.origin !== location.origin || !physicalRoutes.has(next.pathname)) return;',
  '          if (previewThemeId) next.searchParams.set("preview_theme_id", previewThemeId);',
  '          event.preventDefault();',
  '          event.stopImmediatePropagation();',
  '          location.assign(`${next.pathname}${next.search}${next.hash}`);',
  '        }, true);',
  '      })();',
  '    </script>',
  '  </head>',
  '  <body>',
  '    <div id="mc-stickers-preheat-shell" class="mc-preheat-shell" role="status" aria-live="polite" aria-busy="true" aria-label="Loading your sticker page">',
  '      <div class="mc-preheat-shell__inner">',
  `        <img class="mc-preheat-shell__logo" src="{{ '${publicAssetMap['/assets/brand/merchcraft-primary-full.svg']}' | asset_url }}" alt="Merchcraft">`,
  '        <p class="mc-preheat-shell__phase"><span class="mc-preheat-shell__dot" aria-hidden="true"></span>Loading stickers</p>',
  '        <p class="mc-preheat-shell__title">Loading your sticker page</p>',
  '        <p class="mc-preheat-shell__detail">Fresh ink, strong glue, and a little motion. Almost ready.</p>',
  '        <div class="mc-preheat-shell__progress"><div class="mc-preheat-shell__progress-meta"><span>Loading</span><strong>Please wait</strong></div><div class="mc-preheat-shell__bar" aria-hidden="true"></div><p class="mc-preheat-shell__progress-status">Loading</p></div>',
  '      </div>',
  '    </div>',
  "    {% form 'contact', id: 'mc-shopify-contact-form', class: 'contact-form' %}",
  '      {% if form.posted_successfully? %}',
  '        <div role="status" tabindex="-1" autofocus style="position:fixed;z-index:1000;top:1rem;left:50%;width:min(92vw,44rem);transform:translateX(-50%);background:#101820;color:#fff;padding:1rem 1.25rem;font:700 0.8rem/1.5 Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase;box-shadow:0 12px 40px rgba(16,24,32,.2)">Sticker quote request received. Merchcraft will review the details and follow up.</div>',
  '      {% elsif form.errors %}',
  '        <div role="alert" tabindex="-1" autofocus style="position:fixed;z-index:1000;top:1rem;left:50%;width:min(92vw,44rem);transform:translateX(-50%);background:#CC112C;color:#fff;padding:1rem 1.25rem;font:700 0.8rem/1.5 Inter,sans-serif;box-shadow:0 12px 40px rgba(16,24,32,.2)">{{ form.errors | default_errors }}</div>',
  '      {% endif %}',
  '      <div hidden aria-hidden="true">',
  '        <input type="hidden" name="contact[tags]" value="Sticker quote request">',
  '      </div>',
  '    {% endform %}',
  '    <div id="mc-stickers-root"></div>',
  '    <noscript>This page requires JavaScript.</noscript>',
  `    <script type="module" src="{{ 'mc-stickers-app.js' | asset_url }}"></script>`,
  '  </body>',
  '</html>',
  '',
].join('\n');

if (Buffer.byteLength(template) > 256 * 1024) throw new Error('Liquid template exceeds Shopify\'s 256 KB file limit.');
const templateOutput = join(templatesDir, 'page.merchcraft-stickers.liquid');
writeFileSync(templateOutput, template);

const md5 = (path) => createHash('md5').update(readFileSync(path)).digest('hex');
const packageFiles = [];
for (const directory of ['assets', 'templates']) {
  for (const name of readdirSync(join(themeDir, directory))) {
    const absolute = join(themeDir, directory, name);
    const filename = `${directory}/${name}`;
    const binary = !/\.(?:css|js|json|liquid|svg)$/i.test(name);
    packageFiles.push({
      filename,
      source: relative(projectRoot, absolute).replaceAll('\\', '/'),
      bodyType: binary ? 'BASE64' : 'TEXT',
      bytes: statSync(absolute).size,
      checksumMd5: md5(absolute),
    });
  }
}

packageFiles.sort((left, right) => left.filename.localeCompare(right.filename));
const manifest = {
  generatedAt: new Date().toISOString(),
  deploymentScope: 'UNPUBLISHED_STAGING_THEME_ONLY',
  stagingTheme,
  forbiddenThemeIds: [liveThemeId],
  page: {
    title: 'Custom Stickers',
    handle: 'mc-rebrand-stickers',
    templateSuffix: 'merchcraft-stickers',
    isPublished: true,
    previewUrl: `https://merch-craft.com/pages/mc-rebrand-stickers?preview_theme_id=${stagingTheme.previewId}`,
  },
  formDelivery: {
    provider: 'Shopify native contact form',
    supportsProjectDetails: true,
    supportsArtworkUpload: false,
    artworkFallback: 'Artwork share link field',
  },
  externalRuntime: {
    provider: 'esm.sh + unpkg',
    pinnedVersions: packageVersions,
    importMap,
  },
  routes: routeMap,
  files: packageFiles,
};

writeFileSync(join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

const totalBytes = packageFiles.reduce((sum, file) => sum + file.bytes, 0);
console.log(JSON.stringify({
  output: relative(projectRoot, outputDir).replaceAll('\\', '/'),
  files: packageFiles.length,
  totalBytes,
  appJavaScriptBytes: statSync(appOutput).size,
  cssBytes: statSync(cssOutput).size,
  templateBytes: statSync(templateOutput).size,
  publicAssets: [...usedPublicAssets].sort(),
  splineRuntimeExternalized: true,
  page: manifest.page,
}, null, 2));
