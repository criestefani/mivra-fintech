// manager-orchestrator.mjs
// Core do sistema de orquestração - Manager Agent

import { query } from '@anthropic-ai/claude-agent-sdk';
import { agentComms } from './agent-communication.mjs';
import { costTracker } from './cost-tracker.mjs';
import { contextOptimizer } from './context-optimizer.mjs';
import { escalationSystem } from './escalation-system.mjs';
import { tokenValidator } from './token-validator.mjs';
import { smartChunker } from './smart-chunker.mjs';
import { checkpointManager } from './checkpoint-manager.mjs';
import { areaFileMapper } from './area-file-mapper.mjs';
import { SUBAGENTS } from './agents.config.mjs';
import agentMemory from './agent-memory.mjs';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import ora from 'ora';

/**
 * Complexidade de tarefa
 * @typedef {'trivial'|'simple'|'medium'|'complex'|'very-complex'} TaskComplexity
 */

/**
 * Fase de execução
 * @typedef {Object} ExecutionPhase
 * @property {string} phaseId - ID único da fase
 * @property {string} name - Nome da fase
 * @property {string} agentKey - Agente responsável
 * @property {Object} task - Tarefa a executar
 * @property {string[]} dependencies - IDs de fases que devem completar antes
 * @property {string} status - 'pending' | 'in_progress' | 'completed' | 'failed'
 */

export class ManagerOrchestrator {
  constructor(mcpServer, options = {}) {
    this.mcp = mcpServer;
    this.projectKnowledge = new Map(); // area -> cached knowledge
    this.lastKnowledgeUpdate = null;
    this.activePhases = new Map(); // phaseId -> ExecutionPhase
    this.completedPhases = [];
    this.sessionId = randomUUID(); // Unique session ID for memory tracking
    this.currentMainTaskId = null; // Track main task for current request
    this.dryRun = options.dryRun || false; // Modo dry-run (apenas simula)

    console.log(`📝 Manager session started: ${this.sessionId}${this.dryRun ? ' (DRY RUN MODE)' : ''}`);
  }

