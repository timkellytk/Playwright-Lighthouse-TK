import { chromium, Browser, Page } from 'playwright';
import { playAudit } from 'playwright-lighthouse';
import * as fs from 'fs';
import * as path from 'path';

const pagesToTest = [
  'https://www.citadeltech.com.au/',
  'https://www.citadeltech.com.au/services/consulting-design',
  'https://www.citadeltech.com.au/services/installation-commissioning',
  'https://www.citadeltech.com.au/services/modern-audio-visual-integration',
  'https://www.citadeltech.com.au/services/concierge-services',
  'https://www.citadeltech.com.au/services/managed-services-and-support',
  'https://www.citadeltech.com.au/case-studies/act-traffic-management',
  'https://www.citadeltech.com.au/case-studies/brisbane-city-council',
  'https://www.citadeltech.com.au/case-studies/r8000',
  'https://www.citadeltech.com.au/case-studies/royal-adelaide-hospital',
  'https://www.citadeltech.com.au/about-us',
  'https://www.citadeltech.com.au/faqs',
  'https://www.citadeltech.com.au/contact',
];

const reportDirectory = path.join(process.cwd(), 'reports');
let browser: Browser;

/**
 * Utility to generate a slug from a URL path.
 * For example: '/services/consulting-design' => 'services-consulting-design'
 */
function urlToSlug(url: string): string {
  const { pathname } = new URL(url);
  return pathname.replace(/\//g, '-').replace(/^-|-$/g, '') || 'home';
}

beforeAll(async () => {
  try {
    // Launch a shared browser for all tests
    browser = await chromium.launch({
      args: ['--remote-debugging-port=9222'], // Enable Lighthouse debugging
    });

    // Ensure the reports directory exists
    if (!fs.existsSync(reportDirectory)) {
      fs.mkdirSync(reportDirectory, { recursive: true });
    }
  } catch (error) {
    console.error('Error setting up browser:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    await browser.close();
  } catch (error) {
    console.error('Error closing browser:', error);
  }
});

describe('Playwright web page audits using Lighthouse', () => {
  let page: Page;

  beforeEach(async () => {
    try {
      // Create a new page for each test
      page = await browser.newPage();
    } catch (error) {
      console.error('Error creating page:', error);
      throw error;
    }
  });

  afterEach(async () => {
    try {
      await page.close();
    } catch (error) {
      console.error('Error closing page:', error);
    }
  });

  pagesToTest.forEach((url) => {
    const slug = urlToSlug(url);

    describe(`Auditing ${url}`, () => {
      it('Perform web page audit with custom thresholds', async () => {
        try {
          await page.goto(url);

          await playAudit({
            page: page,
            port: 9222,
            thresholds: {
              performance: 50,
              accessibility: 50,
              'best-practices': 50,
              seo: 50,
              pwa: 50,
            },
          });
          console.log(`Custom audit completed successfully for ${url}.`);
        } catch (error) {
          console.error(`Error during custom audit for ${url}:`, error);
          throw error;
        }
      });

      it('Perform web page audit with HTML Lighthouse report', async () => {
        try {
          await page.goto(url);

          const customReportDir = path.join(reportDirectory, `${slug}.html`);
          await playAudit({
            page: page,
            port: 9222,
            thresholds: {
              performance: 50,
              accessibility: 50,
              'best-practices': 50,
              seo: 50,
              pwa: 50,
            },
            htmlReport: true,
            reportDir: path.dirname(customReportDir),
            reportName: path.basename(customReportDir),
          });

          console.log(
            `HTML report generated for ${url} at: ${customReportDir}`,
          );
        } catch (error) {
          console.error(`Error during HTML audit for ${url}:`, error);
          throw error;
        }
      });
    });
  });
});
