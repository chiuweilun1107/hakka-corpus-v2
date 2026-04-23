const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000/corpus', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: '/tmp/corpus_list.png', fullPage: false });
  console.log('list saved');
  await page.goto('http://localhost:3000/corpus/proverb_theme_客家飲食諺語集', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: '/tmp/corpus_detail.png', fullPage: false });
  console.log('detail (original) saved');
  // Switch to AI tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const ai = btns.find(b => b.textContent.includes('AI 主題'));
    if (ai) ai.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: '/tmp/corpus_detail_ai.png', fullPage: false });
  console.log('detail (ai) saved');
  await browser.close();
})();
