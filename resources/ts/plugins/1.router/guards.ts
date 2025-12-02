import type { RouteNamedMap, _RouterTyped } from 'unplugin-vue-router'
import { canNavigate } from '@layouts/plugins/casl'

type UserData = Record<string, any> & { profile_completed?: boolean; role?: string }

export const setupGuards = (router: _RouterTyped<RouteNamedMap & { [key: string]: any }>) => {
  // 👉 router.beforeEach
  // Docs: https://router.vuejs.org/guide/advanced/navigation-guards.html#global-before-guards
  router.beforeEach(to => {
    /**
     * Check if user is logged in by checking if token & user data exists in local storage
     * Feel free to update this logic to suit your needs
     */
    const userDataCookie = useCookie<UserData | null>('userData')
    const isLoggedIn = !!(userDataCookie.value && useCookie('accessToken').value)
    const isProfileCompleted = !!userDataCookie.value?.profile_completed
    const isAdmin = userDataCookie.value?.role === 'admin'

    /*
      If user is logged in and is trying to access login like page, redirect to dashboard
      else allow visiting the page
     */
    if (to.meta.unauthenticatedOnly) {
      if (isLoggedIn)
        return to.meta.redirectIfAuth ?? '/dashboard'

      return
    }

    if (isLoggedIn && !isProfileCompleted && !to.meta.allowIncompleteProfile) {
      if (to.name !== 'complete-profile') {
        return {
          name: 'complete-profile',
          query: {
            redirect: to.fullPath !== '/' ? to.fullPath : undefined,
          },
        }
      }
    }

    /*
     * If it's a public route, continue navigation. This kind of pages are allowed to visited by login & non-login users. Basically, without any restrictions.
     * Examples of public routes are, 404, under maintenance, etc.
     */
    if (to.meta.public)
      return

    if (!isLoggedIn) {
      return {
        name: 'login',
        query: {
          ...to.query,
          to: to.fullPath !== '/' ? to.fullPath : undefined,
        },
      }
    }

    // بررسی دسترسی Admin برای صفحات Admin
    if (to.path.startsWith('/admin') && !isAdmin) {
      return { name: 'not-authorized' }
    }

    if (!canNavigate(to) && to.matched.length)
      return { name: 'not-authorized' }
  })
}
