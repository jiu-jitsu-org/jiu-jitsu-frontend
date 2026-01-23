import api from './axios'

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: {
    id: string
    username: string
    role: string
  }
}

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', data)
    return response.data
  },
  logout: async () => {
    await api.post('/auth/logout')
  },
}
