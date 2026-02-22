import { useState, useEffect } from 'react'
import { logout, getBalance, transferMoney, getUserInfo } from '../services/auth'
import TransactionHistory from './TransactionHistory'
import './Dashboard.css'

const Dashboard = ({ setIsAuthenticated }) => {
  const [user, setUser] = useState(null)
  const [balance, setBalance] = useState(null)
  const [balanceChecked, setBalanceChecked] = useState(false)
  const [transferData, setTransferData] = useState({
    recipient_email: '',
    amount: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [transferLoading, setTransferLoading] = useState(false)
  const [refreshTransactions, setRefreshTransactions] = useState(0)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const userData = await getUserInfo()
      setUser(userData)
    } catch (err) {
      console.error('Error loading user data:', err)
    }
  }

  const loadBalance = async () => {
    try {
      const balanceData = await getBalance()
      setBalance(balanceData.balance)
    } catch (err) {
      console.error('Error loading balance:', err)
      setError('Failed to load balance')
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      setIsAuthenticated(false)
      window.location.href = '/'
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const handleTransferChange = (e) => {
    setTransferData({
      ...transferData,
      [e.target.name]: e.target.value
    })
    setError('')
    setSuccess('')
  }

  const handleTransfer = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setTransferLoading(true)

    try {
      const result = await transferMoney(transferData.recipient_email, transferData.amount)
      setSuccess(`Transfer successful! New balance: $${result.new_balance.toFixed(2)}`)
      setBalance(result.new_balance)
      setBalanceChecked(true)
      setRefreshTransactions(prev => prev + 1) // Trigger transaction history refresh
      setTransferData({
        recipient_email: '',
        amount: ''
      })
    } catch (err) {
      setError(err.response?.data?.error || 'Transfer failed. Please try again.')
    } finally {
      setTransferLoading(false)
    }
  }

  const handleCheckBalance = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const balanceData = await getBalance()
      setBalance(balanceData.balance)
      setBalanceChecked(true)
    } catch (err) {
      setError('Failed to check balance')
      setBalanceChecked(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome to Kodbank, {user?.cust_name || 'User'}!</h1>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-card">
          <h2>Account Information</h2>
          <div className="info-item">
            <span className="info-label">Customer ID:</span>
            <span className="info-value">{user?.cust_id}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Name:</span>
            <span className="info-value">{user?.cust_name}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Email:</span>
            <span className="info-value">{user?.email}</span>
          </div>
        </div>

        <div className="dashboard-card balance-card">
          <h2>Account Balance</h2>
          <div className="balance-display">
            {balanceChecked && balance !== null ? (
              <span className="balance-amount">
                ${balance.toFixed(2)}
              </span>
            ) : (
              <span className="balance-placeholder">
                Click "Check Balance" to view your balance
              </span>
            )}
          </div>
          <button
            onClick={handleCheckBalance}
            className="check-balance-button"
            disabled={loading}
          >
            {loading ? 'Checking...' : 'Check Balance'}
          </button>
        </div>

        <div className="dashboard-card">
          <h2>Transfer Money</h2>
          <form onSubmit={handleTransfer}>
            <div className="form-group">
              <label htmlFor="recipient_email">Recipient Email</label>
              <input
                type="email"
                id="recipient_email"
                name="recipient_email"
                value={transferData.recipient_email}
                onChange={handleTransferChange}
                required
                placeholder="Enter recipient's email"
              />
            </div>
            <div className="form-group">
              <label htmlFor="amount">Amount</label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={transferData.amount}
                onChange={handleTransferChange}
                required
                min="0.01"
                step="0.01"
                placeholder="0.00"
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            <button
              type="submit"
              className="transfer-button"
              disabled={transferLoading}
            >
              {transferLoading ? 'Processing...' : 'Transfer Money'}
            </button>
          </form>
        </div>

        <TransactionHistory key={refreshTransactions} />
      </div>
    </div>
  )
}

export default Dashboard
