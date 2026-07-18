'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { User, UserRole, AuthContextType } from './types'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthState {
  user: User | null
  isAuthenticated: boolean
}

type AuthAction =
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'RESTORE_SESSION'; payload: User | null }

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN':
      return { user: action.payload, isAuthenticated: true }
    case 'LOGOUT':
      return { user: null, isAuthenticated: false }
    case 'RESTORE_SESSION':
      return {
        user: action.payload,
        isAuthenticated: action.payload !== null
      }
    default:
      return state
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isAuthenticated: false
  })

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('auth_user')
    if (stored) {
      try {
        const user = JSON.parse(stored)
        dispatch({ type: 'RESTORE_SESSION', payload: user })
      } catch (e) {
        localStorage.removeItem('auth_user')
      }
    }
  }, [])

  const login = (email: string, password: string) => {
    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    const user = users.find((u: User) => u.email === email && u.password === password)

    if (user) {
      dispatch({ type: 'LOGIN', payload: user })
      localStorage.setItem('auth_user', JSON.stringify(user))
    } else {
      throw new Error('Invalid email or password')
    }
  }

  const logout = () => {
    dispatch({ type: 'LOGOUT' })
    localStorage.removeItem('auth_user')
  }

  const register = (email: string, name: string, password: string, role: UserRole) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    
    if (users.find((u: User) => u.email === email)) {
      throw new Error('Email already exists')
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      email,
      name,
      role,
      branchId: 'branch_main',
      password, // In production, this would be hashed
      createdAt: new Date()
    }

    users.push(newUser)
    localStorage.setItem('users', JSON.stringify(users))

    dispatch({ type: 'LOGIN', payload: newUser })
    localStorage.setItem('auth_user', JSON.stringify(newUser))
  }

  const value: AuthContextType = {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    login,
    logout,
    register
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
