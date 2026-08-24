import { createRequire } from 'node:module';
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '..');
const require = createRequire(import.meta.url);
const esbuildPath = require.resolve('esbuild', { paths: [resolve(projectRoot, 'node_modules', 'vite')] });
const { build } = await import(pathToFileURL(esbuildPath).href);
const outputDir = resolve(projectRoot, 'tmp', 'shopify');
const appOutput = join(outputDir, 'merchcraft-rebrand-app.js');
const cssOutput = join(outputDir, 'merchcraft-rebrand-app.css');
const snippetOutput = join(outputDir, 'merchcraft-rebrand-app.generated.liquid');

const routeMap = {
  '/': '/pages/mc-rebrand-home',
  '/services': '/pages/mc-rebrand-services',
  '/about': '/pages/mc-rebrand-about',
  '/contact': '/pages/mc-rebrand-contact',
  '/quote': '/pages/mc-rebrand-quote',
  '/stickers': '/pages/mc-rebrand-stickers',
};

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
  },
};

const replaceRouteLiterals = (source, sourcePath) => {
  let transformed = source;

  // The sticker page has its own Shopify template/package because it carries
  // the Spline runtime and preheat shell. Keep it out of the shared five-page
  // bundle so the homepage/services/about/contact/quote carrier stays lean and
  // never inherits Spline's optional dynamic runtime imports.
  if (sourcePath.endsWith(`${join('src', 'App.tsx')}`)) {
    transformed = transformed.replace(
      "import StickerScenePreheat from './components/StickerScenePreheat';",
      'const StickerScenePreheat = () => null;',
    );
    transformed = transformed.replace(
      "const StickersPage = lazy(() => import('./pages/StickersPage'));",
      'const StickersPage = () => null;',
    );
  }

  // Keep the Shopify native contact endpoint literal intact while route strings are mapped.
  transformed = transformed.replaceAll("shopifyContactForm.action || '/contact'", "shopifyContactForm.action || '__MC_NATIVE_CONTACT__'");
  transformed = transformed.replaceAll('shopifyContactForm.action || "/contact"', 'shopifyContactForm.action || "__MC_NATIVE_CONTACT__"');

  for (const [localRoute, shopifyRoute] of Object.entries(routeMap).filter(([route]) => route !== '/')) {
    transformed = transformed.replaceAll(`'${localRoute}'`, `'${shopifyRoute}'`);
    transformed = transformed.replaceAll(`"${localRoute}"`, `"${shopifyRoute}"`);
    transformed = transformed.replaceAll(`\`${localRoute}?`, `\`${shopifyRoute}?`);
  }

  // Root is also used by form POSTs, so only remap router-related source locations.
  transformed = transformed.replaceAll('to="/"', `to="${routeMap['/']}"`);
  transformed = transformed.replaceAll("to='/'", `to='${routeMap['/']}'`);
  if (sourcePath.endsWith(`${join('src', 'App.tsx')}`)) {
    transformed = transformed.replace("  '/': {", `  '${routeMap['/']}': {`);
    transformed = transformed.replace("metadata['/']", `metadata['${routeMap['/']}']`);
    transformed = transformed.replace('path="/"', `path="${routeMap['/']}"`);
  }

  return transformed.replaceAll('__MC_NATIVE_CONTACT__', '/contact');
};

const sourceTransformPlugin = {
  name: 'shopify-source-transform',
  setup(buildApi) {
    buildApi.onLoad({ filter: /src[\\/].*\.[cm]?[jt]sx?$/ }, (args) => {
      const source = readFileSync(args.path, 'utf8');
      const extension = args.path.split('.').pop();
      const loader = extension === 'tsx' ? 'tsx' : extension === 'ts' ? 'ts' : extension === 'jsx' ? 'jsx' : 'js';
      return { contents: replaceRouteLiterals(source, args.path), loader };
    });
  },
};

const findCompiledCss = () => {
  const assetsDir = resolve(projectRoot, 'dist', 'assets');
  const cssFiles = readdirSync(assetsDir).filter((name) => /^index-.*\.css$/.test(name));
  if (cssFiles.length !== 1) {
    throw new Error(`Expected one compiled index CSS file in dist/assets; found ${cssFiles.length}. Run npm run build first.`);
  }
  const cssPath = join(assetsDir, cssFiles[0]);
  const latestSourceMtime = readdirSync(resolve(projectRoot, 'src'), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => statSync(resolve(entry.parentPath, entry.name)).mtimeMs)
    .reduce((latest, value) => Math.max(latest, value), 0);
  if (statSync(cssPath).mtimeMs < latestSourceMtime) {
    throw new Error('Compiled CSS is older than the current source. Run npm run build before building the Shopify snippet.');
  }
  return cssPath;
};

mkdirSync(outputDir, { recursive: true });

await build({
  stdin: {
    contents: [
      "import { StrictMode, createElement } from 'react';",
      "import { createRoot } from 'react-dom/client';",
      "import App from './src/App.tsx';",
      "createRoot(document.getElementById('root')).render(createElement(StrictMode, null, createElement(App)));",
    ].join('\n'),
    loader: 'tsx',
    resolveDir: projectRoot,
    sourcefile: 'shopify-entry.tsx',
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
  ],
  define: {
    'import.meta.env.VITE_FORM_PROVIDER': '""',
    'import.meta.env.VITE_STICKER_QUOTE_ENDPOINT': '""',
  },
});

