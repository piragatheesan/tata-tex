import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import env from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

env.loadEnvConfig(process.cwd());
const origin = 'http://127.0.0.1:3108';
const output = 'artifacts/browser-review';
mkdirSync(output, { recursive: true });
const database = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
let session;
let browser;
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3108'], {
  windowsHide: true,
  stdio: ['ignore', 'pipe', 'pipe'],
});
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Local server startup timed out')), 15000);
    server.stdout.on('data', (chunk) => {
      if (chunk.toString().includes('Ready')) {
        clearTimeout(timer);
        resolve();
      }
    });
    server.on('error', reject);
  });
  const { data: product, error: productError } = await database
    .from('products')
    .select('id,slug,name')
    .eq('published', true)
    .limit(1)
    .single();
  if (productError) throw new Error('Cannot read catalogue for browser review');
  const { data: profile } = await database
    .from('profiles')
    .select('id')
    .eq('role', 'administrator')
    .limit(1)
    .single();
  const { data: account } = await database.auth.admin.getUserById(profile.id);
  // Generate a sign-in link without sending email or changing the account password.
  const { data: link, error: linkError } = await database.auth.admin.generateLink({
    type: 'magiclink',
    email: account.user.email,
  });
  if (linkError) throw new Error('Cannot create review session');
  const cookies = [];
  session = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { cookies: { getAll: () => [], setAll: (values) => cookies.push(...values) } },
  );
  const verified = await session.auth.verifyOtp({
    token_hash: link.properties.hashed_token,
    type: 'magiclink',
  });
  if (verified.error) throw new Error('Cannot verify review session');
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const report = [];
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 },
  ]) {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
    await context.addInitScript(() => {
      sessionStorage.setItem('tatatex-intro-seen', '1');
    });
    await context.addCookies(
      cookies.map(({ name, value, options }) => ({
        name,
        value,
        url: origin,
        httpOnly: options?.httpOnly || false,
        secure: false,
        sameSite: 'Lax',
      })),
    );
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const routes = [
      '/',
      '/about',
      '/contact',
      '/contact?type=quote',
      '/products',
      `/products/${product.slug}`,
      '/missing-page',
      '/products/missing-product',
      '/admin/login',
      '/admin',
      '/admin/products',
      '/admin/products/new',
      `/admin/products/${product.id}`,
      '/admin/categories',
      '/admin/enquiries',
      '/admin/users',
      '/admin/settings',
      '/admin/products/not-a-number',
    ];
    const selectedRoutes = process.argv.includes('--quick')
      ? routes.filter((r) =>
          [
            '/products',
            `/products/${product.slug}`,
            '/admin',
            '/admin/products/new',
            '/admin/settings',
            '/admin/users',
            '/missing-page',
          ].includes(r),
        )
      : routes;
    for (const route of selectedRoutes) {
      errors.length = 0;
      const response = await page.goto(origin + route, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await page.locator('h1').first().waitFor({ state: 'visible' });
      await page.waitForTimeout(300);
      const findings = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth + 2,
        headings: document.querySelectorAll('h1').length,
        main: document.querySelectorAll('main').length,
        brokenImages: [...document.images]
          .filter((i) => i.complete && !i.naturalWidth)
          .map((i) => i.getAttribute('src')),
        unlabelled: [
          ...document.querySelectorAll(
            'input:not([type=hidden]):not([aria-hidden=true]),select,textarea',
          ),
        ]
          .filter((i) => !i.labels?.length && !i.getAttribute('aria-label'))
          .map((i) => i.name || i.id),
      }));
      const accessibility = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      const violations = accessibility.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        targets: v.nodes.map((n) => n.target),
      }));
      console.log(
        viewport.width + ' ' + route + ' HTTP ' + response.status() + ' a11y ' + violations.length,
      );
      const controls = await page.locator('button, a[class], summary').evaluateAll((elements) =>
        elements
          .filter((element) => {
            if (
              element.tagName === 'A' &&
              !/btn|primary|outline|Button|quote|pc-enq/.test(element.className)
            )
              return false;
            const rect = element.getBoundingClientRect();
            return (
              rect.width > 0 && rect.height > 0 && getComputedStyle(element).visibility !== 'hidden'
            );
          })
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return {
              label: (element.getAttribute('aria-label') || element.textContent || '').trim(),
              tag: element.tagName,
              href: element.getAttribute('href'),
              type: element.getAttribute('type'),
              width: rect.width,
              height: rect.height,
              radius: style.borderRadius,
              font: style.fontSize,
              clipped: element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 2,
            };
          }),
      );
      const controlIssues = controls.filter(
        (control) => !control.label || control.width < 24 || control.height < 24 || control.clipped,
      );
      const focusSamples = [];
      const seenClasses = new Set();
      const candidates = page.locator('button, a.btn, a.btn-outline, a.btn-pill');
      for (let index = 0; index < (await candidates.count()); index++) {
        const element = candidates.nth(index);
        if (!(await element.isVisible()) || !(await element.isEnabled())) continue;
        const key = (await element.getAttribute('class')) || 'button';
        if (seenClasses.has(key)) continue;
        seenClasses.add(key);
        await element.focus();
        focusSamples.push(
          await element.evaluate((e) => ({
            label: e.getAttribute('aria-label') || e.textContent.trim(),
            outline: getComputedStyle(e).outlineStyle,
            shadow: getComputedStyle(e).boxShadow,
          })),
        );
      }
      await page.locator('h1').first().click({ force: true });
      const focusIssues = focusSamples.filter(
        (control) => control.outline === 'none' && control.shadow === 'none',
      );
      report.push({
        viewport: viewport.width,
        violations,
        controls,
        controlIssues,
        focusSamples,
        focusIssues,
        route,
        status: response.status(),
        url: new URL(page.url()).pathname,
        ...findings,
        errors: [...errors],
      });
      writeFileSync(`${output}/report-in-progress.json`, JSON.stringify(report, null, 2));
      const name = route.replace(/[^a-z0-9]/gi, '-') || 'home';
      await page.screenshot({ path: `${output}/${viewport.width}${name}.png`, fullPage: true });
      if (route === '/products') {
        await page.locator('#main-search').fill(product.name);
        await page.waitForTimeout(150);
        const filtered = await page.locator('.product-card').count();
        await page.reload({ waitUntil: 'domcontentloaded' });
        const restored = await page.locator('#main-search').inputValue();
        await page.locator('.product-card .pc-main').first().click();
        await page.waitForURL('**/products/*', { waitUntil: 'domcontentloaded' });
        await page.goBack({ waitUntil: 'domcontentloaded' });
        report.push({
          viewport: viewport.width,
          check: 'catalogue-navigation',
          filtered: filtered > 0,
          reloadRestores: restored === product.name,
          backRestores: (await page.locator('#main-search').inputValue()) === product.name,
        });
      }
      if (route === `/products/${product.slug}`) {
        await page.getByRole('button', { name: 'Enquire Now', exact: true }).click();
        const enquiryOpen = await page.getByRole('dialog').isVisible();
        await page.keyboard.press('Escape');
        await page.getByRole('button', { name: 'Zoom product photo', exact: true }).click();
        const zoomOpen = await page.getByRole('dialog').isVisible();
        await page.keyboard.press('Escape');
        report.push({
          viewport: viewport.width,
          check: 'product-dialogs',
          enquiryOpen,
          zoomOpen,
          closed: (await page.getByRole('dialog').count()) === 0,
        });
      }
      if (route === '/admin' && viewport.width < 700) {
        await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
        const opened = await page.getByRole('navigation', { name: 'Administration' }).isVisible();
        await page.keyboard.press('Escape');
        report.push({
          viewport: viewport.width,
          check: 'mobile-admin-menu',
          opened,
          closed: !(await page.getByRole('navigation', { name: 'Administration' }).isVisible()),
        });
      }
      if (route === '/admin/settings') {
        await page
          .getByRole('heading', { name: 'Settings', exact: true })
          .waitFor({ state: 'visible' });
        await page.getByRole('link', { name: 'Change password', exact: true }).click();
        await page.waitForURL('**/admin/users#change-password', { waitUntil: 'domcontentloaded' });
        report.push({
          viewport: viewport.width,
          check: 'change-password-link',
          correctTarget: await page.locator('#change-password').isVisible(),
        });
      }
      if (route === '/admin/products/new') {
        const form = page.locator('form.admin-form');
        await form.locator('[name=name]').fill('Preview check');
        if (
          !(await page
            .getByLabel('Live product preview')
            .getByRole('heading', { name: 'Preview check', exact: true })
            .count())
        )
          throw new Error('Product preview does not update');
        const boxes = await Promise.all([
          form.boundingBox(),
          page.getByLabel('Live product preview').boundingBox(),
        ]);
        report.push({
          viewport: viewport.width,
          check: 'editor-layout',
          sideBySide: boxes[1].x > boxes[0].x + boxes[0].width - 5,
          boxes,
        });
      }
      if (route === '/admin/products/new') {
        await page.locator('[name=price_display]').selectOption('public');
        await page.locator('[name=price]').fill('250');
        const publicPrice = await page
          .getByLabel('Live product preview')
          .locator('.product-price')
          .innerText();
        await page.locator('[name=price_display]').selectOption('contact');
        const privatePrice = await page
          .getByLabel('Live product preview')
          .locator('.product-price')
          .innerText();
        await page.locator('[name=image]').setInputFiles({
          name: 'invalid.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('not an image'),
        });
        report.push({
          viewport: viewport.width,
          check: 'product-preview-validation',
          publicPrice: publicPrice.includes('250'),
          privatePrice: !privatePrice.includes('250'),
          invalidUpload: await page.locator('#product-image-error').isVisible(),
        });
      }
      if (route === '/admin/products') {
        let saves = 0;
        const observe = (request) => {
          if (request.method() === 'POST') saves++;
        };
        page.on('request', observe);
        page.once('dialog', (dialog) => dialog.dismiss());
        await page.getByRole('button', { name: 'Delete product', exact: true }).first().click();
        await page.waitForTimeout(100);
        page.off('request', observe);
        report.push({ viewport: viewport.width, check: 'cancel-delete', noMutation: saves === 0 });
      }
      if (route === '/contact') {
        await page.getByRole('button', { name: 'Send enquiry', exact: true }).click();
        report.push({
          viewport: viewport.width,
          check: 'empty-enquiry-validation',
          errors: await page.locator('.field-error').count(),
        });
      }
    }
    await context.close();
  }
  const guest = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  });
  const guestPage = await guest.newPage();
  await guestPage.goto(origin + '/admin/products', { waitUntil: 'domcontentloaded' });
  report.push({
    check: 'unauthenticated-admin',
    redirectsToLogin: new URL(guestPage.url()).pathname === '/admin/login',
  });
  await guestPage
    .getByRole('heading', { name: 'Tata Tex admin', exact: true })
    .waitFor({ state: 'visible' });
  const guestAxe = await new AxeBuilder({ page: guestPage })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  report.push({
    route: '/admin/login (guest)',
    violations: guestAxe.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      targets: v.nodes.map((n) => n.target),
    })),
  });
  await guestPage.screenshot({ path: `${output}/guest-login.png`, fullPage: true });
  await guest.close();
  writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
  writeFileSync(
    `${output}/buttons.json`,
    JSON.stringify(
      report
        .filter((r) => r.controls)
        .map(({ viewport, route, controls, controlIssues, focusSamples }) => ({
          viewport,
          route,
          controls,
          controlIssues,
          focusSamples,
        })),
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify(
      report.filter(
        (r) =>
          r.overflow ||
          (r.headings !== undefined && r.headings !== 1) ||
          (r.main !== undefined && r.main !== 1) ||
          r.brokenImages?.length ||
          r.unlabelled?.length ||
          r.errors?.length ||
          r.violations?.length ||
          r.controlIssues?.length ||
          r.focusIssues?.length ||
          r.focusIssues?.length ||
          r.check,
      ),
      null,
      2,
    ),
  );
  const failures = report.filter((r) => {
    if (
      r.overflow ||
      r.controlIssues?.length ||
      r.focusIssues?.length ||
      r.brokenImages?.length ||
      r.unlabelled?.length ||
      r.violations?.length ||
      (Array.isArray(r.errors) && r.errors.length)
    )
      return true;
    if (r.headings !== undefined && (r.headings !== 1 || r.main !== 1)) return true;
    if (
      r.route &&
      r.url &&
      r.route !== '/admin/login' &&
      new URL(r.route, origin).pathname !== r.url
    )
      return true;
    if (r.check === 'editor-layout') return r.viewport >= 992 ? !r.sideBySide : r.sideBySide;
    if (r.check === 'empty-enquiry-validation') return r.errors !== 3;
    if (r.check) return Object.values(r).some((value) => value === false);
    return false;
  });
  writeFileSync(
    `${output}/summary.json`,
    JSON.stringify({ pages: report.filter((r) => r.route).length, failures }, null, 2),
  );
  console.log('Browser review failures: ' + failures.length);
  if (failures.length) process.exitCode = 1;
  console.log(
    'Reviewed ' +
      report.filter((r) => r.route).length +
      ' page/viewport combinations. Screenshots: ' +
      output,
  );
} finally {
  await browser?.close();
  if (session) await session.auth.signOut({ scope: 'local' });
  server.kill();
}
