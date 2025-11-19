import { ofetch } from 'ofetch'

// In development, use proxy (/api) to avoid CORS issues
// In production, use VITE_API_BASE_URL if set
const getBaseURL = () => {
  if (import.meta.env.DEV) {
    // In development, use proxy
    return '/api'
  }
  // In production, use VITE_API_BASE_URL or fallback to /api
  return import.meta.env.VITE_API_BASE_URL || '/api'
}

export const $api = ofetch.create({
  baseURL: getBaseURL(),
  async onRequest({ options }) {
    const accessToken = useCookie('accessToken').value
    if (accessToken)
      options.headers.append('Authorization', `Bearer ${accessToken}`)
  },
})
