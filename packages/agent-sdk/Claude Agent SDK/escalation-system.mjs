// escalation-system.mjs
// Sistema de escalação Haiku → Sonnet para tarefas complexas

import { basename } from 'path';

/**
 * Arquivos críticos que sempre requerem Sonnet
 */
const CRITICAL_FILES = [
  'bot-live.mjs',
  'market-scanner.mjs',
  'api-server.mjs',
  'bot-engine.js',
  'mcp.server.zod.complete.mjs',
  'agents.config.mjs',
  'manager-orchestrator.mjs'
];

/**
 * Padrões de path críticos (regex)
 */
const CRITICAL_PATH_PATTERNS = [
  /\/bot\//,           // Lógica de trading bot
  /\/scanner\//,       // Market scanner
  /\/core\//,          // Core modules
  /\/auth\//,          // Autenticação
  /\/payment\//,       // Pagamentos
  /\.sql$/,            // Migrations SQL
  /\/migrations\//,    // Pasta de migrations
  /\/security\//,      // Segurança
  /\/rls\//            // Row Level Security
];

/**
 * Tipos de tarefa que sempre requerem Sonnet
 */
const CRITICAL_TASK_TYPES = [
  'refactor-multi-file',
  'security-fix',
  'database-migration',
  'trading-strategy',
  'authentication',
  'payment-integration',
  'api-contract-change'
];

/**
 * Regras de escalação
 * @typedef {Object} EscalationRule
 * @property {string} id - ID da regra
 * @property {string} description - Descrição
 * @property {Function} check - Função que retorna true se deve escalar
 * @property {number} priority - Prioridade (1-5, 5 = mais crítico)
 */

/**
 * Motivo de escalação
 * @typedef {Object} EscalationReason
 * @property {string} ruleId - ID da regra que disparou
 * @property {string} reason - Motivo detalhado
 * @property {number} priority - Prioridade
 * @property {Object} metadata - Dados adicionais
 */

export class EscalationSystem {
  constructor() {
    this.rules = this.initializeRules();
    this.escalationHistory = [];
    this.haikuAttempts = new Map(); // taskId -> tentativas
  }

  /**
   * Inicializa regras de escalação
   */
  initializeRules() {
    return [
      {
        id: 'critical-file',
        description: 'Arquivo crítico do sistema',
        priority: 5,
        check: (context) => {
          const { files = [] } = context;
          return files.some(f => CRITICAL_FILES.includes(basename(f)));
        }
      },
      {
        id: 'critical-path',
        description: 'Path crítico (bot, auth, payment)',
        priority: 5,
        check: (context) => {
          const { files = [] } = context;
          return files.some(f => CRITICAL_PATH_PATTERNS.some(pattern => pattern.test(f)));
        }
      },
      {
        id: 'critical-task-type',
        description: 'Tipo de tarefa crítica',
        priority: 5,
        check: (context) => {
          const { taskType } = context;
          return CRITICAL_TASK_TYPES.includes(taskType);
        }
      },
      {
        id: 'large-diff',
        description: 'Mudança muito grande (>100 linhas)',
        priority: 4,
        check: (context) => {
          const { estimatedLines = 0 } = context;
          return estimatedLines > 100;
        }
      },
      {
        id: 'multi-file',
        description: 'Múltiplos arquivos envolvidos (>3)',
        priority: 4,
        check: (context) => {
          const { files = [] } = context;
          return files.length > 3;
        }
      },
      {
        id: 'cross-module',
        description: 'Mudança afeta múltiplos módulos',
        priority: 4,
        check: (context) => {
          const { files = [] } = context;
          const modules = new Set(files.map(f => f.split('/')[1])); // apps/[module]
          return modules.size > 1;
        }
      },
      {
        id: 'haiku-failed-twice',
        description: 'Haiku falhou 2x nesta tarefa',
        priority: 5,
        check: (context) => {
          const { taskId } = context;
          const attempts = this.haikuAttempts.get(taskId) || 0;
          return attempts >= 2;
        }
      },
      {
        id: 'low-confidence',
        description: 'Haiku indicou baixa confiança',
        priority: 3,
        check: (context) => {
          const { confidence = 1.0 } = context;
          return confidence < 0.7;
        }
      },
      {
        id: 'complex-logic',
        description: 'Lógica complexa detectada (loops aninhados, recursão)',
        priority: 3,
        check: (context) => {
          const { complexity = 'simple' } = context;
          return complexity === 'complex' || complexity === 'very-complex';
        }
      },
      {
        id: 'external-api',
        description: 'Integração com API externa',
        priority: 3,
        check: (context) => {
          const { hasExternalAPI = false } = context;
          return hasExternalAPI;
        }
      }
    ];
  }

