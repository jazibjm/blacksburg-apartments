import puppeteer from 'puppeteer';
import pool from './db.ts';
import dotenv from 'dotenv';

dotenv.config();

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scrapeApartments() {
  console.log('⏳ Resetting database...');
  try {
    await pool.query(`
  CREATE TABLE IF NOT EXISTS apartments (
    id SERIAL PRIMARY KEY,
    name TEXT,
    address TEXT,
    price TEXT,
    beds TEXT,
    amenities TEXT,
    image_url TEXT,
    url TEXT UNIQUE
  );
`);
       await pool.query(`
    ALTER TABLE apartments
    ADD COLUMN IF NOT EXISTS summary TEXT;
  `);
    await pool.query('TRUNCATE TABLE apartments RESTART IDENTITY CASCADE;');
    console.log('✅ Database reset complete.');
  } catch (err) {
    console.error('❌ Failed to reset database:', err);
    return;
  }

  console.log('⏳ Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'
  );

  let currentPage = 1;

  while (true) {
    const url = `https://www.apartments.com/blacksburg-va/${currentPage}/`;
    console.log(`⏳ Navigating to page ${currentPage}: ${url}`);

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
      await page.waitForSelector('article.placard', { timeout: 45000 });
    } catch (err) {
      console.log('❌ No listings found or page blocked, stopping scraper.');
      break;
    }

    const listings = await page.$$eval('article.placard', (nodes) =>
      nodes.map((el) => {
        const name = el.querySelector('.js-placardTitle')?.textContent?.trim() || null;
        const address = el.querySelector('.property-address')?.textContent?.trim() || null;
        const price = el.querySelector('.property-pricing')?.textContent?.trim() || null;
        const beds = el.querySelector('.property-beds')?.textContent?.trim() || null;
        const amenities = Array.from(el.querySelectorAll('.property-amenities span'))
          .map((a) => a.textContent?.trim())
          .filter(Boolean)
          .join(', ');
        const image = el.querySelector('.carousel-inner img')?.getAttribute('src') || null;
        const url = el.getAttribute('data-url') || null;

        return { name, address, price, beds, amenities, image, url };
      })
    );

    if (!listings.length) {
      console.log('✅ No listings found on this page, stopping scraper.');
      break;
    }

    console.log(`✅ Found ${listings.length} listings on page ${currentPage}`);

    let duplicateFound = false;

    for (const apt of listings) {
      try {
        const result = await pool.query('SELECT 1 FROM apartments WHERE url = $1', [apt.url]);
if ((result?.rowCount ?? 0) > 0) {
  console.log(`⚠️ Duplicate detected for ${apt.name}, stopping scraper.`);
  duplicateFound = true;
  break;
}


        await pool.query(
          `
          INSERT INTO apartments (name, address, price, beds, amenities, image_url, url)
          VALUES ($1,$2,$3,$4,$5,$6,$7)
          ON CONFLICT (url) DO UPDATE SET
            name = EXCLUDED.name,
            address = EXCLUDED.address,
            price = EXCLUDED.price,
            beds = EXCLUDED.beds,
            amenities = EXCLUDED.amenities,
            image_url = EXCLUDED.image_url;
        `,
          [apt.name, apt.address, apt.price, apt.beds, apt.amenities, apt.image, apt.url]
        );
        console.log(`✅ Saved: ${apt.name}`);
      } catch (err) {
        console.error(`❌ DB insert error for ${apt.name}:`, err);
      }
    }

    if (duplicateFound) break;

    currentPage++;
    await delay(2000);
  }

  await browser.close();
  console.log('✅ Scraping complete!');
}

scrapeApartments().catch((err) => console.error('❌ Scraper error:', err));
