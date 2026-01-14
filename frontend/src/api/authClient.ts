import axios from 'axios'

const baseURL = '/api/v1'

const client = axios.create({
  baseURL,
  timeout: 10_000,
})

// Protocolo Synapse (13/01/2026): Interceptor para injeção automática de JWT
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

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('synapse_token')
      window.location.href = '/auth'
    }
    return Promise.reject(error)
  }
)

interface TokenResponse {
  access?: string
  refresh?: string
}

const authClient = {
  login: async (username: string, password: string): Promise<TokenResponse> => {
    const response = await client.post('/auth/token/', { username, password })
    if (response.data.access) {
      localStorage.setItem('synapse_token', response.data.access)
    }
    return response.data
  },
  fetchSessions: async () => {
    const response = await client.get('/cognition/sessions/')
    return response.data
  },
  fetchStats: async () => {
    const response = await client.get('/core/dashboard/stats/')
    return response.data
  },
  fetchCourses: async () => {
    const response = await client.get('/courses/')
    return response.data
  },
  fetchCourseDetail: async (id: number) => {
    const response = await client.get(`/courses/${id}/`)
    return response.data
  },
  fetchLessonDetail: async (id: number) => {
    const response = await client.get(`/lessons/${id}/`)
    return response.data
  },
  enrollInCourse: async (courseId: number, cohortId?: number) => {
    const response = await client.post(`/courses/${courseId}/enroll/`, {
      cohort: cohortId
    })
    return response.data
  },
  fetchProblems: async (courseId?: number) => {
    const response = await client.get('/problems/', { params: { course: courseId } })
    return response.data
  },
  submitSolution: async (problemId: number, code: string) => {
    const response = await client.post('/submissions/', {
      problem: problemId,
      code: code
    })
    return response.data
  },
  fetchSubmissionDetail: async (id: number) => {
    const response = await client.get(`/submissions/${id}/`)
    return response.data
  },
  fetchCurrentUser: async () => {
    const response = await client.get('/users/me/')
    return response.data
  },
  fetchAuditLogs: async (correlationId?: string) => {
    const response = await client.get('/core/audit/', { params: { correlation_id: correlationId } })
    return response.data
  },
  fetchMaterials: async () => {
    return [
      { id: 1, title: 'Guia de Ensino Híbrido', type: 'PDF', lesson: 'Aula 01' },
      { id: 2, title: 'Roadmap 2026', type: 'Slides', lesson: 'Aula 02' },
      { id: 3, title: 'Código exemplo', type: 'Code', lesson: 'Lab Python' },
    ]
  },
  logout: () => {
    localStorage.removeItem('synapse_token')
    window.location.href = '/auth'
  }
}

export default authClient
