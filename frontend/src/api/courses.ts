import axios from 'axios'

const baseURL = '/api/v1'

const client = axios.create({
  baseURL,
  timeout: 10_000,
})

// Synapse Core Protocol: JWT automatic injection
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

export interface Course {
  id: number
  title: string
  slug: string
  description: string
  level: string
  price: string
  enrolled_count: number
  is_enrolled: boolean
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface CourseFilters {
  level?: string
  search?: string
  min_price?: number
  max_price?: number
  is_published?: boolean
}

const coursesApi = {
  list: async (filters: CourseFilters = {}): Promise<Course[]> => {
    const response = await client.get('/courses/', { params: filters })
    return response.data
  },
  myCourses: async (): Promise<Course[]> => {
    const response = await client.get('/courses/my_courses/')
    return response.data
  },
  get: async (id: number): Promise<Course> => {
    const response = await client.get(`/courses/${id}/`)
    return response.data
  },
  enroll: async (courseId: number, cohortId?: number) => {
    const response = await client.post(`/courses/${courseId}/enroll/`, { cohort: cohortId })
    return response.data
  },
  createCohort: async (data: any) => {
    const response = await client.post('/cohorts/', data)
    return response.data
  },
  bulkInvite: async (cohortId: number, emails: string[]) => {
    const response = await client.post(`/cohorts/${cohortId}/bulk_enroll/`, { emails })
    return response.data
  },
  getLeaderboard: async (cohortId: number) => {
    const response = await client.get(`/cohorts/${cohortId}/leaderboard/`)
    return response.data
  }
}

export default coursesApi
