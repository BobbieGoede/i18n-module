import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup } from '../utils'
import { getText, gotoPath, renderPage, setRuntimeConfig } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/basic`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      debug: true,
      strategy: 'no_prefix',
      detectBrowserLanguage: {
        useCookie: true,
        cookieKey: 'my_custom_cookie_name',
        redirectOn: 'root',
        cookieCrossOrigin: true,
        cookieSecure: true
      }
    }
  }
})

test('detection with cookie', async () => {
  const { page } = await renderPage('/', { locale: 'en' })
  const ctx = await page.context()
  // click `fr` lang switch link
  await page.locator('#set-locale-link-fr').click()
  expect(await ctx.cookies()).toMatchObject([
    { name: 'my_custom_cookie_name', value: 'fr', secure: true, sameSite: 'None' }
  ])

  // navigate to about
  await gotoPath(page, '/about')
  // detect locale from persisted cookie
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')
  // navigate with home link
  await page.locator('#link-home').click()

  // locale in home
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')

  // click `fr` lang switch link
  await page.locator('#set-locale-link-en').click()
  expect(await ctx.cookies()).toMatchObject([{ name: 'my_custom_cookie_name', value: 'en' }])
})

test.only('disable', async () => {
  await setRuntimeConfig({
    public: {
      i18n: {
        detectBrowserLanguage: false
      }
    }
  })

  const { page } = await renderPage('/', { locale: 'en' })
  const ctx = await page.context()

  // click `fr` lang switch link
  await page.locator('#set-locale-link-fr').click()
  expect(await ctx.cookies()).toMatchObject([])

  // navigate to about
  await gotoPath(page, '/about')

  // set default locale
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('en')

  // click `fr` lang switch link
  await page.locator('#set-locale-link-fr').click()

  // navigate with home link
  await page.locator('#link-home').click()

  // set default locale
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')
})
