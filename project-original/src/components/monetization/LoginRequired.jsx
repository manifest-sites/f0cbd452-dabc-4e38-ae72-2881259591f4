import { useState, useEffect } from 'react'

function LoginRequired() {
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      // Initialize Google Sign-In
      if (window.google) {
        const auth2 = window.google.auth2.init({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your-google-client-id',
          scope: 'email profile'
        })

        const googleUser = await auth2.signIn()
        const profile = googleUser.getBasicProfile()
        const idToken = googleUser.getAuthResponse().id_token

        // Here you would typically send the token to your backend
        console.log('Google login successful:', {
          name: profile.getName(),
          email: profile.getEmail(),
          idToken: idToken
        })

        // Handle successful login (e.g., redirect or update parent state)
        // You might want to pass a callback prop to handle this
      } else {
        console.error('Google Sign-In not loaded')
      }
    } catch (error) {
      console.error('Google login failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadGoogleSignIn = () => {
    // Load Google Sign-In script if not already loaded
    if (!window.google) {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => {
        console.log('Google Sign-In script loaded')
      }
      document.head.appendChild(script)
    }
  }

  // Load Google Sign-In when component mounts
  useEffect(() => {
    loadGoogleSignIn()
  }, [])

  return (
    <div className="text-2xl bg-slate-600 h-screen w-screen text-white flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">Login Required</h2>
        <p className="text-lg mb-6">Please log in to access this content.</p>
        
        <button 
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="mt-4 px-6 py-3 bg-white text-gray-800 hover:bg-gray-100 rounded-lg flex items-center justify-center mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-800 mr-2"></div>
              Signing in...
            </div>
          ) : (
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </div>
          )}
        </button>
        
        <p className="text-sm text-gray-300 mt-4">
          We'll only access your basic profile information
        </p>
      </div>
    </div>
  )
}

export default LoginRequired 