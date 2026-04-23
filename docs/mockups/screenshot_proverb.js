const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  // Scroll down to see daily-quote / culture-hub section
  await page.evaluate(() => window.scrollBy(0, 900));
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: '/tmp/hakka_scroll1.png', fullPage: false });
  await page.evaluate(() => window.scrollBy(0, 900));
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: '/tmp/hakka_scroll2.png', fullPage: false });
  console.log('scrolled screenshots saved');
  await browser.close();
})();
