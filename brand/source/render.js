const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ deviceScaleFactor: 2 });
  for (const f of process.argv.slice(2)) {
    const svg = fs.readFileSync(f, 'utf8');
    const [, w, h] = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
    await p.setViewportSize({ width: +w, height: +h });
    await p.setContent(`<html><body style="margin:0">${svg}</body></html>`);
    await p.screenshot({ omitBackground: true, path: f.replace(/\.svg$/, '.png'), clip: { x: 0, y: 0, width: +w, height: +h } });
  }
  await b.close();
})();
