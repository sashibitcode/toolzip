/**
 * IndexNow API Submission Script for TOOLZIP
 * Submits updated URLs to search engines (Bing, Yandex, IndexNow endpoint)
 * Usage: node scripts/indexnow.mjs
 */

const HOST = process.env.SITE_HOST || 'toolzip.io';
const KEY = 'e9a4f6d81b3c482094c34a21f7b88902';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

const TOOL_SLUGS = [
  'jpg-to-pdf',
  'word-to-pdf',
  'excel-to-pdf',
  'ppt-to-pdf',
  'png-to-pdf',
  'html-to-pdf',
  'markdown-to-pdf',
  'txt-to-pdf',
  'code-to-pdf',
  'pdf-to-word',
  'pdf-to-excel',
  'pdf-to-ppt',
  'pdf-to-jpg',
  'pdf-to-png',
  'pdf-to-txt',
  'merge-pdf',
  'split-pdf',
  'rotate-pdf',
  'delete-pdf-pages',
  'extract-pdf-pages',
  'organize-pdf',
  'compress-pdf',
  'protect-pdf',
  'unlock-pdf',
  'flatten-pdf',
  'pdf-to-pdfa',
  'repair-pdf',
  'watermark-pdf',
  'number-pages',
  'edit-pdf',
  'sign-pdf',
];

const URL_LIST = [
  `https://${HOST}/`,
  `https://${HOST}/about`,
  `https://${HOST}/privacy`,
  `https://${HOST}/contact`,
  `https://${HOST}/llms.txt`,
  `https://${HOST}/llms-full.txt`,
  `https://${HOST}/sitemap.xml`,
  ...TOOL_SLUGS.map((slug) => `https://${HOST}/tools/${slug}`),
];

const ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
];

async function submitIndexNow() {
  console.log(`[IndexNow] Starting URL submission for host: ${HOST}`);
  console.log(`[IndexNow] Key Location: ${KEY_LOCATION}`);
  console.log(`[IndexNow] Total Target URLs: ${URL_LIST.length}`);

  const payload = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: URL_LIST,
  };

  for (const endpoint of ENDPOINTS) {
    try {
      console.log(`\n[IndexNow] Submitting to endpoint: ${endpoint}...`);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 200 || response.status === 202) {
        console.log(`[IndexNow] Success (${response.status}) at ${endpoint}! URLs queued for indexing.`);
      } else {
        const text = await response.text();
        console.warn(`[IndexNow] Response (${response.status}) from ${endpoint}: ${text || response.statusText}`);
      }
    } catch (err) {
      console.error(`[IndexNow] Failed to submit to ${endpoint}:`, err.message);
    }
  }

  console.log('\n[IndexNow] Submission process complete.');
}

submitIndexNow();
