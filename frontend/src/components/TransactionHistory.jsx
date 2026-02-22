import { useState, useEffect } from 'react'
import { getTransactions } from '../services/auth'
import './TransactionHistory.css'

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getTransactions()
      setTransactions(data.transactions || [])
    } catch (err) {
      setError('Failed to load transaction history')
      console.error('Error loading transactions:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="transaction-history-card">
      <div className="transaction-header">
        <h2>Transaction History</h2>
        <button onClick={loadTransactions} className="refresh-button" disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading && transactions.length === 0 ? (
        <div className="loading-message">Loading transactions...</div>
      ) : transactions.length === 0 ? (
        <div className="no-transactions">No transactions found</div>
      ) : (
        <div className="transactions-list">
          {transactions.map((transaction) => (
            <div 
              key={transaction.transaction_id} 
              className={`transaction-item ${transaction.transaction_direction}`}
            >
              <div className="transaction-main">
                <div className="transaction-type">
                  {transaction.transaction_direction === 'sent' ? (
                    <span className="transaction-icon sent">→</span>
                  ) : (
                    <span className="transaction-icon received">←</span>
                  )}
                  <span className="transaction-label">
                    {transaction.transaction_direction === 'sent' 
                      ? `Sent to ${transaction.recipient_email}` 
                      : `Received from ${transaction.sender_email}`}
                  </span>
                </div>
                <div className={`transaction-amount ${transaction.transaction_direction}`}>
                  {transaction.transaction_direction === 'sent' ? '-' : '+'}
                  ${transaction.amount.toFixed(2)}
                </div>
              </div>
              <div className="transaction-date">{transaction.date}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TransactionHistory
