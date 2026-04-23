const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const results = { datagovtw: [], hakkacorpus: {}, errors: [] };

  // 1. data.gov.tw 搜尋「客語」
  try {
    await page.goto('https://data.gov.tw/search?q=' + encodeURIComponent('客語'), { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: '/tmp/datagovtw.png', fullPage: false });
    const datasets = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('a').forEach(a => {
        const t = a.textContent.trim();
        if ((t.includes('客語') || t.includes('客家語')) && t.length < 100 && a.href) {
          items.push({ text: t.substring(0, 80), href: a.href });
        }
      });
      return items.slice(0, 30);
    });
    results.datagovtw = datasets;
    console.log(`data.gov.tw: ${datasets.length} 筆客語相關連結`);
  } catch (e) {
    results.errors.push('datagovtw: ' + e.message);
  }

  // 2. corpus.hakka.gov.tw
  try {
    await page.goto('https://corpus.hakka.gov.tw/', { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: '/tmp/corpus_home.png', fullPage: true });
    const info = await page.evaluate(() => ({
      title: document.title,
      bodyText: document.body.innerText.substring(0, 800),
      links: Array.from(document.querySelectorAll('a[href]')).slice(0, 40).map(a => ({
        text: a.textContent.trim().substring(0, 60),
        href: a.href
      })).filter(x => x.text && !x.href.startsWith('javascript:'))
    }));
    results.hakkacorpus = info;
    console.log(`corpus.hakka.gov.tw: ${info.links.length} 連結, title="${info.title}"`);
  } catch (e) {
    results.errors.push('hakkacorpus: ' + e.message);
  }

  fs.writeFileSync('/tmp/source_scan.json', JSON.stringify(results, null, 2));
  console.log('Saved /tmp/source_scan.json');
  await browser.close();
})();
