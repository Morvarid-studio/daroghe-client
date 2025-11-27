import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8080', // آدرس بک‌اند
  timeout: 30000, // 30 ثانیه
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// اگر در آینده لازم شد توکن را اتوماتیک اضافه کنیم:
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
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

