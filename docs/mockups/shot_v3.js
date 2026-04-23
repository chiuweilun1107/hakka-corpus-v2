const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000/corpus/proverb_theme_%E5%AE%A2%E5%AE%B6%E5%8B%95%E6%A4%8D%E7%89%A9%E8%AB%BA%E8%AA%9E%E9%9B%86', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: '/tmp/corpus_detail_v3.png', fullPage: false });
  console.log('detail saved');
  await browser.close();
})();
