import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const projectRoot = process.cwd();
const outputDirectory = resolve(projectRoot, 'dist', 'server');

const files = [
  { route: '/index.html', path: 'index.html', type: 'text/html; charset=utf-8' },
  { route: '/styles.css', path: 'styles.css', type: 'text/css; charset=utf-8' },
  { route: '/script.js', path: 'script.js', type: 'text/javascript; charset=utf-8' },
  { route: '/assets/cv-andrea-rodriguez.txt', path: 'assets/cv-andrea-rodriguez.txt', type: 'text/plain; charset=utf-8' },
  { route: '/assets/llave-publica-andrea.asc', path: 'assets/llave-publica-andrea.asc', type: 'application/pgp-keys; charset=utf-8' },
  { route: '/assets/favicon.svg', path: 'assets/favicon.svg', type: 'image/svg+xml; charset=utf-8' },
];

const ogImagePath = resolve(projectRoot, 'assets', 'og.png');
try {
  await readFile(ogImagePath);
  files.push({ route: '/assets/og.png', path: 'assets/og.png', type: 'image/png' });
} catch {
  // La imagen social se incorpora automáticamente cuando existe.
}

const assets = {};
for (const file of files) {
  const buffer = await readFile(resolve(projectRoot, file.path));
  assets[file.route] = { type: file.type, data: buffer.toString('base64') };
}

const worker = `const assets = ${JSON.stringify(assets)};

const securityHeaders = {
  'content-security-policy': "default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
};

const decode = (value) => Uint8Array.from(atob(value), (character) => character.charCodeAt(0));

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const route = url.pathname === '/' ? '/index.html' : url.pathname.replace(/\\/$/, '');
    const asset = assets[route];

    if (!asset) {
      return new Response('Página no encontrada', { status: 404, headers: securityHeaders });
    }

    let body = decode(asset.data);
    if (route === '/index.html') {
      body = new TextDecoder().decode(body).replaceAll('__SITE_ORIGIN__', url.origin);
    }

    const headers = new Headers(securityHeaders);
    headers.set('content-type', asset.type);
    headers.set('cache-control', route === '/index.html' ? 'no-cache' : 'public, max-age=86400');
    return new Response(body, { headers });
  },
};
`;

await rm(resolve(projectRoot, 'dist'), { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
await writeFile(resolve(outputDirectory, 'index.js'), worker, 'utf8');
console.log(`Built ${files.length} assets into dist/server/index.js`);
