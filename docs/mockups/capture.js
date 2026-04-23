const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const MOCKUP_DIR = __dirname;
const OUT_DIR = path.join(__dirname, '..', 'images');

// Find all feat_*.html in mockups/
const files = fs.readdirSync(MOCKUP_DIR)
  .filter(f => f.startsWith('feat_') && f.endsWith('.html'))
  .map(f => f.replace('.html', ''))
  .sort();

// Allow single-file mode: node capture.js feat_34_主題建模
const target = process.argv[2];
const toRender = target ? [target.replace('.html', '')] : files;

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--disable-web-security', '--allow-file-access-from-files', '--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  for (const name of toRender) {
    const htmlPath = `file://${path.join(MOCKUP_DIR, name)}.html`;
    try {
      await page.goto(htmlPath, { waitUntil: 'networkidle0', timeout: 30000 });
      await new Promise(r => setTimeout(r, 1200));

      // Output filename: feat_34_主題建模 → fig34_主題建模_AI示意.png
      const m = name.match(/^feat_(\d+)_(.+)$/);
      const outName = m ? `fig${m[1]}_${m[2]}_AI示意.png` : `${name}.png`;
      const outPath = path.join(OUT_DIR, outName);

      await page.screenshot({ path: outPath, fullPage: true });
      console.log(`✓ ${outName}`);
    } catch (err) {
      console.error(`✗ ${name}: ${err.message}`);
    }
  }

  await browser.close();
  console.log(`Done. Output: ${OUT_DIR}`);
})();
