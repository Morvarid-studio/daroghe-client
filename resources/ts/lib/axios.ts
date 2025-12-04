import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8080', // آدرس بک‌اند
  timeout: 30000, // 30 ثانیه
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Helper function برای خواندن cookie
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift()
    if (cookieValue) {
      // Decode URI component (همانند useCookie)
      try {
        return decodeURIComponent(cookieValue)
      } catch {
        return cookieValue
      }
    }
  }
  return null
}

// اضافه کردن توکن و مدیریت Content-Type برای FormData
api.interceptors.request.use(config => {
  // استفاده از cookie به جای localStorage (هماهنگ با login.vue)
  const token = getCookie('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  // اگر FormData هست، Content-Type رو حذف کن تا axios خودش boundary رو set کنه
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  
  return config
})

// مدیریت خطاهای عمومی
api.interceptors.response.use(
  response => response,
  error => {
    console.error(error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export default api

