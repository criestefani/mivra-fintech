// src/features/broker/services/avalon.service.ts

interface CreateUserData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  country_code?: string;
  locale?: string;
  ip?: string;
  balance_currency_code?: string;
  affId?: number;
}

// ✅ INTERFACE SEM 'any'
interface CreateUserResponse {
  success: boolean;
  error?: string;
  userId?: number;
  data?: {
    id?: number;
    user_id?: number;
    email?: string;
    message?: string;
    status?: string;
    code?: number;
  };
}

class AvalonService {
  private ssid: string | null = null;
  private userId: string | null = null;
  private isConnecting = false;

  // ✅ USANDO VARIÁVEIS DE AMBIENTE
  private readonly API_URL = import.meta.env.VITE_AVALON_SESSION_URL || 'https://api-qc.avalonbots.com:3000';
  private readonly BACKEND_API_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.5:4001'; // ✅ SEU BACKEND
  private readonly BEARER_TOKEN = import.meta.env.VITE_AVALON_KEY;
  private readonly AFF_ID = Number(import.meta.env.VITE_AVALON_AFF_ID) || 430322;

  async connect(userId: string): Promise<boolean> {
    if (this.ssid) {
      console.log('✅ Já conectado');
      return true;
    }

    if (this.isConnecting) {
      console.log('⏳ Conexão em andamento');
      return false;
    }

    try {
      this.isConnecting = true;
      this.userId = userId;

      console.log('🔄 Conectando ao Avalon...');

      const response = await fetch(`${this.API_URL}/session/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.BEARER_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.ssid = data.ssid;

      if (!this.ssid) {
        throw new Error('SSID not received from API');
      }

      console.log('✅ Conectado ao Avalon Broker');
      return true;

    } catch (error) {
      console.error('❌ Erro ao conectar:', error);
      this.ssid = null;
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  // ✅ MÉTODO ATUALIZADO PARA USAR BACKEND PROXY
  async createUser(userData: CreateUserData): Promise<CreateUserResponse> {
    try {
      console.log('🔄 Criando usuário na Avalon via backend...', { email: userData.email });
      console.log('🔧 Configurações:', {
        backendUrl: this.BACKEND_API_URL,
        affId: this.AFF_ID,
      });

      // ✅ AGORA CHAMA O SEU BACKEND, NÃO A AVALON DIRETAMENTE
      const response = await fetch(`${this.BACKEND_API_URL}/api/avalon/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // ✅ NÃO PRECISA MAIS DO AUTHORIZATION - VAI PELO BACKEND
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          first_name: userData.first_name,
          last_name: userData.last_name,
          country_code: userData.country_code || 'BR',
          locale: userData.locale || 'pt_BR',
          ip: userData.ip || '127.0.0.1',
          balance_currency_code: userData.balance_currency_code || 'USD',
          affId: userData.affId || this.AFF_ID,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Erro no backend/Avalon:', data);
        console.error('❌ Status:', response.status);
        
        let errorMessage = 'Erro ao criar conta na corretora';
        
        if (response.status === 400 && data.message?.includes('email')) {
          errorMessage = 'Este email já está cadastrado na corretora parceira. Use um email diferente.';
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.message) {
          errorMessage = data.message;
        }

        return { 
          success: false, 
          error: errorMessage,
          data: {
            id: data.id,
            user_id: data.user_id,
            email: data.email,
            message: data.message,
            status: data.status,
            code: data.code
          }
        };
      }

      console.log('✅ Usuário criado na Avalon via backend:', data);

      return { 
        success: true, 
        userId: data.id || data.user_id,
        data: {
          id: data.id,
          user_id: data.user_id,
          email: data.email,
          message: data.message,
          status: data.status,
          code: data.code
        }
      };

    } catch (error) {
      console.error('❌ Erro de conexão com backend:', error);
      return { 
        success: false, 
        error: 'Erro de conexão com o servidor. Tente novamente.' 
      };
    }
  }

  async disconnect(): Promise<void> {
    this.ssid = null;
    this.userId = null;
    console.log('🔌 Desconectado do Avalon');
  }

  async getBalance() {
    if (!this.ssid) {
      throw new Error('Not connected to Avalon');
    }

    return {
      id: 1,
      amount: 1000.00,
      currency: 'USD',
      type: 'PRACTICE',
    };
  }

  isConnected(): boolean {
    return this.ssid !== null;
  }

  getSSID(): string | null {
    return this.ssid;
  }

  // ✅ MÉTODO PARA DEBUG - VER CONFIGURAÇÕES
  getConfig() {
    return {
      sessionApiUrl: this.API_URL,
      backendUrl: this.BACKEND_API_URL,
      affId: this.AFF_ID,
      hasToken: !!this.BEARER_TOKEN,
    };
  }
}

export default new AvalonService();