  /**
   * Verifica se deve escalar para Sonnet
   * Retorna { shouldEscalate: boolean, reasons: EscalationReason[] }
   */
  shouldEscalate(context) {
    const reasons = [];

    for (const rule of this.rules) {
      try {
        if (rule.check(context)) {
          reasons.push({
            ruleId: rule.id,
            reason: rule.description,
            priority: rule.priority,
            metadata: { ...context }
          });
        }
      } catch (error) {
        console.error(`❌ Erro ao executar regra ${rule.id}:`, error.message);
      }
    }

    // Escalate se tiver alguma razão de prioridade >= 4 OU >= 2 razões
    const shouldEscalate =
      reasons.some(r => r.priority >= 4) ||
      reasons.length >= 2;

    return { shouldEscalate, reasons };
  }

  /**
   * Registra tentativa de Haiku
   */
  registerHaikuAttempt(taskId, success = false) {
    const current = this.haikuAttempts.get(taskId) || 0;

    if (success) {
      // Se teve sucesso, reseta contador
      this.haikuAttempts.delete(taskId);
      console.log(`✅ Haiku succeeded on task ${taskId}`);
    } else {
      // Incrementa falhas
      this.haikuAttempts.set(taskId, current + 1);
      console.warn(`⚠️ Haiku failed on task ${taskId} (attempt ${current + 1})`);
    }
  }

  /**
   * Executa escalação para Sonnet
   * Retorna novo contexto com modelo atualizado
   */
  async escalateToSonnet(taskContext, agent, reason = 'auto') {
    const escalation = {
      taskId: taskContext.taskId,
      agent,
      from: 'claude-3-5-haiku-20241022',
      to: 'claude-sonnet-4-20250514',
      reason,
      reasons: taskContext.escalationReasons || [],
      timestamp: new Date().toISOString()
    };

    this.escalationHistory.push(escalation);

    console.log(`🔼 ESCALATION: ${agent} task ${taskContext.taskId}`);
    console.log(`   Reason: ${reason}`);
    if (taskContext.escalationReasons) {
      taskContext.escalationReasons.forEach(r => {
        console.log(`   - ${r.reason} (priority: ${r.priority})`);
      });
    }

    // Retorna contexto atualizado com Sonnet
    return {
      ...taskContext,
      model: 'claude-sonnet-4-20250514',
      escalated: true,
      escalationInfo: escalation
    };
  }

  /**
   * Analisa contexto e decide modelo apropriado
   * Retorna { model: string, shouldEscalate: boolean, reasons: [] }
   */
  analyzeAndDecide(context, defaultModel = 'claude-3-5-haiku-20241022') {
    const { shouldEscalate, reasons } = this.shouldEscalate(context);

    if (shouldEscalate) {
      return {
        model: 'claude-sonnet-4-20250514',
        shouldEscalate: true,
        reasons
      };
    }

    return {
      model: defaultModel,
      shouldEscalate: false,
      reasons: []
    };
  }

