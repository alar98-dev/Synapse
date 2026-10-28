import axios from 'axios'

const baseURL = '/api/v1'

const client = axios.create({
  baseURL,
  timeout: 10_000,
})

client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('synapse_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

export interface CheckoutResult {
  id: string
  url?: string | null
  simulated?: boolean
  success?: boolean
  message?: string
  error?: string
}

const paymentsApi = {
  createCheckoutSession: async (
    courseId?: number,
    planId?: number,
    simulate: boolean = false
  ): Promise<CheckoutResult> => {
    const response = await client.post('/payments/payments/create_checkout_session/', {
      course_id: courseId,
      plan_id: planId,
      simulate: simulate,
    })
    return response.data
  },
  fetchSubscription: async () => {
    const response = await client.get('/payments/subscriptions/')
    return response.data
  },
}

export default paymentsApi
