import puppeteer from "puppeteer";

export async function scrapeApartmentReviews(apartmentName: string) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // We'll do a Google search query for apartment + reviews
  const query = `${apartmentName} reviews site:reddit.com OR site:apartmentratings.com`;
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Scrape links from Google search results
  const links = await page.$$eval('a', anchors =>
    anchors.map(a => a.href).filter(href => href.includes('reddit.com') || href.includes('apartmentratings.com'))
  );

  const reviews: string[] = [];

  for (let link of links.slice(0, 5)) { // Limit for speed
    try {
      await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 60000 });
      const text = await page.$$eval('p', nodes => nodes.map(n => n.textContent).join(' '));
      reviews.push(text);
    } catch (err) {
      console.warn(`Failed to scrape ${link}:`, err);
    }
  }

  await browser.close();
  return reviews.join('\n');
}
