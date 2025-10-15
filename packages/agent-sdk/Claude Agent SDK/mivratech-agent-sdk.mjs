// mivratech-agent-sdk.mjs
import 'dotenv/config';
import { query } from '@anthropic-ai/claude-agent-sdk';
import readline from 'readline';
import { SUBAGENTS, detectAgent } from './agents.config.mjs';
import { startMcpServer } from './mcp.server.zod.complete.mjs';
import { ManagerOrchestrator } from './manager-orchestrator.mjs';

// Credencial
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ Defina ANTHROPIC_API_KEY no .env/ambiente');
  process.exit(1);
}

console.log('🚀 MivraTech Agent SDK v4.0 - 3-Tier Team (15 agents)');
console.log('📦 46 tools: 21 core + 10 Avalon + 9 DevTools + 3 Sentry + 3 Notion');
console.log('');
console.log('🎯 TIER 1 - Orchestrator: @manager');
console.log('👔 TIER 2 - Seniors: @architect | @researcher | @qa');
console.log('💼 TIER 3 - Executors: @coder-frontend | @coder-backend | @coder-database | @coder-trading | @docs-writer | @integrator');
console.log('');
console.log('Comandos: /exit, /clear, /elevate on, /elevate off\n');

// Diretório de trabalho do mivratec
const PROJECT_DIR = 'I:\\Microsoft VS Code\\mivratec-monorepo';

// Set working directory in env for MCP server
process.env.PROJECT_PATH = PROJECT_DIR;

// ✅ Create MCP Server (SDK-type with Zod schemas) - ASYNC!
console.log('⏳ Carregando MCP Server completo...\n');
const MCP = await startMcpServer();

console.log(`📂 Working directory: ${PROJECT_DIR}`);
console.log(`✅ MCP Server v4.0: SDK-type (in-process, Zod schemas)`);
console.log(`   All 46 tools loaded successfully! 🎉\n`);

// ✅ Create Manager Orchestrator
// Parse --dry-run flag from CLI arguments
const isDryRun = process.argv.includes('--dry-run');
console.log(`⏳ Inicializando Manager Orchestrator${isDryRun ? ' (DRY RUN MODE)' : ''}...`);
const managerOrchestrator = new ManagerOrchestrator(MCP, { dryRun: isDryRun });
console.log(`✅ Manager Orchestrator pronto${isDryRun ? ' para simulação' : ''}!\n`);


// Estado global
let conversationHistory = [];
let elevated = false;
let currentSubagent = null;

// Conjuntos Avalon (com prefixo MCP correto)
const AVALON_PRIVILEGED = new Set([
  'mcp__mivratech-mcp__avalon_session_create',
  'mcp__mivratech-mcp__avalon_account_switch',
  'mcp__mivratech-mcp__avalon_order_create',
  'mcp__mivratech-mcp__avalon_order_cancel',
  'mcp__mivratech-mcp__avalon_logout'
]);

// Interface readline
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> '
});

