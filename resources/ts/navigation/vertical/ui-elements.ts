import type { VerticalNavItems } from '@layouts/types'

// Navigation items base (بدون منوی Admin)
const baseNavigationItems: VerticalNavItems = [
  {
    title: 'داشبورد',
    icon: { icon: 'bx-home-circle' },
    to: { name: 'dashboard' },
  },
  {
    heading: 'ساعات کاری',
  },
  {
    title: 'ثبت ساعات کاری',
    icon: { icon: 'bx-time' },
    to: { name: 'work-hours-add' },
  },
  {
    title: 'نمودار ساعات کاری',
    icon: { icon: 'bx-bar-chart-alt-2' },
    to: { name: 'work-hours-chart' },
  },
  {
    heading: 'امور مالی',
  },
  {
    title: 'اطلاعات بانکی',
    icon: { icon: 'bx-credit-card' },
    to: { name: 'finance-department-bank-information-form' },
  },
]

// استفاده از computed برای reactive navigation
const navigationItems = computed<VerticalNavItems>(() => {
  const userDataCookie = useCookie<Record<string, any> | null>('userData')
  const isAdmin = userDataCookie.value?.role === 'admin'

  // کپی کردن base items
  const items: VerticalNavItems = [...baseNavigationItems]

  // اضافه کردن منوی Admin فقط برای کاربران Admin
  if (isAdmin) {
    items.push(
      {
        heading: 'مدیریت',
      },
      {
        title: 'تایید اطلاعات کاربران',
        icon: { icon: 'bx-user-check' },
        to: { name: 'admin-pending-profiles' },
      },
    )
  }

  return items
})

export default navigationItems