let appJavaScript = readFileSync(appOutput, 'utf8');
const assetPaths = new Set();
appJavaScript = appJavaScript.replace(/(["'])\/assets\/(?:images|brand)\/([^"']+)\1/g, (_match, _quote, filename) => {
  assetPaths.add(filename);
  return `__mcAsset(${JSON.stringify(filename)})`;
});

const runtimePrelude = [
  `const __mcAsset=(name)=>globalThis.__MC_ASSETS__?.[name]??\`${'${'}(globalThis.__MC_ASSET_BASE__??'/').replace(/\\/?$/, '/')}\${name}\`;`,
  'if(!globalThis.__MC_STICKER_NAVIGATION_PATCHED__){',
  `  const stickerRoute=${JSON.stringify(routeMap['/stickers'])};`,
  '  const previewThemeId=new URLSearchParams(location.search).get("preview_theme_id");',
  '  document.addEventListener("click",(event)=>{',
  '    if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;',
  '    const anchor=event.target instanceof Element?event.target.closest("a[href]"):null;',
  '    if(!anchor||anchor.target==="_blank"||anchor.hasAttribute("download"))return;',
  '    const next=new URL(anchor.href,location.href);',
  '    if(next.origin!==location.origin||next.pathname!==stickerRoute)return;',
  '    if(previewThemeId)next.searchParams.set("preview_theme_id",previewThemeId);',
  '    event.preventDefault();',
  '    event.stopImmediatePropagation();',
  '    location.assign(`${next.pathname}${next.search}${next.hash}`);',
  '  },true);',
  '  globalThis.__MC_STICKER_NAVIGATION_PATCHED__=true;',
  '}',
  'if(!globalThis.__MC_PREVIEW_HISTORY_PATCHED__){',
  '  const previewThemeId=new URLSearchParams(location.search).get("preview_theme_id");',
  '  if(previewThemeId){',
  '    for(const method of ["pushState","replaceState"]){',
  '      const original=history[method].bind(history);',
  '      history[method]=(state,unused,url)=>{',
  '        if(url!=null){',
  '          const next=new URL(String(url),location.href);',
  '          if(next.origin===location.origin&&next.pathname.startsWith("/pages/mc-rebrand-")){',
  '            next.searchParams.set("preview_theme_id",previewThemeId);',
  '            url=`${next.pathname}${next.search}${next.hash}`;',
  '          }',
  '        }',
  '        return original(state,unused,url);',
  '      };',
  '    }',
  '  }',
  '  globalThis.__MC_PREVIEW_HISTORY_PATCHED__=true;',
  '}',
  '',
].join('\n');
appJavaScript = `${runtimePrelude}${appJavaScript}`;
writeFileSync(appOutput, appJavaScript);

if (/import\s*\(/.test(appJavaScript)) {
  throw new Error('Generated Shopify bundle still contains a dynamic import. The app would require a missing chunk.');
}
if (/\/assets\/(?:images|brand)\//.test(appJavaScript)) {
  throw new Error('Generated Shopify bundle still contains an unresolved public image or brand asset path.');
}
if (/<\/script/i.test(appJavaScript)) {
  throw new Error('Generated JavaScript contains a closing script sequence and cannot be safely inlined.');
}
for (const shopifyRoute of Object.values(routeMap)) {
  if (!appJavaScript.includes(shopifyRoute)) {
    throw new Error(`Generated bundle is missing Shopify route ${shopifyRoute}.`);
  }
}

const cssPath = findCompiledCss();
let css = readFileSync(cssPath, 'utf8');
// Staging already loads these brand families in the template head. Removing local font
// URLs keeps the generated body snippet independent of Shopify theme font assets.
css = css.replace(/@font-face\{[^}]*\}/g, '');
if (/url\(\/assets\//.test(css)) {
  throw new Error('Generated Shopify CSS still contains an unresolved public asset URL.');
}
writeFileSync(cssOutput, css);

const snippet = [
  '<!-- Generated by scripts/build-shopify-staging.mjs. Do not hand-edit. -->',
  '<div id="root"></div>',
  '<div hidden aria-hidden="true">',
  "  {% form 'contact', id: 'mc-shopify-contact-form', class: 'contact-form' %}",
  '    <input type="hidden" name="contact[tags]" value="rebrand-staging">',
  '  {% endform %}',
  '</div>',
  '<noscript>This preview requires JavaScript.</noscript>',
  '<script async crossorigin fetchpriority="high" src="/cdn/shopifycloud/importmap-polyfill/es-modules-shim.2.4.0.js"></script>',
  `<script type="importmap">${JSON.stringify(importMap)}</script>`,
  `<style>${css}</style>`,
  `<script type="module">${appJavaScript}</script>`,
  '',
].join('\n');

writeFileSync(snippetOutput, snippet);

const report = {
  output: relative(projectRoot, snippetOutput).replaceAll('\\', '/'),
  cssOutput: relative(projectRoot, cssOutput).replaceAll('\\', '/'),
  appJavaScriptBytes: Buffer.byteLength(appJavaScript),
  cssBytes: Buffer.byteLength(css),
  snippetBytes: Buffer.byteLength(snippet),
  assetKeys: [...assetPaths].sort(),
  routes: routeMap,
  externalVersions: packageVersions,
};

console.log(JSON.stringify(report, null, 2));
