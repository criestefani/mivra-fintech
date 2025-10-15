/**
 * Avalon Broker QuadCode SDK Integration
 * 
 * IMPORTANTE: A instalação do SDK @quadcode-tech/client-sdk-js foi removida temporariamente
 * porque estava causando conflitos com React (múltiplas instâncias no bundle).
 * 
 * Quando estiver pronto para implementar o trading real, instale o SDK novamente:
 * npm install @quadcode-tech/client-sdk-js
 * 
 * E descomente as importações abaixo:
 * import { ClientSdk, SsidAuthMethod } from '@quadcode-tech/client-sdk-js';
 */

const AVALON_CONFIG = {
  apiUrl: "https://api.trade.avalonbroker.com",
  wsUrl: "wss://ws.trade.avalonbroker.com/echo/websocket",
  sessionEndpoint: "http://api-qc.avalonbots.com:3000/session/183588600",
  bearerToken: "dfc29735b5450651d5c03f4fb6508ed9",
  userId: 183588600,
};

interface SessionResponse {
  ssid: string;
}

export class AvalonService {
  private static ssid: string | null = null;

  /**
   * Cria uma sessão SSID com a API do Avalon Broker
   */
  static async createSession(): Promise<string> {
    try {
      const response = await fetch(AVALON_CONFIG.sessionEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AVALON_CONFIG.bearerToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`);
      }

      const data: SessionResponse = await response.json();
      this.ssid = data.ssid;
      return data.ssid;
    } catch (error) {
      console.error("Error creating Avalon session:", error);
      throw error;
    }
  }

  /**
   * Inicializa o SDK com o SSID
   * Nota: Esta função será implementada quando o SDK for necessário para trading
   */
  static async initSDK(ssid: string) {
    // TODO: Implementar quando necessário
    // const sdk = await ClientSdk.create(
    //   AVALON_CONFIG.wsUrl,
    //   AVALON_CONFIG.userId,
    //   new SsidAuthMethod(ssid)
    // );
    // return sdk;
    console.log("SDK initialization called with ssid:", ssid);
  }

  /**
   * Lista os ativos disponíveis para trading
   * Retorna uma lista mockada por enquanto (MVP)
   */
  static async getActives(): Promise<string[]> {
    try {
      // Simulando delay de rede
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Lista de ativos comuns em Turbo Options
      const mockActives = [
        "EURUSD",
        "GBPUSD",
        "USDJPY",
        "AUDUSD",
        "USDCAD",
        "USDCHF",
        "NZDUSD",
        "EURGBP",
        "EURJPY",
        "GBPJPY",
        "BTCUSD",
        "ETHUSD",
        "LTCUSD",
        "XRPUSD",
        "GOLD",
        "SILVER",
        "OIL",
        "SP500",
        "NASDAQ",
        "DOW",
      ];

      return mockActives;

      // TODO: Implementação real quando SDK estiver pronto
      // const ssid = await this.createSession();
      // const sdk = await this.initSDK(ssid);
      // const blitzOptions = await sdk.blitzOptions();
      // return blitzOptions.getActives();
    } catch (error) {
      console.error("Error getting actives list:", error);
      throw error;
    }
  }

  /**
   * Retorna o SSID atual ou cria um novo se não existir
   */
  static async getOrCreateSSID(): Promise<string> {
    if (this.ssid) {
      return this.ssid;
    }
    return await this.createSession();
  }
}
