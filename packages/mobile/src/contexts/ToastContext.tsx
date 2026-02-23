import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import { Toast, ToastType } from '@/components/ui/Toast'

interface ToastConfig {
  message: string
  type?: ToastType
  duration?: number
  action?: {
    label: string
    onPress: () => void
  }
}

interface ToastContextType {
  showToast: (config: ToastConfig) => void
  showSuccess: (message: string, duration?: number) => void
  showError: (message: string, duration?: number) => void
  showWarning: (message: string, duration?: number) => void
  showInfo: (message: string, duration?: number) => void
  hideToast: () => void
}

const ToastContext = createContext<ToastContextType | null>(null)

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [visible, setVisible] = useState(false)
  const [config, setConfig] = useState<ToastConfig>({
    message: '',
    type: 'info',
    duration: 3000,
  })

  const showToast = useCallback((newConfig: ToastConfig) => {
    setConfig({
      ...newConfig,
      type: newConfig.type || 'info',
      duration: newConfig.duration ?? 3000,
    })
    setVisible(true)
  }, [])

  const showSuccess = useCallback((message: string, duration?: number) => {
    showToast({ message, type: 'success', duration })
  }, [showToast])

  const showError = useCallback((message: string, duration?: number) => {
    showToast({ message, type: 'error', duration: duration ?? 4000 })
  }, [showToast])

  const showWarning = useCallback((message: string, duration?: number) => {
    showToast({ message, type: 'warning', duration })
  }, [showToast])

  const showInfo = useCallback((message: string, duration?: number) => {
    showToast({ message, type: 'info', duration })
  }, [showToast])

  const hideToast = useCallback(() => {
    setVisible(false)
  }, [])

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        hideToast,
      }}
    >
      {children}
      <Toast
        visible={visible}
        message={config.message}
        type={config.type}
        duration={config.duration}
        action={config.action}
        onDismiss={hideToast}
      />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
