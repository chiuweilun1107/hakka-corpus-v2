import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'

const LOCALES = [
  { locale: 'zh-TW',      h1Contains: '語料庫',    navLogin: '登入',    title: '臺灣客語語料庫' },
  { locale: 'en',         h1Contains: 'Corpus',    navLogin: 'Login',   title: 'Taiwan Hakka Corpus' },
  { locale: 'hak-sixian', h1Contains: '語料庫',    navLogin: '登入',    title: '語料庫' },
  { locale: 'hak-hailu',  h1Contains: '語料庫',    navLogin: '登入',    title: '語料庫' },
]

for (const { locale, h1Contains, navLogin, title } of LOCALES) {
  test(`homepage renders in ${locale}`, async ({ page, context }) => {
    await context.addCookies([{
      name: 'NEXT_LOCALE',
      value: locale,
      url: BASE_URL,
    }])

    await page.goto(BASE_URL)
    await page.waitForLoadState('domcontentloaded')

    // H1 visible and contains locale-appropriate string
    await expect(page.locator('h1').first()).toContainText(h1Contains)

    // Navigation visible
    await expect(page.getByRole('navigation').first()).toBeVisible()

    // Login button shows locale text (exact:false handles strings with romanization appended)
    const loginBtn = page.getByRole('button', { name: navLogin, exact: false }).first()
    await expect(loginBtn).toBeVisible()

    // <html lang> attribute is set
    const lang = await page.getAttribute('html', 'lang')
    expect(lang).toBe(locale)

    // Page title contains locale string
    await expect(page).toHaveTitle(new RegExp(title))

    // Screenshot for visual diffing
    await page.screenshot({
      path: `e2e/__screenshots__/home-${locale}.png`,
      fullPage: true,
    })
  })
}

test('locale cookie persists after refresh', async ({ page, context }) => {
  await context.addCookies([{
    name: 'NEXT_LOCALE',
    value: 'en',
    url: BASE_URL,
  }])
  await page.goto(BASE_URL)
  await page.reload()
  await expect(page.locator('h1').first()).toContainText('Corpus')
  const lang = await page.getAttribute('html', 'lang')
  expect(lang).toBe('en')
})

test('missing locale cookie triggers Accept-Language fallback', async ({ page }) => {
  // No NEXT_LOCALE cookie — middleware should use Accept-Language
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' })
  await page.goto(BASE_URL)
  // After middleware sets cookie, page should be in English
  await expect(page.locator('h1').first()).toContainText('Corpus')
})
