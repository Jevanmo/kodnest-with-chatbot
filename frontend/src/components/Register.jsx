import { useState } from 'react'
import { register } from '../services/auth'
import './Auth.css'

const Register = () => {
  const [formData, setFormData] = useState({
    cust_name: '',
    email: '',
    cust_pwd: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const data = {
        cust_name: formData.cust_name,
        email: formData.email,
        cust_pwd: formData.cust_pwd
      }
      await register(data)
      setSuccess('Registration successful! You can now login.')
      setFormData({
        cust_name: '',
        email: '',
        cust_pwd: ''
      })
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Register</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="cust_name">Full Name</label>
            <input
              type="text"
              id="cust_name"
              name="cust_name"
              value={formData.cust_name}
              onChange={handleChange}
              required
              placeholder="Enter your full name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="cust_pwd">Password</label>
            <input
              type="password"
              id="cust_pwd"
              name="cust_pwd"
              value={formData.cust_pwd}
              onChange={handleChange}
              required
              placeholder="Create a password"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Register