  /**
   * MAIN ENTRY POINT - recebe prompt do usuário
   */
  async handleUserRequest(userPrompt) {
    console.log('\n' + '='.repeat(70));
    console.log('🎯 MANAGER ORCHESTRATOR - NEW REQUEST');
    console.log('='.repeat(70));
    console.log(`📝 User: ${userPrompt}`);
    console.log('');

    // 🧪 Se dry-run, executa simulação ao invés de execução real
    if (this.dryRun) {
      return await this.dryRunAnalysis(userPrompt);
    }

    const startTime = Date.now();

    // Create main task in agent memory
    this.currentMainTaskId = agentMemory.generateTaskId('@manager', 'orchestrate');

    // 💾 Start checkpoint session
    checkpointManager.startSession(this.sessionId, {
      userPrompt,
      mainTaskId: this.currentMainTaskId,
      startTime: new Date().toISOString()
    });

    try {
      // 📝 Create main task record
      await agentMemory.createTask({
        agent: '@manager',
        sessionId: this.sessionId,
        taskId: this.currentMainTaskId,
        taskDescription: userPrompt,
        context: {
          startTime: new Date().toISOString(),
          status: 'analyzing'
        }
      });

      // 1. ANALYZE - Entende a requisição
      console.log('🔍 [PHASE 1] ANALYZING REQUEST...');
      const analysis = await this.analyzeRequest(userPrompt);
      console.log(`   Complexity: ${analysis.complexity}`);
      console.log(`   Areas: ${analysis.areas.join(', ')}`);
      console.log(`   Estimated effort: ${analysis.estimatedTokens} tokens`);
      console.log('');

      // 💾 Save analysis checkpoint
      checkpointManager.saveAnalysisCheckpoint(analysis, userPrompt);

      // Save analysis context
      await agentMemory.saveContext(
        this.currentMainTaskId,
        {
          status: 'planning',
          analysis,
          phase: 'analysis_complete'
        },
        [],
        'Analysis phase completed'
      );

      // 2. PLAN - Cria plano de execução
      console.log('📋 [PHASE 2] CREATING EXECUTION PLAN...');
      const plan = await this.createExecutionPlan(analysis, userPrompt);
      console.log(`   Phases: ${plan.phases.length}`);
      plan.phases.forEach((phase, idx) => {
        console.log(`   ${idx + 1}. ${phase.name} → ${phase.agentKey}`);
      });
      console.log('');

      // 💾 Save plan checkpoint
      checkpointManager.savePlanCheckpoint(plan);

      // Save plan context
      await agentMemory.saveContext(
        this.currentMainTaskId,
        {
          status: 'executing',
          plan: {
            strategy: plan.strategy,
            phaseCount: plan.phases.length,
            phases: plan.phases.map(p => ({
              id: p.phaseId,
              name: p.name,
              agent: p.agentKey
            }))
          },
          phase: 'plan_complete'
        },
        [],
        `Created ${plan.phases.length}-phase execution plan`
      );

      // Update status to in_progress
      await agentMemory.updateTaskStatus(this.currentMainTaskId, 'in_progress');

      // 3. EXECUTE - Executa plano fase por fase
      console.log('⚙️  [PHASE 3] EXECUTING PLAN...');
      const results = await this.executePlan(plan);
      console.log('');

      // 4. CONSOLIDATE - Consolida resultados
      console.log('📦 [PHASE 4] CONSOLIDATING RESULTS...');
      const report = await this.consolidateResults(results, analysis);

      // 5. UPDATE KNOWLEDGE - Atualiza base de conhecimento
      console.log('💾 [PHASE 5] UPDATING PROJECT KNOWLEDGE...');
      await this.updateProjectKnowledge(analysis.areas, results);

      const duration = Date.now() - startTime;
      console.log('');
      console.log('✅ REQUEST COMPLETED');
      console.log(`   Duration: ${(duration / 1000).toFixed(2)}s`);
      console.log(`   Phases completed: ${results.completed}/${results.total}`);
      console.log('='.repeat(70) + '\n');

      // 💾 Save final checkpoint
      checkpointManager.saveFinalCheckpoint(report, duration);

      // Print reports
      costTracker.printSessionReport();
      escalationSystem.printEscalationReport();

      // ✅ Complete main task
      await agentMemory.completeTask(
        this.currentMainTaskId,
        {
          status: 'completed',
          report,
          duration: duration / 1000,
          phase: 'all_complete'
        },
        `Completed successfully in ${(duration / 1000).toFixed(2)}s`
      );

      return report;
    } catch (error) {
      console.error('❌ MANAGER ERROR:', error.message);
      console.error(error.stack);

      // ❌ Fail main task
      await agentMemory.failTask(
        this.currentMainTaskId,
        error.message,
        {
          stack: error.stack,
          duration: (Date.now() - startTime) / 1000
        }
      );

      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * DRY RUN MODE - Simula execução e mostra preview de custos
   */
  async dryRunAnalysis(userPrompt) {
    console.log('\n' + '='.repeat(70));
    console.log('🧪 DRY RUN MODE - SIMULATION');
    console.log('='.repeat(70));
    console.log('This will analyze and plan WITHOUT executing or spending money.');
    console.log('');

    const startTime = Date.now();

    try {
      // 1. ANALYZE (real - necessário para estimar)
      console.log('🔍 [PHASE 1] ANALYZING REQUEST...');
      const analysis = await this.analyzeRequest(userPrompt);
      console.log(`   Complexity: ${analysis.complexity}`);
      console.log(`   Areas: ${analysis.areas.join(', ')}`);
      console.log(`   Estimated effort: ${analysis.estimatedTokens} tokens`);
      console.log('');

      // 2. PLAN (real - necessário para ver fases)
      console.log('📋 [PHASE 2] CREATING EXECUTION PLAN...');
      const plan = await this.createExecutionPlan(analysis, userPrompt);
      console.log(`   Strategy: ${plan.strategy}`);
      console.log(`   Total phases: ${plan.phases.length}`);
      console.log('');

      // 3. SIMULATE EXECUTION - Estima custos sem executar
      console.log('💰 [PHASE 3] COST ESTIMATION...');
      console.log('');

      let totalEstimatedCost = 0;
      const phaseEstimates = [];

      for (let i = 0; i < plan.phases.length; i++) {
        const phase = plan.phases[i];
        const agent = SUBAGENTS[phase.agentKey.replace('@', '')];

        console.log(`📊 Phase ${i + 1}: ${phase.name}`);
        console.log(`   Agent: ${phase.agentKey}`);

        // 🎯 CORREÇÃO: Usa area-file-mapper para pegar APENAS arquivos relevantes
        const relevantFiles = areaFileMapper.getFilesForAgent(phase.agentKey);
        console.log(`   Files: ${relevantFiles.length} (específicos para ${phase.agentKey})`);

        // Extrai contexto (para estimar)
        const context = await contextOptimizer.extractRelevantContext(
          relevantFiles,
          phase.task.description,
          { maxLines: Infinity }
        );

        // Decide modelo
        const modelDecision = escalationSystem.analyzeAndDecide({
          taskId: phase.task.taskId,
          taskType: phase.task.type,
          files: phase.task.files,
          estimatedLines: context.metadata.linesExtracted
        }, agent.defaultModel || 'claude-3-5-haiku-20241022');

        console.log(`   Model: ${modelDecision.model.includes('haiku') ? 'Haiku' : modelDecision.model.includes('sonnet-4') ? 'Sonnet 4.5' : 'Sonnet 3.5'}`);
        if (modelDecision.shouldEscalate) {
          console.log(`   Escalation: ${modelDecision.reasons.map(r => r.reason).join(', ')}`);
        }

        // Valida tokens
        const validation = tokenValidator.validate(
          JSON.stringify(context),
          modelDecision.model
        );

        console.log(`   Context: ${validation.tokens.toLocaleString()} tokens (${validation.status.toUpperCase()})`);

        // Verifica se precisa chunkar
        let needsChunking = !validation.valid || validation.status === 'warning';
        let chunkCount = 1;

        if (needsChunking) {
          const chunks = smartChunker.chunkAnalysis(context, {
            maxTokens: validation.safeLimit
          });
          chunkCount = chunks.length;
          console.log(`   ⚠️  Chunking: ${chunkCount} chunks required`);
        } else {
          console.log(`   ✅ Single-shot: No chunking needed`);
        }

        // Estima custo (input + output estimado)
        const inputTokens = validation.tokens;
        const outputTokens = Math.floor(inputTokens * 0.3); // Estimativa: output = 30% do input
        const cost = costTracker.calculateCost(
          modelDecision.model,
          inputTokens,
          outputTokens,
          0
        );

        const phaseCost = cost * chunkCount; // Multiplica por chunks
        totalEstimatedCost += phaseCost;

        console.log(`   💵 Estimated cost: $${phaseCost.toFixed(4)} ${chunkCount > 1 ? `(${chunkCount} chunks × $${cost.toFixed(4)})` : ''}`);
        console.log('');

        phaseEstimates.push({
          phase: phase.name,
          agent: phase.agentKey,
          model: modelDecision.model,
          tokens: validation.tokens,
          chunks: chunkCount,
          cost: phaseCost,
          needsChunking
        });
      }

      const duration = Date.now() - startTime;

      // 4. SUMMARY
      console.log('='.repeat(70));
      console.log('📈 DRY RUN SUMMARY');
      console.log('='.repeat(70));
      console.log(`Total phases: ${plan.phases.length}`);
      console.log(`Phases needing chunking: ${phaseEstimates.filter(p => p.needsChunking).length}`);
      console.log(`Total chunks: ${phaseEstimates.reduce((sum, p) => sum + p.chunks, 0)}`);
      console.log(`Estimated duration: ${(duration / 1000).toFixed(2)}s (analysis only)`);
      console.log('');
      console.log(`💰 ESTIMATED TOTAL COST: $${totalEstimatedCost.toFixed(4)}`);
      console.log('');

      // Breakdown por modelo
      const byModel = {};
      for (const est of phaseEstimates) {
        const modelName = est.model.includes('haiku') ? 'Haiku' :
                          est.model.includes('sonnet-4') ? 'Sonnet 4.5' : 'Sonnet 3.5';
        if (!byModel[modelName]) {
          byModel[modelName] = { phases: 0, cost: 0 };
        }
        byModel[modelName].phases++;
        byModel[modelName].cost += est.cost;
      }

      console.log('By Model:');
      for (const [model, data] of Object.entries(byModel)) {
        console.log(`  ${model}: ${data.phases} phases, $${data.cost.toFixed(4)}`);
      }
      console.log('');

      console.log('⚠️  NOTE: This is an ESTIMATE. Actual costs may vary.');
      console.log('');
      console.log('To execute for real, run without --dry-run flag.');
      console.log('='.repeat(70) + '\n');

      return {
        dryRun: true,
        analysis,
        plan,
        estimates: phaseEstimates,
        totalEstimatedCost,
        duration: duration / 1000
      };
    } catch (error) {
      console.error('❌ DRY RUN ERROR:', error.message);
      console.error(error.stack);

      return {
        dryRun: true,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * PHASE 1: Analisa a requisição do usuário
   */
  async analyzeRequest(userPrompt) {
    const analysisPrompt = `
Você é o MANAGER do MivraTech Team. Analise esta requisição e retorne JSON estruturado.

**AGENTES DISPONÍVEIS (APENAS ESTES):**
- @manager (Sonnet 4.5) - Você mesmo
- @architect (Sonnet 4.5) - Decisões arquiteturais, code review
- @researcher (Sonnet 4.5) - Pesquisa, docs externas
- @qa (Sonnet 4.5) - Testes, qualidade
- @coder-frontend (Haiku→4.5) - Implementa React/UI
- @coder-backend (Haiku→4.5) - Implementa APIs/server
- @coder-database (Haiku→4.5) - SQL, migrations
- @coder-trading (Haiku→4.5) - Estratégias trading
- @docs-writer (Haiku) - Escreve documentação
- @integrator (Sonnet 4.5) - Conecta módulos

**⚠️ IMPORTANTE:** Use APENAS os agentes acima. Não invente nomes como "@backend-specialist" ou "@frontend-expert".

**Requisição:** ${userPrompt}

**Retorne JSON no formato:**
{
  "complexity": "trivial|simple|medium|complex|very-complex",
  "areas": ["frontend", "backend", "trading", "database", "devops"],
  "taskType": "create|modify|delete|analyze|test|refactor|integrate",
  "estimatedTokens": 5000,
  "requiresMultiplePhases": true,
  "suggestedPhases": [
    {
      "name": "Research requirements",
      "agent": "@researcher",
      "priority": 1
    }
  ],
  "criticalFiles": ["bot-live.mjs"],
  "needsElevation": false
}

**Complexidade:**
- trivial: Mudança em 1 arquivo simples (<50 linhas)
- simple: 1-2 arquivos, lógica básica
- medium: 2-3 arquivos, alguma complexidade
- complex: >3 arquivos OU lógica complexa OU múltiplos módulos
- very-complex: Refactor grande OU mudança arquitetural

**Áreas:**
- frontend: React, UI, componentes
- backend: APIs, WebSocket, server
- trading: Bot, estratégias, Avalon API
- database: Schema, migrations, RLS
- devops: Deploy, monitoring, CI/CD

Analise APENAS, não execute nada.
`;

    // 🎡 Visual feedback - Manager está analisando
    const spinner = ora({
      text: 'Manager está analisando a requisição...',
      spinner: 'dots12',
      color: 'cyan'
    }).start();

    // SDK retorna AsyncGenerator, precisamos iterar
    let responseText = '';
    let capturedTokens = { input: 0, output: 0, cached: 0 };

    for await (const message of query({
      prompt: analysisPrompt,
      options: {
        model: 'claude-sonnet-4-20250514', // Manager sempre Sonnet 4.5
        mcpServers: { 'mivratech-mcp': this.mcp },
        permissionMode: 'bypassPermissions'
      }
    })) {
      // Mostra progresso em tempo real
      if (message.type === 'text') {
        spinner.text = `Manager: ${message.text.substring(0, 60)}...`;
      }

      // Captura tokens
      if (message.type === 'usage') {
        capturedTokens.input = message.inputTokens || 0;
        capturedTokens.output = message.outputTokens || 0;
        capturedTokens.cached = message.cacheReadInputTokens || 0;
      }

      // Coleta texto da resposta final
      if (message.type === 'result') {
        responseText = message.result || '';
        // Também tenta capturar do result
        if (message.usage) {
          capturedTokens.input = message.usage.inputTokens || capturedTokens.input;
          capturedTokens.output = message.usage.outputTokens || capturedTokens.output;
          capturedTokens.cached = message.usage.cacheReadInputTokens || capturedTokens.cached;
        }
        spinner.succeed('Manager concluiu a análise');
      }
    }

    if (!responseText) {
      throw new Error('Manager analysis failed: No response from SDK');
    }

    console.log('🔍 DEBUG - Response text (first 500 chars):', responseText.substring(0, 500));

    // Extrai JSON da resposta
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ No JSON found in response!');
      console.error('Full response:', responseText);
      throw new Error('Manager analysis failed: No JSON returned');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // Validação do response
    if (!analysis.complexity) {
      throw new Error('Manager analysis missing complexity field');
    }
    if (!analysis.areas || !Array.isArray(analysis.areas)) {
      console.warn('⚠️ Manager analysis missing areas, defaulting to ["backend", "frontend"]');
      analysis.areas = ['backend', 'frontend'];
    }
    if (!analysis.suggestedPhases || !Array.isArray(analysis.suggestedPhases)) {
      console.warn('⚠️ Manager analysis missing suggestedPhases, creating default');
      analysis.suggestedPhases = [{
        name: 'Execute task',
        agent: '@coder-backend',
        priority: 1
      }];
    }

    // Log cost (usa tokens reais capturados ou fallback)
    costTracker.logUsage(
      '@manager',
      'claude-sonnet-4-20250514',
      'analysis',
      'analyze-request',
      {
        inputTokens: capturedTokens.input || (analysisPrompt.length / 4),
        outputTokens: capturedTokens.output || (responseText.length / 4),
        cachedTokens: capturedTokens.cached || 0
      }
    );

    return analysis;
  }

  /**
   * PHASE 2: Cria plano de execução com fases
   */
  async createExecutionPlan(analysis, userPrompt) {
    const { complexity, requiresMultiplePhases, suggestedPhases } = analysis;

    // Se trivial, execução direta
    if (complexity === 'trivial' && !requiresMultiplePhases) {
      return {
        strategy: 'direct',
        phases: suggestedPhases.map((p, idx) => ({
          phaseId: `phase-${idx}`,
          name: p.name,
          agentKey: p.agent,
          task: agentComms.createTask(p.name, userPrompt, {
            type: analysis.taskType,
            files: analysis.criticalFiles || [],
            priority: p.priority || 3
          }),
          dependencies: [],
          status: 'pending'
        }))
      };
    }

    // Se complexo, cria DAG de dependências
    const phases = [];

    for (let i = 0; i < suggestedPhases.length; i++) {
      const suggested = suggestedPhases[i];

      // Dependências: fase depende das anteriores se priority sequencial
      const deps = i > 0 && suggested.priority > suggestedPhases[i - 1].priority
        ? [phases[i - 1].phaseId]
        : [];

      phases.push({
        phaseId: `phase-${i}`,
        name: suggested.name,
        agentKey: suggested.agent,
        task: agentComms.createTask(suggested.name, userPrompt, {
          type: analysis.taskType,
          files: analysis.criticalFiles || [],
          priority: suggested.priority || 3,
          dependencies: deps
        }),
        dependencies: deps,
        status: 'pending'
      });
    }

    return {
      strategy: 'phased',
      phases
    };
  }

  /**
   * PHASE 3: Executa plano fase por fase
   */
  async executePlan(plan) {
    const results = {
      total: plan.phases.length,
      completed: 0,
      failed: 0,
      phases: []
    };

    // Executa fases em ordem resolvendo dependências
    while (results.completed + results.failed < results.total) {
      // Pega próximas fases executáveis (sem deps pendentes)
      const executablePhases = plan.phases.filter(phase =>
        phase.status === 'pending' &&
        phase.dependencies.every(depId =>
          plan.phases.find(p => p.phaseId === depId)?.status === 'completed'
        )
      );

      if (executablePhases.length === 0) {
        // Deadlock ou todas concluídas
        const pending = plan.phases.filter(p => p.status === 'pending');
        if (pending.length > 0) {
          console.error(`⚠️ DEADLOCK: ${pending.length} fases pendentes com deps não resolvidas`);
          results.failed += pending.length;
        }
        break;
      }

      // Executa em paralelo (se possível)
      console.log(`🔄 Executing ${executablePhases.length} phases in parallel...`);

      const phaseResults = await Promise.all(
        executablePhases.map(phase => this.executePhase(phase))
      );

      // Atualiza status
      phaseResults.forEach((result, idx) => {
        const phase = executablePhases[idx];
        phase.status = result.success ? 'completed' : 'failed';

        if (result.success) {
          results.completed++;
        } else {
          results.failed++;
        }

        const phaseResult = {
          phaseId: phase.phaseId,
          name: phase.name,
          agent: phase.agentKey,
          success: result.success,
          result: result.data
        };

        results.phases.push(phaseResult);

        // 💾 Save checkpoint após cada fase
        const phaseIndex = plan.phases.findIndex(p => p.phaseId === phase.phaseId);
        checkpointManager.savePhaseCheckpoint(
          phase.phaseId,
          phaseResult,
          results.completed + results.failed,
          results.total
        );
      });
    }

    return results;
  }

  /**
   * Executa uma fase individual
   */
  async executePhase(phase) {
    console.log(`\n▶️  [${phase.phaseId}] ${phase.name} (@${phase.agentKey.replace('@', '')})`);

    phase.status = 'in_progress';
    this.activePhases.set(phase.phaseId, phase);

    // 📝 Create subtask for this phase in agent memory
    const phaseTaskId = agentMemory.generateTaskId(phase.agentKey, phase.phaseId);

    // 🎡 Spinner para esta fase
    const phaseSpinner = ora({
      text: `${phase.agentKey} está preparando...`,
      spinner: 'dots',
      color: 'yellow'
    }).start();

    try {
      // Create phase task record
      await agentMemory.createTask({
        agent: phase.agentKey,
        sessionId: this.sessionId,
        taskId: phaseTaskId,
        taskDescription: phase.name,
        context: {
          phaseId: phase.phaseId,
          mainTaskId: this.currentMainTaskId,
          dependencies: phase.dependencies
        },
        dependencies: phase.dependencies.map(depId => `${depId}-task`)
      });

      await agentMemory.updateTaskStatus(phaseTaskId, 'in_progress');

      const agent = SUBAGENTS[phase.agentKey.replace('@', '')];
      if (!agent) {
        phaseSpinner.fail(`Agent not found: ${phase.agentKey}`);
        throw new Error(`Agent not found: ${phase.agentKey}`);
      }

      // Decide modelo (Haiku ou Sonnet)
      const modelDecision = escalationSystem.analyzeAndDecide({
        taskId: phase.task.taskId,
        taskType: phase.task.type,
        files: phase.task.files,
        estimatedLines: phase.task.context.estimatedLines || 0
      }, agent.defaultModel || 'claude-3-5-haiku-20241022');

      if (modelDecision.shouldEscalate) {
        phaseSpinner.info(`Escalated to Sonnet (${modelDecision.reasons.map(r => r.reason).join(', ')})`);
        phaseSpinner.start(`${phase.agentKey} executando com Sonnet 4.5...`);
      } else {
        phaseSpinner.text = `${phase.agentKey} executando com ${modelDecision.model.includes('haiku') ? 'Haiku' : 'Sonnet'}...`;
      }

      // Prepara contexto otimizado
      // 🎯 CORREÇÃO: Cada agente recebe APENAS seus arquivos relevantes
      phaseSpinner.text = `${phase.agentKey} carregando contexto...`;
      const relevantFiles = areaFileMapper.getFilesForAgent(phase.agentKey);
      const context = await contextOptimizer.extractRelevantContext(
        relevantFiles,
        phase.task.description,
        { maxLines: Infinity } // Sem limites de linhas, mas arquivos específicos
      );

      // 🛡️ VALIDAÇÃO DE TOKENS - Previne crashes por overflow
      phaseSpinner.text = `${phase.agentKey} validando contexto...`;
      const validation = tokenValidator.validateAndReport(
        JSON.stringify(context),
        modelDecision.model,
        phase.agentKey
      );

      // Se contexto excede limite, precisa chunkar
      if (!validation.valid || validation.status === 'warning') {
        phaseSpinner.warn(`⚠️ Contexto muito grande (${validation.tokens.toLocaleString()} tokens), dividindo em chunks...`);

        // Usa smart chunker para dividir inteligentemente
        const chunks = smartChunker.chunkAnalysis(context, {
          maxTokens: validation.safeLimit,
          preserveContext: true
        });

        phaseSpinner.info(`📦 Dividido em ${chunks.length} chunks, processando sequencialmente...`);

        // Processa cada chunk e acumula respostas
        let combinedResponse = '';
        let totalInputTokens = 0;
        let totalOutputTokens = 0;
        let totalCachedTokens = 0;

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const chunkSpinner = ora({
            text: `${phase.agentKey} processando chunk ${i + 1}/${chunks.length} (${chunk.metadata.description})...`,
            spinner: 'dots',
            color: 'cyan'
          }).start();

          // Cria prompt para este chunk
          const chunkPrompt = `
**Chunk ${i + 1}/${chunks.length}**: ${chunk.metadata.description}

${chunk.contextSummary ? `**Contexto anterior:** ${chunk.contextSummary.summary}\n\n` : ''}

**Tarefa:** ${phase.task.description}

**Contexto deste chunk:**
${JSON.stringify(chunk.content, null, 2)}

${i < chunks.length - 1 ? '\n**IMPORTANTE:** Este é um chunk parcial. Analise este pedaço e aguarde os próximos chunks para análise completa.' : '\n**IMPORTANTE:** Este é o último chunk. Consolide todas as informações dos chunks anteriores.'}
`;

          // Executa SDK para este chunk
          let chunkResponse = '';
          let chunkTokens = { input: 0, output: 0, cached: 0 };

          for await (const message of query({
            prompt: chunkPrompt,
            options: {
              system: agent.system,
              model: modelDecision.model,
              mcpServers: { 'mivratech-mcp': this.mcp },
              allowedTools: agent.allowTools,
              permissionMode: 'bypassPermissions'
            }
          })) {
            if (message.type === 'text') {
              chunkSpinner.text = `${phase.agentKey} chunk ${i + 1}/${chunks.length}: ${message.text.substring(0, 40)}...`;
            }

            if (message.type === 'usage') {
              chunkTokens.input = message.inputTokens || 0;
              chunkTokens.output = message.outputTokens || 0;
              chunkTokens.cached = message.cacheReadInputTokens || 0;
            }

            if (message.type === 'result') {
              chunkResponse = message.result || '';
              if (message.usage) {
                chunkTokens.input = message.usage.inputTokens || chunkTokens.input;
                chunkTokens.output = message.usage.outputTokens || chunkTokens.output;
                chunkTokens.cached = message.usage.cacheReadInputTokens || chunkTokens.cached;
              }
            }
          }

          totalInputTokens += chunkTokens.input;
          totalOutputTokens += chunkTokens.output;
          totalCachedTokens += chunkTokens.cached;

          combinedResponse += `\n\n--- Chunk ${i + 1} Analysis ---\n${chunkResponse}`;

          chunkSpinner.succeed(`Chunk ${i + 1}/${chunks.length} concluído (${chunkTokens.output} tokens)`);

          // Log cost deste chunk
          costTracker.logUsage(
            phase.agentKey,
            modelDecision.model,
            `${phase.task.taskId}-chunk-${i}`,
            `${phase.task.type}-chunked`,
            {
              inputTokens: chunkTokens.input,
              outputTokens: chunkTokens.output,
              cachedTokens: chunkTokens.cached
            }
          );
        }

        // Registra custo total de todos os chunks
        phaseSpinner.succeed(`${phase.agentKey} completou ${chunks.length} chunks (${totalOutputTokens} tokens total)`);

        // Registra tentativa de Haiku (se aplicável)
        if (modelDecision.model.includes('haiku')) {
          escalationSystem.registerHaikuAttempt(phase.task.taskId, true);
        }

        // Report consolidado de volta ao manager
        agentComms.reportTaskCompletion(phase.agentKey, '@manager', {
          taskId: phase.task.taskId,
          status: 'success',
          result: { response: combinedResponse },
          filesModified: phase.task.files,
          metrics: {
            model: modelDecision.model,
            tokens: totalInputTokens + totalOutputTokens,
            chunks: chunks.length,
            chunked: true
          }
        });

        // ✅ Complete phase subtask
        await agentMemory.completeTask(
          phaseTaskId,
          {
            model: modelDecision.model,
            tokens: totalInputTokens + totalOutputTokens,
            filesModified: phase.task.files,
            chunked: true,
            chunkCount: chunks.length
          },
          `Phase completed in ${chunks.length} chunks with ${modelDecision.model}`
        );

        phaseSpinner.succeed(`${phase.agentKey} completou: ${phase.name} (${chunks.length} chunks)`);

        return {
          success: true,
          data: combinedResponse
        };
      }

      // ✅ Contexto seguro, execução normal (single-shot)
      phaseSpinner.succeed(`✅ Contexto validado: ${validation.tokens.toLocaleString()} tokens (seguro)`);

      // Delega para agente
      const message = agentComms.delegateTask('@manager', phase.agentKey, {
        ...phase.task,
        context
      });

      // Executa via SDK (AsyncGenerator)
      phaseSpinner.text = `${phase.agentKey} processando tarefa...`;
      let responseText = '';
      let lastUpdate = Date.now();
      let capturedTokens = { input: 0, output: 0, cached: 0 };

      for await (const message of query({
        prompt: phase.task.description,
        options: {
          system: agent.system,
          model: modelDecision.model,
          mcpServers: { 'mivratech-mcp': this.mcp },
          allowedTools: agent.allowTools,
          permissionMode: 'bypassPermissions'
        }
      })) {
        // Mostra progresso em tempo real
        if (message.type === 'text') {
          const elapsed = ((Date.now() - lastUpdate) / 1000).toFixed(1);
          phaseSpinner.text = `${phase.agentKey}: ${message.text.substring(0, 50)}... (${elapsed}s)`;
        }

        if (message.type === 'tool_use') {
          phaseSpinner.text = `${phase.agentKey} usando tool: ${message.name}`;
        }

        // Captura tokens do usage
        if (message.type === 'usage') {
          capturedTokens.input = message.inputTokens || 0;
          capturedTokens.output = message.outputTokens || 0;
          capturedTokens.cached = message.cacheReadInputTokens || 0;
        }

        // Coleta texto da resposta final
        if (message.type === 'result') {
          responseText = message.result || '';
          // Também tenta capturar tokens do result se disponível
          if (message.usage) {
            capturedTokens.input = message.usage.inputTokens || capturedTokens.input;
            capturedTokens.output = message.usage.outputTokens || capturedTokens.output;
            capturedTokens.cached = message.usage.cacheReadInputTokens || capturedTokens.cached;
          }
        }
      }

      if (!responseText) {
        throw new Error(`Phase ${phase.phaseId} failed: No response from SDK`);
      }

      // Registra custo (usa tokens capturados ou fallback para estimativa)
      costTracker.logUsage(
        phase.agentKey,
        modelDecision.model,
        phase.task.taskId,
        phase.task.type,
        {
          inputTokens: capturedTokens.input || context.estimatedTokens,
          outputTokens: capturedTokens.output || (responseText.length / 4),
          cachedTokens: capturedTokens.cached || 0
        }
      );

      // Registra tentativa de Haiku
      if (modelDecision.model.includes('haiku')) {
        escalationSystem.registerHaikuAttempt(phase.task.taskId, true);
      }

      // Report de volta ao manager
      agentComms.reportTaskCompletion(phase.agentKey, '@manager', {
        taskId: phase.task.taskId,
        status: 'success',
        result: { response: responseText },
        filesModified: phase.task.files,
        metrics: {
          model: modelDecision.model,
          tokens: context.estimatedTokens
        }
      });

      // ✅ Complete phase subtask
      await agentMemory.completeTask(
        phaseTaskId,
        {
          model: modelDecision.model,
          tokens: context.estimatedTokens,
          filesModified: phase.task.files
        },
        `Phase completed successfully with ${modelDecision.model}`
      );

      phaseSpinner.succeed(`${phase.agentKey} completou: ${phase.name}`);

      return {
        success: true,
        data: responseText
      };
    } catch (error) {
      // Melhora mensagem de erro para erros de JSON parsing
      let errorMessage = error.message;
      if (errorMessage.includes('JSON') || errorMessage.includes('Unexpected token')) {
        errorMessage = `Erro de parsing: O agente ou uma tool retornou formato inválido. ${errorMessage}`;
        console.error(`\n⚠️ DICA: Esse erro geralmente indica que:`);
        console.error(`   1. Uma MCP tool retornou formato inválido`);
        console.error(`   2. O agente tentou usar uma tool que não existe`);
        console.error(`   3. Parâmetros inválidos foram passados para uma tool\n`);
      }

      phaseSpinner.fail(`${phase.agentKey} falhou: ${errorMessage}`);

      // ❌ Fail phase subtask
      await agentMemory.failTask(
        phaseTaskId,
        errorMessage,
        {
          phaseId: phase.phaseId,
          agent: phase.agentKey,
          fullError: error.stack
        }
      );

      // Se foi Haiku, registra falha
      const agent = SUBAGENTS[phase.agentKey.replace('@', '')];
      if (agent?.defaultModel?.includes('haiku')) {
        escalationSystem.registerHaikuAttempt(phase.task.taskId, false);

        // Tenta escalar
        const shouldRetry = (escalationSystem.haikuAttempts.get(phase.task.taskId) || 0) < 2;
        if (shouldRetry) {
          phaseSpinner.info(`Tentando novamente com Sonnet...`);
          // TODO: Implementar retry com Sonnet
        }
      }

      return {
        success: false,
        error: error.message
      };
    } finally {
      this.activePhases.delete(phase.phaseId);
      this.completedPhases.push(phase);
    }
  }

  /**
   * PHASE 4: Consolida resultados de todas as fases
   */
  async consolidateResults(results, analysis) {
    const successful = results.phases.filter(p => p.success);
    const failed = results.phases.filter(p => !p.success);

    const report = {
      success: failed.length === 0,
      summary: {
        total: results.total,
        completed: results.completed,
        failed: results.failed
      },
      phases: results.phases,
      analysis,
      timestamp: new Date().toISOString()
    };

    if (failed.length > 0) {
      report.failedPhases = failed.map(p => ({
        phase: p.name,
        agent: p.agent,
        error: p.result?.error || 'Unknown error'
      }));
    }

    return report;
  }

  /**
   * PHASE 5: Atualiza knowledge base do projeto
   */
  async updateProjectKnowledge(areas, results) {
    // Carrega docs "mãe" do Notion para cada área afetada
    for (const area of areas) {
      try {
        const docPath = this.getKnowledgeDocPath(area);

        if (existsSync(docPath)) {
          const content = readFileSync(docPath, 'utf-8');
          this.projectKnowledge.set(area, {
            content,
            lastUpdate: Date.now()
          });
          console.log(`   📚 Loaded knowledge for ${area}`);
        } else {
          console.warn(`   ⚠️ Knowledge doc not found: ${area} (${docPath})`);
        }
      } catch (error) {
        console.error(`   ❌ Failed to load knowledge for ${area}:`, error.message);
      }
    }

    this.lastKnowledgeUpdate = Date.now();
  }

  /**
   * Obtém path do documento "mãe" de uma área
   */
  getKnowledgeDocPath(area) {
    const docs = {
      'frontend': 'FRONTEND_GUIDE.md',
      'backend': 'BACKEND_GUIDE.md',
      'trading': 'TRADING_GUIDE.md',
      'database': 'DATABASE_SCHEMA.md',
      'devops': 'DEVOPS_GUIDE.md'
    };

    return join(this.projectRoot || process.cwd(), docs[area] || 'PROJECT_OVERVIEW.md');
  }

  /**
   * Obtém contexto de uma área específica
   */
  getProjectContext(area) {
    const knowledge = this.projectKnowledge.get(area);

    if (!knowledge) {
      return {
        available: false,
        message: `No knowledge available for ${area}`
      };
    }

    // Verifica se está desatualizado (>1h)
    const age = Date.now() - knowledge.lastUpdate;
    const isStale = age > 3600000;

    return {
      available: true,
      content: knowledge.content,
      lastUpdate: knowledge.lastUpdate,
      isStale,
      age
    };
  }

  /**
   * Limpa cache de knowledge
   */
  clearKnowledgeCache() {
    this.projectKnowledge.clear();
    this.lastKnowledgeUpdate = null;
    console.log('🧹 Project knowledge cache cleared');
  }

  /**
   * Estatísticas do manager
   */
  getStats() {
    return {
      knowledgeAreas: this.projectKnowledge.size,
      lastKnowledgeUpdate: this.lastKnowledgeUpdate,
      activePhasesCount: this.activePhases.size,
      completedPhasesCount: this.completedPhases.length,
      communication: agentComms.getStats(),
      costs: costTracker.getSessionStats(),
      escalations: escalationSystem.getStats()
    };
  }
}
