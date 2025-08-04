import { useState, useEffect } from 'react'
import Loading from './Loading'
import LoginRequired from './LoginRequired'
import PaymentRequired from './PaymentRequired'
import SubscriptionRequired from './SubscriptionRequired'
import config from '../../../manifest.config.json'

function Monetization({ children }) {
  const [isLoading, setIsLoading] = useState(true)
  const [state, setState] = useState('open') // 'open', 'login_required', 'payment_required', 'subscription_required'

  useEffect(() => {
    // Simulate a query - replace this with your actual query logic
    const runQuery = async () => {
      setState(config.monetization.type)
      setIsLoading(false)
    }

    runQuery()
  }, [])

  if (isLoading) {
    return <Loading />
  }

  // Handle different states
  switch (state) {
    case 'login_required':
      return <LoginRequired />

    case 'payment_required':
      return <PaymentRequired />

    case 'subscription_required':
      return <SubscriptionRequired />

    case 'open':
    default:
      // Show the original content
      return <>{children}</>
  }
}

export default Monetization 