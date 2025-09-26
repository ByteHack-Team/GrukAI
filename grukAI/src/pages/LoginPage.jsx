import React, { useState } from 'react'
import GRUKBG from '../components/assets/GRUKBG.jpg'
import GrukLogo from '../components/assets/GRUK_AI_LOGO-Photoroom.png'
import { auth } from '../lib/firestore'
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth'

// Button Component
const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  className = '',
  type = 'button',
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus:ring-gray-500',
    google: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 focus:ring-blue-500 shadow-sm'
  }
  
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

// Input Component
const Input = ({ type='text', placeholder, value, onChange, className='', label, error, disabled=false, required=false, name, ...props }) => {
  const inputStyles = `
    w-full px-3 py-2 border rounded-lg transition-colors duration-200 bg-white/60
    focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
    disabled:bg-gray-100 disabled:cursor-not-allowed
    ${error ? 'border-red-500 focus:ring-red-500' : 'border-emerald-200'}
    ${className}
  `
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-emerald-800 mb-1">
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={inputStyles}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

// Login / Registration Form
const LoginForm = ({ onLogin }) => {
  const [formData, setFormData] = useState({ email:'', password:'' })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [isRegister, setIsRegister] = useState(false) // toggle between login/register

  const handleChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.email) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid'
    if (!formData.password) newErrors.password = 'Password is required'
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    return newErrors
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const formErrors = validateForm()
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      return
    }
    setIsLoading(true)
    try {
      let userCredential
      if (isRegister) {
        userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
      } else {
        userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password)
      }
      onLogin(userCredential.user)
    } catch (err) {
      console.error(err)
      setErrors({ general: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    const provider = new GoogleAuthProvider()
    try {
      const result = await signInWithPopup(auth, provider)
      onLogin(result.user)
    } catch (err) {
      console.error(err)
      setErrors({ general: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto bg-emerald-50/40 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-emerald-200/20">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <img src={GrukLogo} alt="GrukAI Logo" className="w-16 h-16 mr-3" />
          <h1 className="text-4xl font-bold text-emerald-900">GrukAI</h1>
        </div>
        <p className="text-emerald-700/80">{isRegister ? 'Create a new account' : 'Sign in to your account'}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {errors.general}
          </div>
        )}

        <Input type="email" name="email" label="Email Address" placeholder="Enter your email"
          value={formData.email} onChange={handleChange} error={errors.email} required />

        <Input type="password" name="password" label="Password" placeholder="Enter your password"
          value={formData.password} onChange={handleChange} error={errors.password} required />

        <div className="flex items-center justify-between">
          {!isRegister && (
            <>
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500" />
                <span className="ml-2 text-sm text-emerald-700">Remember me</span>
              </label>
              <a href="#" className="text-sm text-emerald-600 hover:text-emerald-800">Forgot password?</a>
            </>
          )}
        </div>

        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isLoading}>
          {isLoading ? (isRegister ? 'Creating account...' : 'Signing in...') : (isRegister ? 'Sign Up' : 'Sign In')}
        </Button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <Button variant="google" size="lg" className="w-full mt-4" onClick={handleGoogleLogin} disabled={isLoading}>
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </Button>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-emerald-700/80">
          {isRegister ? "Already have an account?" : "Don't have an account?"}{' '}
          <button type="button" onClick={() => setIsRegister(!isRegister)} className="text-emerald-600 hover:text-emerald-800 font-medium">
            {isRegister ? "Sign in" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  )
}

// Main Login Page
const LoginPage = () => {
  const handleLogin = (user) => {
    console.log('Logged in user:', user)
    // Redirect to dashboard after login
    window.location.href = '/dashboard'
  }

  return (
    <div 
      className="fixed inset-0 w-screen h-screen flex items-center justify-center p-4 overflow-hidden"
      style={{
        backgroundImage: `url(${GRUKBG})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        width: '100vw',
        height: '100vh',
        minWidth: '100vw',
        minHeight: '100vh'
      }}
    >
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="relative z-10">
        <LoginForm onLogin={handleLogin} />
      </div>
    </div>
  )
}

export default LoginPage
