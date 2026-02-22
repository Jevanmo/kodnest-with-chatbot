import axios from 'axios'

const API_URL = '/api'

// Configure axios to send cookies with requests
axios.defaults.withCredentials = true

export const register = async (userData) => {
  const response = await axios.post(`${API_URL}/register`, userData)
  return response.data
}

export const login = async (credentials) => {
  const response = await axios.post(`${API_URL}/login`, credentials)
  return response.data
}

export const logout = async () => {
  const response = await axios.post(`${API_URL}/logout`)
  return response.data
}

export const checkAuth = async () => {
  try {
    const response = await axios.get(`${API_URL}/user`)
    return !!response.data
  } catch (error) {
    return false
  }
}

export const getUserInfo = async () => {
  const response = await axios.get(`${API_URL}/user`)
  return response.data
}

export const getBalance = async () => {
  const response = await axios.get(`${API_URL}/balance`)
  return response.data
}

export const transferMoney = async (recipientEmail, amount) => {
  const response = await axios.post(`${API_URL}/transfer`, {
    recipient_email: recipientEmail,
    amount: parseFloat(amount)
  })
  return response.data
}

export const getTransactions = async () => {
  const response = await axios.get(`${API_URL}/transactions`)
  return response.data
}
