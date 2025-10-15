// checkpoint-manager.mjs
// Sistema de checkpoint para salvar progresso e permitir retomada após crashes

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

/**
 * Estrutura de checkpoint
 * @typedef {Object} Checkpoint
 * @property {string} checkpointId - ID único do checkpoint
 * @property {string} sessionId - ID da sessão de execução
 * @property {string} timestamp - ISO timestamp
 * @property {string} phase - Fase atual ('analysis'|'planning'|'execution'|'documentation')
 * @property {number} phaseIndex - Índice da fase atual (0-based)
 * @property {number} totalPhases - Total de fases no plano
 * @property {Object} analysis - Análise da requisição
 * @property {Object} plan - Plano de execução
 * @property {Array} completedPhases - Fases já completadas
 * @property {Array} pendingPhases - Fases ainda pendentes
 * @property {Object} results - Resultados acumulados
 * @property {Object} costs - Custos acumulados
 * @property {Object} metadata - Metadados adicionais
 */

export class CheckpointManager {
  constructor(checkpointDir = '.checkpoints') {
    this.checkpointDir = checkpointDir;
    this.currentCheckpoint = null;
    this.sessionId = null;

    // Cria diretório se não existe
    if (!existsSync(this.checkpointDir)) {
      mkdirSync(this.checkpointDir, { recursive: true });
      console.log(`📁 Checkpoint directory created: ${this.checkpointDir}`);
    }
  }

  /**
   * Inicia nova sessão de checkpoints
   */
  startSession(sessionId, metadata = {}) {
    this.sessionId = sessionId || randomUUID();
    this.currentCheckpoint = null;

    console.log(`🚀 Checkpoint session started: ${this.sessionId}`);

    // Cria checkpoint inicial
    return this.saveCheckpoint('initialized', {
      startTime: new Date().toISOString(),
      metadata
    });
  }

  /**
   * Salva checkpoint após completar uma fase
   */
  saveCheckpoint(phase, data = {}) {
    const checkpointId = `${this.sessionId}-${phase}-${Date.now()}`;

    const checkpoint = {
      checkpointId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      phase,
      phaseIndex: data.phaseIndex || 0,
      totalPhases: data.totalPhases || 0,
      analysis: data.analysis || this.currentCheckpoint?.analysis || null,
      plan: data.plan || this.currentCheckpoint?.plan || null,
      completedPhases: data.completedPhases || this.currentCheckpoint?.completedPhases || [],
      pendingPhases: data.pendingPhases || this.currentCheckpoint?.pendingPhases || [],
      results: data.results || this.currentCheckpoint?.results || { completed: 0, failed: 0, phases: [] },
      costs: data.costs || this.currentCheckpoint?.costs || { total: 0, byAgent: {} },
      metadata: {
        ...this.currentCheckpoint?.metadata,
        ...data.metadata
      }
    };

    // Salva no disco
    const filepath = this.getCheckpointPath(checkpointId);
    writeFileSync(filepath, JSON.stringify(checkpoint, null, 2));

    this.currentCheckpoint = checkpoint;

    console.log(`💾 Checkpoint saved: ${phase} (${checkpointId})`);
    console.log(`   Progress: ${checkpoint.completedPhases.length}/${checkpoint.totalPhases} phases`);

    return checkpoint;
  }

  /**
   * Salva checkpoint após fase de análise
   */
  saveAnalysisCheckpoint(analysis, userPrompt) {
    return this.saveCheckpoint('analysis', {
      analysis,
      metadata: {
        userPrompt,
        complexity: analysis.complexity,
        areas: analysis.areas
      }
    });
  }

  /**
   * Salva checkpoint após criação do plano
   */
  savePlanCheckpoint(plan) {
    return this.saveCheckpoint('planning', {
      plan,
      totalPhases: plan.phases.length,
      pendingPhases: plan.phases.map(p => p.phaseId),
      metadata: {
        strategy: plan.strategy,
        phaseCount: plan.phases.length
      }
    });
  }

  /**
   * Salva checkpoint após completar uma fase de execução
   */
  savePhaseCheckpoint(phaseId, phaseResult, phaseIndex, totalPhases) {
    const completedPhases = [
      ...(this.currentCheckpoint?.completedPhases || []),
      {
        phaseId,
        name: phaseResult.name,
        agent: phaseResult.agent,
        success: phaseResult.success,
        timestamp: new Date().toISOString()
      }
    ];

    const pendingPhases = (this.currentCheckpoint?.pendingPhases || [])
      .filter(id => id !== phaseId);

    const results = this.currentCheckpoint?.results || { completed: 0, failed: 0, phases: [] };
    results.phases.push(phaseResult);
    results.completed = phaseResult.success ? results.completed + 1 : results.completed;
    results.failed = !phaseResult.success ? results.failed + 1 : results.failed;

    return this.saveCheckpoint('execution', {
      phaseIndex,
      totalPhases,
      completedPhases,
      pendingPhases,
      results,
      metadata: {
        lastCompletedPhase: phaseId,
        progress: `${completedPhases.length}/${totalPhases}`
      }
    });
  }

