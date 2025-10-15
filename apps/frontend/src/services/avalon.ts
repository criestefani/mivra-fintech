// Avalon Broker Service
// This service interfaces with the Avalon Broker API

const AVALON_CREATE_USER_URL = import.meta.env.VITE_AVALON_CREATE_USER_URL || 'https://api.trade.avalonbroker.com'
const AVALON_AFF_ID = import.meta.env.VITE_AVALON_AFF_ID || '430322'

interface CreateUserParams {
  email: string
  password: string
  first_name: string
  last_name: string
  country_code: string
  locale: string
}

interface CreateUserResult {
  success: boolean
  userId?: number
  error?: string
}

class AvalonService {
  async createUser(params: CreateUserParams): Promise<CreateUserResult> {
    try {
      console.log('[AvalonService] Creating user:', params.email)

      const response = await fetch(`${AVALON_CREATE_USER_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...params,
          aff_id: AVALON_AFF_ID,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('[AvalonService] Create user failed:', errorData)

        // Erro 409 = Usuário já existe
        if (response.status === 409) {
          return {
            success: false,
            error: 'Este email já está cadastrado na corretora. Use outro email ou faça login.',
          }
        }

        // Erro 422 = Dados inválidos
        if (response.status === 422) {
          return {
            success: false,
            error: 'Dados inválidos. Verifique se o email e senha estão corretos.',
          }
        }

        // Erro 451 = Restrição de país
        if (response.status === 451) {
          return {
            success: false,
            error: 'Cadastro não permitido para seu país.',
          }
        }

        return {
          success: false,
          error: errorData.message || 'Erro ao criar conta na corretora',
        }
      }

      const data = await response.json()
      console.log('[AvalonService] User created successfully:', data)

      return {
        success: true,
        userId: data.id || data.user_id,
      }
    } catch (error: any) {
      console.error('[AvalonService] Unexpected error:', error)
      return {
        success: false,
        error: error.message || 'Network error',
      }
    }
  }
}

export default new AvalonService()
