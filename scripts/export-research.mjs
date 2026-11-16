import { chromium } from '@playwright/test';
import { mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = process.env.RESEARCH_BASE_URL ?? 'http://127.0.0.1:4173/slang-os/';
const application = process.argv.includes('--application');
const output = path.resolve(root, application ? 'docs/APPLICATION.pdf' : process.env.RESEARCH_PDF_PATH ?? 'docs/RESEARCH.pdf');
const applicationSource = path.join(root, 'docs', 'APPLICATION.html');
const vite = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
let server;
let browser;

async function available() {
  try { return (await fetch(base, { signal: AbortSignal.timeout(1000) })).ok; }
  catch { return false; }
}

try {
  if (!application && !existsSync(path.join(root, 'dist', 'index.html'))) {
    throw new Error('Production build is missing. Run npm run build first.');
  }
  if (application && !existsSync(applicationSource)) throw new Error('Application source docs/APPLICATION.html is missing.');
  if (!application && !(await available())) {
    server = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], {
      cwd: root,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let errorLog = '';
    server.stderr.on('data', data => { errorLog += data.toString(); });
    server.on('error', error => { errorLog += error.message; });
    for (let attempt = 0; attempt < 60 && !(await available()); attempt++) {
      if (server.exitCode !== null) throw new Error(`Preview could not start: ${errorLog}`);
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    if (!(await available())) throw new Error(`Preview did not become ready. ${errorLog}`);
  }
  const candidates = [
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    chromium.executablePath(),
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
  ];
  const executablePath = candidates.find(candidate => candidate && existsSync(candidate));
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  const page = await browser.newPage({ reducedMotion: 'reduce', viewport: { width: 1200, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(application ? pathToFileURL(applicationSource).href : `${base.replace(/\/$/, '')}/#/research`, { waitUntil: 'networkidle' });
  await page.locator('h1').first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ media: 'print', reducedMotion: 'reduce' });
  // Never export a shell or an error route as a successful research document.
  if (!application) {
    const words = await page.locator('#bilingual-table tbody tr').count();
    if (words < 20) throw new Error('Research table is incomplete.');
    if (await page.locator('#lexical-passports .research-entry').count() !== words) {
      throw new Error('Every dictionary entry needs a complete lexical passport in the submitted research.');
    }
  }
  if (application && !(await page.locator('body').innerText()).includes('Полякова Дарья Александровна')) throw new Error('Application author is missing.');
  if (errors.length) throw new Error(`Research page crashed: ${errors.join('; ')}`);
  await mkdir(path.dirname(output), { recursive: true });
  await page.pdf({
    path: output,
    format: 'A4',
    preferCSSPageSize: true,
    printBackground: false,
    displayHeaderFooter: false,
    margin: { top: '15mm', bottom: '17mm', left: '15mm', right: '15mm' },
    tagged: true,
    outline: true,
  });
  const metadata = await stat(output);
  if (metadata.size < 10_000) throw new Error('PDF is unexpectedly small; inspect the output.');
  console.log(`${application ? 'Application' : 'Research'} PDF created: ${output} (${metadata.size} bytes). Inspect all pages before submission.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await browser?.close();
  server?.kill();
}