// Função para processar comando
async function processCommand(userInput) {
  const trimmed = userInput.trim();
  
  // Comandos especiais
  if (trimmed === '/exit') {
    console.log('\n👋 Até logo!');
    process.exit(0);
  }
  
if (trimmed === '/reset') {
  currentSubagent = null;
  console.log('\n🔄 Voltou para o orchestrador (histórico mantido)\n');
  return; // ✅ Removido rl.prompt() - será chamado no listener
}

  if (trimmed === '/clear') {
    conversationHistory = [];
    currentSubagent = null;
    console.log('\n🧹 Histórico limpo\n');
    return; // ✅ Removido rl.prompt()
  }

  if (trimmed === '/elevate on') {
    elevated = true;
    console.log('\n⚡ Modo elevado ATIVADO (tools privilegiadas habilitadas)\n');
    return; // ✅ Removido rl.prompt()
  }

  if (trimmed === '/elevate off') {
    elevated = false;
    console.log('\n🔒 Modo elevado DESATIVADO\n');
    return; // ✅ Removido rl.prompt()
  }

  if (!trimmed) {
    return; // ✅ Removido rl.prompt() - linha vazia, apenas retorna
  }

  // Detecta subagent
  const { agentKey, cleanMessage } = detectAgent(trimmed);
  const subagent = agentKey ? SUBAGENTS[agentKey] : null;

  // ✅ MANAGER ORCHESTRATOR - Fluxo especial
  if (agentKey === 'manager') {
    try {
      const report = await managerOrchestrator.handleUserRequest(cleanMessage);

      // Adiciona ao histórico
      conversationHistory.push({
        role: 'user',
        content: trimmed
      });

      conversationHistory.push({
        role: 'assistant',
        content: `[Manager] ${JSON.stringify(report, null, 2)}`
      });

      console.log('\n✅ Manager orchestrator concluído!');
    } catch (error) {
      console.error('\n❌ Erro no Manager Orchestrator:', error.message);
      console.error(error.stack);
    }

    // ✅ CORREÇÃO: Garante que o prompt volte SEMPRE
    setImmediate(() => {
      rl.prompt();
    });
    return;
  }

  // Atualiza subagent atual
  if (subagent) {
    currentSubagent = subagent;
  }

  // System prompt
  let systemPrompt = subagent?.system ||
    'Você é um assistente de desenvolvimento do MivraTech. Use as tools disponíveis para ajudar com tarefas de desenvolvimento.';

  // Adiciona contexto do histórico
  if (currentSubagent && conversationHistory.length > 0) {
    systemPrompt += `\n\n📝 IMPORTANTE: Você está continuando uma conversa como "${currentSubagent.title}". MANTENHA O CONTEXTO das mensagens anteriores.`;
  }

  // Allowed tools (filtra privilegiadas se não estiver elevated)
  const allowedTools = subagent?.allowTools;
  const finalAllowedTools = allowedTools
    ? allowedTools.filter(toolName => {
        // Se não está elevated, bloqueia tools privilegiadas
        if (!elevated && AVALON_PRIVILEGED.has(toolName)) {
          console.log(`[FILTER] Bloqueando tool privilegiada: ${toolName} (use /elevate on)`);
          return false;
        }
        return true;
      })
    : undefined; // undefined = todas as tools disponíveis

  try {
    // ═══════════════════════════════════════════════════════
    // 🚀 INÍCIO DO PROCESSAMENTO
    // ═══════════════════════════════════════════════════════
    const startTime = Date.now();
    const agentName = currentSubagent ? currentSubagent.title : 'Orchestrador';

    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log(`║ 🤖 AGENT: ${agentName.padEnd(46)} ║`);
    console.log(`║ ⏰ INÍCIO: ${new Date().toLocaleTimeString('pt-BR').padEnd(44)} ║`);
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    let assistantResponse = '';
    const toolsUsed = [];
    let currentTurn = 0;
    let isThinking = false;
    let thinkingDots = 0;

    // Indicador de "pensando" animado
    const thinkingInterval = setInterval(() => {
      if (isThinking) {
        thinkingDots = (thinkingDots + 1) % 4;
        const dots = '.'.repeat(thinkingDots);
        process.stdout.write(`\r💭 Pensando${dots}   `);
      }
    }, 500);

 // ═══════════════════════════════════════════════════════
    // 🔍 DEBUG - ADICIONE AQUI (LINHA 154)
    // ═══════════════════════════════════════════════════════
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║ 🔍 DEBUG - Configuração do Query                         ║');
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log(`║ Subagent: ${(agentKey || 'Orchestrador').padEnd(44)} ║`);
    console.log(`║ AllowedTools: ${(finalAllowedTools ? finalAllowedTools.length + ' tools' : 'TODAS').padEnd(37)} ║`);
    if (finalAllowedTools && finalAllowedTools.length > 0) {
      console.log(`║ Tools: ${finalAllowedTools.slice(0, 3).join(', ').substring(0, 46).padEnd(49)} ║`);
    }
    console.log(`║ PermissionMode: ${(elevated ? 'bypassPermissions' : 'acceptEdits').padEnd(38)} ║`);
    console.log(`║ MCP Server: SDK (Zod) ✅`.padEnd(60) + '║');
    console.log(`║ Elevated: ${(elevated ? 'SIM ⚡' : 'NÃO 🔒').padEnd(46)} ║`);
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    // ✅ Query with SDK-type MCP server (Zod schemas)
for await (const message of query({
  prompt: cleanMessage,
  options: {
    system: systemPrompt,
    messages: conversationHistory,
    mcpServers: {
      "mivratech-mcp": MCP  // ✅ SDK server with Zod schemas
    },
    allowedTools: finalAllowedTools,  // ✅ Use filtered tools list
    permissionMode: 'bypassPermissions',  // ✅ ALWAYS bypass for automated execution
    model: 'claude-sonnet-4-20250514',
    maxTurns: 20
  }
}))
 {

  // 🔄 Log de novo turno
  if (message.type === 'turn') {
    currentTurn++;
    clearInterval(thinkingInterval);
    console.log(`\n╭─────────────────────────────────────────────────╮`);
    console.log(`│ 🔄 TURNO ${currentTurn}/20                                 │`);
    console.log(`╰─────────────────────────────────────────────────╯`);
    isThinking = true;
  }

  // 💭 Log quando está pensando (texto parcial)
  if (message.type === 'text') {
    if (isThinking) {
      clearInterval(thinkingInterval);
      process.stdout.write('\r💭 Pensando... Concluído!\n');
      isThinking = false;
    }
  }

  // 🔧 Log detalhado de tool usage
  if (message.type === 'tooluse') {
    if (isThinking) {
      clearInterval(thinkingInterval);
      process.stdout.write('\r' + ' '.repeat(30) + '\r'); // Limpa linha
      isThinking = false;
    }

    toolsUsed.push(message.name);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`\n┌─────────────────────────────────────────────────┐`);
    console.log(`│ 🔧 EXECUTANDO TOOL                              │`);
    console.log(`├─────────────────────────────────────────────────┤`);
    console.log(`│ Nome: ${message.name.padEnd(42)} │`);
    console.log(`│ Tempo decorrido: ${elapsed}s`.padEnd(50) + '│');

    // Mostra parâmetros se forem pequenos
    if (message.input) {
      const inputStr = JSON.stringify(message.input, null, 2);
      if (inputStr.length < 200) {
        console.log(`├─────────────────────────────────────────────────┤`);
        console.log(`│ Parâmetros:                                     │`);
        inputStr.split('\n').forEach(line => {
          if (line.length > 43) line = line.substring(0, 40) + '...';
          console.log(`│   ${line.padEnd(45)} │`);
        });
      }
    }
    console.log(`└─────────────────────────────────────────────────┘`);

    // Animação de "executando"
    let execDots = 0;
    const execInterval = setInterval(() => {
      execDots = (execDots + 1) % 4;
      const dots = '.'.repeat(execDots);
      process.stdout.write(`\r⚡ Executando${dots}   `);
    }, 300);

    // Armazena o interval para limpar depois
    message._execInterval = execInterval;
  }

  // ✅ Log quando a tool termina
  if (message.type === 'toolresult') {
    // Limpa animação
    if (message._execInterval) {
      clearInterval(message._execInterval);
    }
    process.stdout.write('\r' + ' '.repeat(30) + '\r');

    const status = message.isError ? '❌' : '✅';
    const statusText = message.isError ? 'ERRO' : 'CONCLUÍDO';

    console.log(`${status} ${statusText}: ${message.name}`);

    // Mostra resultado se for pequeno
    if (message.content && !message.isError) {
      const resultStr = typeof message.content === 'string'
        ? message.content
        : JSON.stringify(message.content);

      if (resultStr.length < 150) {
        console.log(`   └─> Resultado: ${resultStr.substring(0, 100)}${resultStr.length > 100 ? '...' : ''}`);
      } else {
        console.log(`   └─> Resultado: [${resultStr.length} caracteres]`);
      }
    }

    if (message.isError) {
      console.log(`   └─> Erro: ${message.error || 'Erro desconhecido'}`);
    }
  }

  // 📤 Resultado final
  if (message.type === 'result') {
    clearInterval(thinkingInterval);
    isThinking = false;

    assistantResponse = message.result || '';
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║ 📤 RESPOSTA FINAL                                         ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    if (assistantResponse) {
      console.log(assistantResponse);
    } else {
      console.log('(sem resposta de texto)');
    }

    // Atualiza histórico
    conversationHistory.push({
      role: 'user',
      content: trimmed
    });

    if (assistantResponse) {
      const agentTag = currentSubagent ? `[${currentSubagent.title}] ` : '';
      conversationHistory.push({
        role: 'assistant',
        content: `${agentTag}${assistantResponse}`
      });
    }

    // ═══════════════════════════════════════════════════════
    // 📊 ESTATÍSTICAS FINAIS
    // ═══════════════════════════════════════════════════════
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║ 📊 ESTATÍSTICAS                                           ║');
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log(`║ ⏱️  Tempo total: ${elapsed}s`.padEnd(60) + '║');
    console.log(`║ 🔄 Turnos: ${currentTurn}`.padEnd(60) + '║');
    console.log(`║ 🔧 Tools executadas: ${toolsUsed.length}`.padEnd(60) + '║');
    if (toolsUsed.length > 0) {
      console.log(`║ 📝 Tools: ${toolsUsed.slice(0, 2).join(', ')}${toolsUsed.length > 2 ? '...' : ''}`.padEnd(60) + '║');
    }
    console.log(`║ 💬 Mensagens no histórico: ${conversationHistory.length}`.padEnd(60) + '║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
  }
}

    console.log(''); // Linha em branco final
  } catch (error) {
    // Limpa todos os intervalos em caso de erro
    if (typeof thinkingInterval !== 'undefined') {
      clearInterval(thinkingInterval);
    }

    console.error('\n╔═══════════════════════════════════════════════════════════╗');
    console.error('║ ❌ ERRO CRÍTICO                                           ║');
    console.error('╚═══════════════════════════════════════════════════════════╝\n');
    console.error('Mensagem:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    console.error('\n');
  }

  // ✅ CORREÇÃO ROBUSTA: Garante que o prompt volte SEMPRE
  // setImmediate garante que o prompt é mostrado após todas as operações assíncronas
  setImmediate(() => {
    console.log('✅ Pronto para novo comando!\n');
    rl.prompt();
  });
}

// Event listeners
rl.on('line', async (line) => {
  // ✅ CORREÇÃO: Processa comando de forma assíncrona e aguarda conclusão
  try {
    await processCommand(line);
  } catch (error) {
    console.error('❌ Erro ao processar comando:', error.message);
    // Garante que o prompt volte mesmo em caso de erro
    setImmediate(() => {
      rl.prompt();
    });
  }
});

rl.on('close', () => {
  console.log('\n👋 Até logo!');
  process.exit(0);
});

// Inicia o prompt
console.log('\n🎯 Digite um comando ou @agente <mensagem> para começar!\n');
rl.prompt();
