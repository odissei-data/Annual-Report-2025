name: Generate PDF

on:
  push:
    branches: [main]
    paths:
      - 'index.html'
      - 'assets/**'

permissions:
  contents: write

jobs:
  pdf:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm install puppeteer cheerio

      - name: Generate print layout from index.html
        run: node generate-print.js

      - name: Generate PDF from print layout
        run: |
          node -e "
          const puppeteer = require('puppeteer');
          const path = require('path');
          (async () => {
            const browser = await puppeteer.launch({
              headless: true,
              args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();
            await page.setViewport({ width: 794, height: 1123 });
            await page.goto('file://' + path.resolve('print-generated.html'), {
              waitUntil: 'networkidle0',
              timeout: 60000
            });
            await new Promise(r => setTimeout(r, 3000));
            await page.pdf({
              path: 'ODISSEI-Annual-Report-2025.pdf',
              format: 'A4',
              printBackground: true,
              margin: { top: 0, bottom: 0, left: 0, right: 0 }
            });
            await browser.close();
            console.log('PDF generated');
          })();
          "

      - name: Commit PDF back to repo
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add ODISSEI-Annual-Report-2025.pdf
          git diff --staged --quiet || git commit -m "Auto-generate PDF [skip ci]"
          git push
