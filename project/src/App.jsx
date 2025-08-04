import { useState, useEffect } from 'react'
import Monetization from './components/monetization/Monetization'
import CRM from './components/CRM'

function App() {

  return (
    <Monetization>
      <CRM />
    </Monetization>
  )
}

export default App