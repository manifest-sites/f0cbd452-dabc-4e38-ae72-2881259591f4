import { useState, useEffect } from 'react'
import Monetization from './components/monetization/Monetization'
import FlashCardApp from './components/FlashCardApp'

function App() {

  return (
    <Monetization>
      <FlashCardApp />
    </Monetization>
  )
}

export default App