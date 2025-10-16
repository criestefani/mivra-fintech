// Wrapper around sonner for toast notifications
import { toast as sonnerToast } from 'sonner'

type ToastProps = {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

export const useToast = () => {
  const toast = ({ title, description, variant = 'default', duration = 3000 }: ToastProps) => {
    const message = title || description || ''
    const fullMessage = title && description ? `${title}\n${description}` : message

    if (variant === 'destructive') {
      sonnerToast.error(fullMessage, { duration })
    } else {
      sonnerToast.success(fullMessage, { duration })
    }
  }

  return { toast }
}