  /**
   * Valida se arquivo é seguro para Haiku
   */
  isFileSafeForHaiku(filepath) {
    // Checa lista de arquivos críticos
    if (CRITICAL_FILES.includes(basename(filepath))) {
      return false;
    }

    // Checa padrões de path críticos
    if (CRITICAL_PATH_PATTERNS.some(pattern => pattern.test(filepath))) {
      return false;
    }

    // Caminhos seguros para Haiku
    const safePaths = [
      /\/features\//,
      /\/components\/ui\//,
      /\/utils\//,
      /\/hooks\//,
      /\/types\//,
      /\/constants\//,
      /\.md$/,
      /\.json$/,
      /\.css$/
    ];

    return safePaths.some(pattern => pattern.test(filepath));
  }

  /**
   * Sugere modelo baseado em múltiplos arquivos
   */
  suggestModelForFiles(files) {
    const analysis = {
      totalFiles: files.length,
      criticalFiles: 0,
      safeFiles: 0,
      unknownFiles: 0
    };

    for (const file of files) {
      if (!this.isFileSafeForHaiku(file)) {
        analysis.criticalFiles++;
      } else {
        analysis.safeFiles++;
      }
    }

    analysis.unknownFiles = analysis.totalFiles - analysis.criticalFiles - analysis.safeFiles;

    // Se tiver QUALQUER arquivo crítico, usa Sonnet
    if (analysis.criticalFiles > 0) {
      return {
        model: 'claude-sonnet-4-20250514',
        reason: 'critical-files-detected',
        analysis
      };
    }

    // Se todos seguros, Haiku
    if (analysis.safeFiles === analysis.totalFiles) {
      return {
        model: 'claude-3-5-haiku-20241022',
        reason: 'all-files-safe',
        analysis
      };
    }

    // Default: Sonnet por segurança
    return {
      model: 'claude-sonnet-4-20250514',
      reason: 'unknown-files-detected',
      analysis
    };
  }

  /**
   * Estatísticas de escalação
   */
  getStats() {
    const totalEscalations = this.escalationHistory.length;
    const byAgent = {};
    const byReason = {};

    for (const esc of this.escalationHistory) {
      // Por agente
      byAgent[esc.agent] = (byAgent[esc.agent] || 0) + 1;

      // Por razão
      for (const r of esc.reasons) {
        byReason[r.ruleId] = (byReason[r.ruleId] || 0) + 1;
      }
    }

    return {
      totalEscalations,
      byAgent,
      byReason,
      haikuAttemptsPending: this.haikuAttempts.size
    };
  }

  /**
   * Relatório de escalações
   */
  printEscalationReport() {
    const stats = this.getStats();

    console.log('\n' + '='.repeat(60));
    console.log('🔼 ESCALATION SYSTEM - REPORT');
    console.log('='.repeat(60));
    console.log(`Total Escalations: ${stats.totalEscalations}`);
    console.log(`Haiku Retry Attempts Pending: ${stats.haikuAttemptsPending}`);
    console.log('');

    console.log('📊 Escalations by Agent:');
    for (const [agent, count] of Object.entries(stats.byAgent)) {
      console.log(`  ${agent}: ${count}`);
    }
    console.log('');

    console.log('📋 Escalations by Reason:');
    const sorted = Object.entries(stats.byReason)
      .sort((a, b) => b[1] - a[1]);

    for (const [reason, count] of sorted) {
      const rule = this.rules.find(r => r.id === reason);
      console.log(`  ${rule?.description || reason}: ${count}`);
    }
    console.log('='.repeat(60) + '\n');
  }

  /**
   * Limpa histórico antigo
   */
  cleanup(maxAgeMs = 24 * 60 * 60 * 1000) {
    const cutoff = Date.now() - maxAgeMs;

    this.escalationHistory = this.escalationHistory.filter(
      e => new Date(e.timestamp).getTime() > cutoff
    );

    console.log(`🧹 Escalation history cleaned (kept ${this.escalationHistory.length})`);
  }

  /**
   * Export estado
   */
  exportState() {
    return {
      rules: this.rules.map(r => ({ id: r.id, description: r.description, priority: r.priority })),
      escalationHistory: this.escalationHistory,
      haikuAttempts: Object.fromEntries(this.haikuAttempts),
      stats: this.getStats()
    };
  }
}

// Singleton global
export const escalationSystem = new EscalationSystem();
