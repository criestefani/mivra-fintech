// agent-communication.mjs
// Protocolo de comunicação entre agentes do MivraTech Team

/**
 * Estrutura de mensagem entre agentes
 * @typedef {Object} AgentMessage
 * @property {string} messageId - UUID único da mensagem
 * @property {string} from - Agente que envia (@manager, @architect, etc)
 * @property {string} to - Agente destinatário
 * @property {string} type - Tipo: 'task' | 'report' | 'escalation' | 'question'
 * @property {Object} payload - Conteúdo da mensagem
 * @property {number} timestamp - Unix timestamp
 * @property {string} [parentMessageId] - ID da mensagem pai (threading)
 */

/**
 * Estrutura de Task (tarefa delegada)
 * @typedef {Object} Task
 * @property {string} taskId - UUID único da tarefa
 * @property {string} title - Título curto da tarefa
 * @property {string} description - Descrição detalhada
 * @property {string} type - 'create' | 'modify' | 'delete' | 'analyze' | 'test'
 * @property {string[]} files - Arquivos envolvidos
 * @property {Object} context - Contexto mínimo necessário
 * @property {number} priority - 1 (baixa) a 5 (crítica)
 * @property {string[]} dependencies - IDs de tarefas que devem completar antes
 * @property {Object} acceptanceCriteria - Critérios para aceitar como concluída
 */

/**
 * Estrutura de Report (relatório de conclusão)
 * @typedef {Object} Report
 * @property {string} taskId - ID da tarefa concluída
 * @property {string} status - 'success' | 'failed' | 'escalated'
 * @property {Object} result - Resultado da execução
 * @property {string[]} filesModified - Arquivos criados/modificados
 * @property {Object} [error] - Detalhes do erro (se falhou)
 * @property {Object} metrics - Métricas de execução (tokens, tempo, etc)
 */

import { randomUUID } from 'crypto';

export class AgentCommunicationProtocol {
  constructor() {
    this.messageHistory = [];
    this.taskRegistry = new Map(); // taskId -> Task
    this.messageQueue = new Map(); // agentKey -> Message[]
  }

  /**
   * Cria uma nova mensagem no protocolo
   */
  createMessage(from, to, type, payload, parentMessageId = null) {
    const message = {
      messageId: randomUUID(),
      from,
      to,
      type,
      payload,
      timestamp: Date.now(),
      parentMessageId
    };

    this.messageHistory.push(message);

    // Adiciona na fila do destinatário
    if (!this.messageQueue.has(to)) {
      this.messageQueue.set(to, []);
    }
    this.messageQueue.get(to).push(message);

    return message;
  }

  /**
   * Cria uma tarefa para delegação
   */
  createTask(title, description, config = {}) {
    const task = {
      taskId: randomUUID(),
      title,
      description,
      type: config.type || 'modify',
      files: config.files || [],
      context: config.context || {},
      priority: config.priority || 3,
      dependencies: config.dependencies || [],
      acceptanceCriteria: config.acceptanceCriteria || {},
      createdAt: Date.now(),
      status: 'pending'
    };

    this.taskRegistry.set(task.taskId, task);
    return task;
  }

  /**
   * Manager delega tarefa para agente
   */
  delegateTask(fromAgent, toAgent, task) {
    return this.createMessage(fromAgent, toAgent, 'task', task);
  }

  /**
   * Agente reporta conclusão de tarefa
   */
  reportTaskCompletion(fromAgent, toAgent, report) {
    const task = this.taskRegistry.get(report.taskId);
    if (task) {
      task.status = report.status;
      task.completedAt = Date.now();
    }

    return this.createMessage(fromAgent, toAgent, 'report', report);
  }

  /**
   * Agente solicita escalação (Haiku -> Sonnet)
   */
  requestEscalation(fromAgent, toAgent, escalationRequest) {
    return this.createMessage(fromAgent, toAgent, 'escalation', escalationRequest);
  }

