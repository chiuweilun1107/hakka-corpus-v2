const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  for (const [url, name] of [
    ['http://localhost:3000/cooccurrence?q=客家', 'cooc_ref'],
    ['http://localhost:3000/corpus', 'corpus_list_v2'],
    ['http://localhost:3000/corpus/proverb_theme_%E5%AE%A2%E5%AE%B6%E9%A3%B2%E9%A3%9F%E8%AB%BA%E8%AA%9E%E9%9B%86', 'corpus_detail_v2'],
  ]) {
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2500));
    await page.screenshot({ path: `/tmp/${name}.png`, fullPage: false });
    console.log(name);
  }
  await browser.close();
})();
