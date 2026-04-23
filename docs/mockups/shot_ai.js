const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  for (const [route, name] of [['ai', 'ai'], ['search/results?q=客家', 'search'], ['cooccurrence', 'cooc']]) {
    await page.goto(`http://localhost:3000/${route}`, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: `/tmp/hakka_${name}.png`, fullPage: false });
    console.log(name);
  }
  await browser.close();
})();