  /**
   * Salva checkpoint final
   */
  saveFinalCheckpoint(report, duration) {
    return this.saveCheckpoint('completed', {
      results: {
        ...this.currentCheckpoint.results,
        report,
        duration
      },
      metadata: {
        completed: true,
        duration: duration / 1000,
        success: report.success
      }
    });
  }

  /**
   * Carrega último checkpoint de uma sessão
   */
  loadCheckpoint(sessionId) {
    const checkpointFiles = this.listCheckpoints(sessionId);

    if (checkpointFiles.length === 0) {
      throw new Error(`No checkpoints found for session: ${sessionId}`);
    }

    // Pega o mais recente
    const latestCheckpoint = checkpointFiles[checkpointFiles.length - 1];
    const filepath = join(this.checkpointDir, latestCheckpoint);

    console.log(`📂 Loading checkpoint: ${latestCheckpoint}`);

    const checkpoint = JSON.parse(readFileSync(filepath, 'utf-8'));
    this.currentCheckpoint = checkpoint;
    this.sessionId = checkpoint.sessionId;

    console.log(`✅ Checkpoint loaded: ${checkpoint.phase}`);
    console.log(`   Progress: ${checkpoint.completedPhases.length}/${checkpoint.totalPhases} phases`);

    return checkpoint;
  }

  /**
   * Lista checkpoints de uma sessão (ordenados por timestamp)
   */
  listCheckpoints(sessionId) {
    if (!existsSync(this.checkpointDir)) {
      return [];
    }

    const fs = require('fs');
    const files = fs.readdirSync(this.checkpointDir);

    return files
      .filter(f => f.startsWith(sessionId) && f.endsWith('.json'))
      .sort(); // Ordena por nome (que inclui timestamp)
  }

  /**
   * Verifica se pode retomar uma sessão
   */
  canResume(sessionId) {
    const checkpoints = this.listCheckpoints(sessionId);

    if (checkpoints.length === 0) {
      return { canResume: false, reason: 'No checkpoints found' };
    }

    const latestFile = checkpoints[checkpoints.length - 1];
    const filepath = join(this.checkpointDir, latestFile);
    const checkpoint = JSON.parse(readFileSync(filepath, 'utf-8'));

    // Se já completou, não precisa retomar
    if (checkpoint.phase === 'completed') {
      return {
        canResume: false,
        reason: 'Session already completed',
        checkpoint
      };
    }

    // Se tem fases pendentes, pode retomar
    if (checkpoint.pendingPhases && checkpoint.pendingPhases.length > 0) {
      return {
        canResume: true,
        reason: `${checkpoint.pendingPhases.length} phases pending`,
        checkpoint,
        progress: `${checkpoint.completedPhases.length}/${checkpoint.totalPhases}`
      };
    }

    return {
      canResume: false,
      reason: 'Unknown state',
      checkpoint
    };
  }

