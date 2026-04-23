const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 訪問檢索系統
  const urls = [
    'https://corpus.hakka.gov.tw/corpus/',
    'https://corpus.hakka.gov.tw/#/about-us',
    'https://corpus.hakka.gov.tw/#/copyright',
    'https://corpus.hakka.gov.tw/#/corpus-info',
  ];

  const results = [];
  for (const url of urls) {
    try {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
      await new Promise(r => setTimeout(r, 3000));
      const safeName = url.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
      await page.screenshot({ path: `/tmp/corpus_${safeName}.png`, fullPage: true });
      const info = await page.evaluate(() => ({
        title: document.title,
        h1: document.querySelector('h1')?.textContent.trim() || '',
        bodyText: document.body.innerText.substring(0, 2000),
        links: Array.from(document.querySelectorAll('a[href]')).slice(0, 50).map(a => ({
          text: a.textContent.trim().substring(0, 80),
          href: a.href
        })).filter(x => x.text && !x.href.startsWith('javascript:')),
      }));
      results.push({ url, ...info });
      console.log(`${url}: ${info.title}`);
    } catch (e) {
      console.log(`ERROR ${url}: ${e.message}`);
      results.push({ url, error: e.message });
    }
  }

  fs.writeFileSync('/tmp/corpus_detail.json', JSON.stringify(results, null, 2));
  console.log('Saved /tmp/corpus_detail.json');
  await browser.close();
})();
