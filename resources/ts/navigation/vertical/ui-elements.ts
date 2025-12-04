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
  {
    title: 'مدیریت حساب تنخواه',
    icon: { icon: 'bx-wallet' },
    to: { name: 'finance-department-petty-cash' },
  },
]

// استفاده از computed برای reactive navigation
const navigationItems = computed<VerticalNavItems>(() => {
  const userDataCookie = useCookie<Record<string, any> | null>('userData')
  // پشتیبانی از هر دو فرمت: role (string) یا role.name (object)
  const userRole = userDataCookie.value?.role
  const isAdmin = userRole === 'admin' || (typeof userRole === 'object' && userRole?.name === 'admin')

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
      {
        title: 'مدیریت حساب اصلی',
        icon: { icon: 'bx-building' },
        to: { name: 'admin-company-account' },
      },
      {
        title: 'مدیریت حساب‌ها و دسته‌بندی‌ها',
        icon: { icon: 'bx-category' },
        to: { name: 'admin-accounts-management' },
      },
      {
        title: 'مدیریت Role ها',
        icon: { icon: 'bx-shield' },
        to: { name: 'admin-roles-management' },
      },
    )
  }

  return items
})

export default navigationItems
