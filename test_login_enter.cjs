const { chromium } = require('playwright');

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log(`[BROWSER CONSOLE] [${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => console.error(`[BROWSER ERROR] ${err.message}`));
  page.on('request', req => console.log(`[NETWORK REQ] ${req.method()} ${req.url()}`));
  page.on('response', res => console.log(`[NETWORK RES] ${res.status()} ${res.url()}`));

  try {
    console.log('Navigating...');
    await page.goto('http://192.168.2.67/login');
    await page.waitForTimeout(3000);

    console.log('Focusing and typing username...');
    await page.focus('.username');
    await page.keyboard.type('ship_test', { delay: 50 });
    
    console.log('Focusing and typing password...');
    await page.focus('#password');
    await page.keyboard.type('Think@123##', { delay: 50 });
    
    await page.waitForTimeout(1000);

    console.log('Pressing Enter on password field to submit form...');
    await page.keyboard.press('Enter');
    
    console.log('Waiting 10 seconds...');
    await page.waitForTimeout(10000);
    
    console.log('Final URL:', page.url());
    
  } catch (err) {
    console.error('Error occurred:', err.message);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
})();
