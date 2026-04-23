const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  // Hover on 語言資源 to show dropdown
  const navs = await page.$$('nav a, nav button');
  for (const n of navs) {
    const txt = await page.evaluate(el => el.textContent.trim(), n);
    if (txt.includes('語言資源')) { await n.hover(); await new Promise(r=>setTimeout(r,500)); break; }
  }
  await page.screenshot({ path: '/tmp/home_with_nav.png', fullPage: false });
  console.log('saved');
  await browser.close();
})();
