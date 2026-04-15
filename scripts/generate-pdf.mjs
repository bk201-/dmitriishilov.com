import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, statSync, existsSync } from 'fs';
import { resolve, join, extname } from 'path';
const DIST = resolve('dist');
const PORT = 4321;
const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};
// Simple static file server
const server = createServer((req, res) => {
  let filePath = join(DIST, req.url === '/' ? '/index.html' : req.url);
  // If path ends without extension, try /index.html
  if (!extname(filePath)) filePath = join(filePath, 'index.html');
  try {
    const data = readFileSync(filePath);
    const ext = extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});
async function generatePdf(page, url, outputPath) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: false,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });
  const size = statSync(outputPath).size;
  console.log(`  ✓ ${outputPath} (${(size / 1024).toFixed(1)} KB)`);
  if (size < 10240) throw new Error(`PDF too small: ${outputPath} is ${size} bytes`);
}
server.listen(PORT, async () => {
  console.log(`Static server on http://localhost:${PORT}`);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    await generatePdf(page, `http://localhost:${PORT}/`, resolve('dist/cv-en.pdf'));
    // Russian version (only when the page exists in dist)
    if (existsSync(resolve('dist/ru/index.html'))) {
      await generatePdf(page, `http://localhost:${PORT}/ru/`, resolve('dist/cv-ru.pdf'));
    } else {
      console.log('  ⓘ /ru/ page not built — skipping Russian PDF');
    }
  } finally {
    await browser.close();
    server.close();
  }
  console.log('PDF generation complete!');
});