  /**
   * Agente faz pergunta para outro agente
   */
  askQuestion(fromAgent, toAgent, question, parentMessageId = null) {
    return this.createMessage(fromAgent, toAgent, 'question', { question }, parentMessageId);
  }

  /**
   * Obtém mensagens pendentes para um agente
   */
  getMessagesFor(agentKey) {
    return this.messageQueue.get(agentKey) || [];
  }

  /**
   * Marca mensagem como processada
   */
  markAsProcessed(messageId, agentKey) {
    const queue = this.messageQueue.get(agentKey);
    if (queue) {
      const index = queue.findIndex(m => m.messageId === messageId);
      if (index !== -1) {
        queue.splice(index, 1);
      }
    }
  }

  /**
   * Obtém histórico de uma tarefa (threading)
   */
  getTaskThread(taskId) {
    return this.messageHistory.filter(m =>
      m.payload?.taskId === taskId
    );
  }

  /**
   * Obtém todas as tarefas em um estado específico
   */
  getTasksByStatus(status) {
    return Array.from(this.taskRegistry.values()).filter(t => t.status === status);
  }

  /**
   * Obtém DAG de dependências de tarefas
   */
  getTaskDAG() {
    const tasks = Array.from(this.taskRegistry.values());
    const dag = new Map();

    for (const task of tasks) {
      dag.set(task.taskId, {
        task,
        dependencies: task.dependencies,
        dependents: tasks
          .filter(t => t.dependencies.includes(task.taskId))
          .map(t => t.taskId)
      });
    }

    return dag;
  }

  /**
   * Verifica se uma tarefa pode ser executada (deps satisfeitas)
   */
  canExecuteTask(taskId) {
    const task = this.taskRegistry.get(taskId);
    if (!task) return false;

    // Verifica se todas as dependências estão completas
    return task.dependencies.every(depId => {
      const depTask = this.taskRegistry.get(depId);
      return depTask && depTask.status === 'success';
    });
  }

  /**
   * Obtém próximas tarefas executáveis (sem deps pendentes)
   */
  getExecutableTasks() {
    return Array.from(this.taskRegistry.values())
      .filter(t => t.status === 'pending' && this.canExecuteTask(t.taskId));
  }

  /**
   * Estatísticas de comunicação
   */
  getStats() {
    const tasksByStatus = {
      pending: 0,
      'in_progress': 0,
      success: 0,
      failed: 0,
      escalated: 0
    };

    for (const task of this.taskRegistry.values()) {
      tasksByStatus[task.status] = (tasksByStatus[task.status] || 0) + 1;
    }

    return {
      totalMessages: this.messageHistory.length,
      totalTasks: this.taskRegistry.size,
      tasksByStatus,
      messagesByType: this.messageHistory.reduce((acc, m) => {
        acc[m.type] = (acc[m.type] || 0) + 1;
        return acc;
      }, {}),
      queueLengths: Object.fromEntries(
        Array.from(this.messageQueue.entries()).map(([agent, queue]) => [agent, queue.length])
      )
    };
  }

  /**
   * Limpa histórico antigo (> 24h)
   */
  cleanup(maxAgeMs = 24 * 60 * 60 * 1000) {
    const cutoff = Date.now() - maxAgeMs;

    // Remove mensagens antigas
    this.messageHistory = this.messageHistory.filter(m => m.timestamp > cutoff);

    // Remove tarefas completadas antigas
    for (const [taskId, task] of this.taskRegistry.entries()) {
      if (task.completedAt && task.completedAt < cutoff) {
        this.taskRegistry.delete(taskId);
      }
    }
  }

  /**
   * Export para debugging
   */
  exportState() {
    return {
      messageHistory: this.messageHistory,
      tasks: Array.from(this.taskRegistry.values()),
      queues: Object.fromEntries(this.messageQueue.entries()),
      stats: this.getStats()
    };
  }
}

// Singleton global
export const agentComms = new AgentCommunicationProtocol();