  /**
   * Retoma execução a partir de checkpoint
   * Retorna plano modificado com fases já completadas removidas
   */
  resumeFromCheckpoint(sessionId) {
    const checkpoint = this.loadCheckpoint(sessionId);

    // Valida que pode retomar
    const canResumeCheck = this.canResume(sessionId);
    if (!canResumeCheck.canResume) {
      throw new Error(`Cannot resume: ${canResumeCheck.reason}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🔄 RESUMING FROM CHECKPOINT');
    console.log('='.repeat(60));
    console.log(`Session: ${checkpoint.sessionId}`);
    console.log(`Last phase: ${checkpoint.phase}`);
    console.log(`Progress: ${checkpoint.completedPhases.length}/${checkpoint.totalPhases} phases completed`);
    console.log(`Pending: ${checkpoint.pendingPhases.length} phases remaining`);
    console.log('');

    // Reconstrói plano com apenas fases pendentes
    const resumedPlan = {
      strategy: checkpoint.plan.strategy,
      phases: checkpoint.plan.phases.filter(phase =>
        checkpoint.pendingPhases.includes(phase.phaseId)
      ),
      isResume: true,
      originalPhaseCount: checkpoint.totalPhases,
      completedPhaseCount: checkpoint.completedPhases.length
    };

    console.log(`📋 Resumed plan: ${resumedPlan.phases.length} phases to execute`);
    resumedPlan.phases.forEach((phase, idx) => {
      console.log(`   ${idx + 1}. ${phase.name} → ${phase.agentKey}`);
    });
    console.log('='.repeat(60) + '\n');

    return {
      checkpoint,
      resumedPlan,
      analysis: checkpoint.analysis,
      accumulatedResults: checkpoint.results
    };
  }

  /**
   * Path do checkpoint
   */
  getCheckpointPath(checkpointId) {
    return join(this.checkpointDir, `${checkpointId}.json`);
  }

  /**
   * Lista todas as sessões com checkpoints
   */
  listSessions() {
    if (!existsSync(this.checkpointDir)) {
      return [];
    }

    const fs = require('fs');
    const files = fs.readdirSync(this.checkpointDir);

    // Extrai session IDs únicos
    const sessionIds = new Set();
    for (const file of files) {
      const match = file.match(/^([a-f0-9-]+)-/);
      if (match) {
        sessionIds.add(match[1]);
      }
    }

    // Carrega último checkpoint de cada sessão
    const sessions = [];
    for (const sessionId of sessionIds) {
      try {
        const checkpoints = this.listCheckpoints(sessionId);
        const latestFile = checkpoints[checkpoints.length - 1];
        const filepath = join(this.checkpointDir, latestFile);
        const checkpoint = JSON.parse(readFileSync(filepath, 'utf-8'));

        sessions.push({
          sessionId,
          phase: checkpoint.phase,
          timestamp: checkpoint.timestamp,
          progress: `${checkpoint.completedPhases.length}/${checkpoint.totalPhases}`,
          canResume: checkpoint.phase !== 'completed' && checkpoint.pendingPhases?.length > 0,
          checkpointCount: checkpoints.length
        });
      } catch (error) {
        console.warn(`⚠️ Failed to load session ${sessionId}:`, error.message);
      }
    }

    return sessions.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  /**
   * Limpa checkpoints antigos (mantém últimas N sessões)
   */
  cleanupOldCheckpoints(keepLastN = 5) {
    const sessions = this.listSessions();

    if (sessions.length <= keepLastN) {
      console.log(`🧹 No cleanup needed (${sessions.length}/${keepLastN} sessions)`);
      return { deleted: 0 };
    }

    const fs = require('fs');
    const sessionsToDelete = sessions.slice(keepLastN);
    let deletedCount = 0;

    for (const session of sessionsToDelete) {
      const checkpoints = this.listCheckpoints(session.sessionId);

      for (const checkpoint of checkpoints) {
        const filepath = join(this.checkpointDir, checkpoint);
        fs.unlinkSync(filepath);
        deletedCount++;
      }

      console.log(`🗑️  Deleted session: ${session.sessionId} (${checkpoints.length} checkpoints)`);
    }

    console.log(`✅ Cleanup complete: ${deletedCount} checkpoints deleted`);
    return { deleted: deletedCount, sessions: sessionsToDelete.length };
  }

  /**
   * Relatório de checkpoint atual
   */
  printCurrentStatus() {
    if (!this.currentCheckpoint) {
      console.log('ℹ️  No active checkpoint');
      return;
    }

    const cp = this.currentCheckpoint;

    console.log('\n' + '='.repeat(60));
    console.log('📊 CHECKPOINT STATUS');
    console.log('='.repeat(60));
    console.log(`Session: ${cp.sessionId}`);
    console.log(`Current phase: ${cp.phase}`);
    console.log(`Progress: ${cp.completedPhases.length}/${cp.totalPhases} phases`);
    console.log(`Pending: ${cp.pendingPhases.length} phases`);
    console.log(`Timestamp: ${cp.timestamp}`);
    console.log('');

    if (cp.completedPhases.length > 0) {
      console.log('✅ Completed phases:');
      cp.completedPhases.forEach((phase, idx) => {
        const status = phase.success ? '✅' : '❌';
        console.log(`   ${idx + 1}. ${status} ${phase.name} (@${phase.agent.replace('@', '')})`);
      });
      console.log('');
    }

    if (cp.pendingPhases.length > 0) {
      console.log('⏳ Pending phases:');
      const pendingDetails = cp.plan?.phases.filter(p => cp.pendingPhases.includes(p.phaseId));
      pendingDetails?.forEach((phase, idx) => {
        console.log(`   ${idx + 1}. ${phase.name} (@${phase.agentKey.replace('@', '')})`);
      });
      console.log('');
    }

    console.log(`💰 Total cost: $${cp.costs.total.toFixed(4)}`);
    console.log('='.repeat(60) + '\n');
  }

  /**
   * Estatísticas de checkpoints
   */
  getStats() {
    const sessions = this.listSessions();

    return {
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.canResume).length,
      completedSessions: sessions.filter(s => s.phase === 'completed').length,
      currentSession: this.sessionId,
      currentCheckpoint: this.currentCheckpoint?.checkpointId || null
    };
  }
}

// Singleton global
export const checkpointManager = new CheckpointManager(
  join(process.cwd(), '.checkpoints')
);
