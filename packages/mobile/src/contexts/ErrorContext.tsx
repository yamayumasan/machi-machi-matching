import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Alert } from 'react-native'

interface ErrorContextType {
  showError: (message: string, title?: string) => void
  showNetworkError: () => void
  clearError: () => void
  currentError: string | null
}

const ErrorContext = createContext<ErrorContextType | null>(null)

interface ErrorProviderProps {
  children: ReactNode
}

export function ErrorProvider({ children }: ErrorProviderProps) {
  const [currentError, setCurrentError] = useState<string | null>(null)

  const showError = useCallback((message: string, title = 'エラー') => {
    setCurrentError(message)
    Alert.alert(title, message, [
      {
        text: 'OK',
        onPress: () => setCurrentError(null),
      },
    ])
  }, [])

  const showNetworkError = useCallback(() => {
    showError(
      'ネットワークに接続できません。接続を確認してください。',
      'ネットワークエラー'
    )
  }, [showError])

  const clearError = useCallback(() => {
    setCurrentError(null)
  }, [])

  return (
    <ErrorContext.Provider
      value={{
        showError,
        showNetworkError,
        clearError,
        currentError,
      }}
    >
      {children}
    </ErrorContext.Provider>
  )
}

export function useError() {
  const context = useContext(ErrorContext)
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider')
  }
  return context
}
