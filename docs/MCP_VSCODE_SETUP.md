# MCPs Configurados no VS Code - MivraTech

## ✅ Status: Configurado

Todos os 9 MCPs foram configurados para uso no VS Code (Claude Code).

## Arquivos Criados

### 1. `.mcp.json` (Raiz do projeto)
Configuração automática de MCPs detectada pelo Claude Code.

### 2. `.vscode/settings.json`
Configuração específica do workspace com:
- `claudeCode.mcpServers`: Todos os 9 MCPs configurados
- `claudeCode.mcpAutoStart`: true (inicia automaticamente)
- `claudeCode.mcpEnabled`: true (habilitado)

## MCPs Disponíveis no VS Code

### 1. Supabase (PostgreSQL) ✅
**Comando**: `@modelcontextprotocol/server-postgres`
**Uso no Claude Code**:
```
Liste todas as tabelas do banco de dados
```

### 2. GitHub ✅
**Comando**: `@modelcontextprotocol/server-github`
**Uso no Claude Code**:
```
Crie uma issue no GitHub sobre o bug X
```

### 3. Git ✅
**Comando**: `@modelcontextprotocol/server-git`
**Uso no Claude Code**:
```
Mostre o git status do projeto
```

### 4. Filesystem ✅
**Comando**: `@modelcontextprotocol/server-filesystem`
**Uso no Claude Code**:
```
Leia o arquivo api-server.mjs e explique sua estrutura
```

### 5. Notion ✅
**Comando**: `@notionhq/client`
**Uso no Claude Code**:
```
Busque informações sobre trading na base de conhecimento do Notion
```

### 6. Playwright ✅
**Comando**: `@playwright/mcp`
**Uso no Claude Code**:
```
Acesse o site da Avalon e extraia a lista de ativos disponíveis
```

### 7. Web Search (Brave) ✅
**Comando**: `@modelcontextprotocol/server-brave-search`
**Uso no Claude Code**:
```
Busque as últimas notícias sobre regulamentação de trading bots
```

### 8. ShadCN UI ✅
**Comando**: `shadcn@latest mcp`
**Uso no Claude Code**:
```
Adicione um componente Button do ShadCN ao frontend
```

### 9. Magic MCP (21st.dev) ✅
**Comando**: `@21st-dev/magic`
**Uso no Claude Code**:
```
Use o Magic MCP para otimizar a performance do bot-live.mjs
```

## Como Usar

### Método 1: Comandos Naturais
Simplesmente converse com o Claude Code normalmente. Os MCPs serão invocados automaticamente quando necessário.

**Exemplo**:
```
Usuário: Liste todas as tabelas do Supabase
Claude: [Invoca automaticamente o MCP Supabase]
```

### Método 2: Invocação Explícita
Mencione explicitamente qual MCP usar:

**Exemplo**:
```
Usuário: Use o GitHub MCP para criar uma issue
Claude: [Usa especificamente o MCP GitHub]
```

## Recarregar MCPs

Se fizer mudanças na configuração:

1. **Command Palette** (Ctrl+Shift+P / Cmd+Shift+P)
2. Digite: `Developer: Reload Window`
3. Ou feche e abra o VS Code novamente

## Verificar MCPs Carregados

Para verificar se os MCPs estão funcionando:

1. Abra o **Output Panel** (Ctrl+Shift+U)
2. Selecione **Claude Code** no dropdown
3. Procure por linhas como: `MCP server 'supabase' started`

Ou simplesmente pergunte:
```
Quais MCPs estão disponíveis?
```

## Troubleshooting

### MCPs não aparecem
1. Verifique se `.mcp.json` existe na raiz do projeto
2. Verifique se `.vscode/settings.json` tem as configurações corretas
3. Recarregue o VS Code (Developer: Reload Window)

### Erro ao invocar MCP
1. Verifique as credenciais no arquivo (GitHub token, Notion API, etc)
2. Verifique se `npx` está funcionando: `npx --version`
3. Teste o MCP manualmente: `npx @modelcontextprotocol/server-github --help`

### MCP específico não funciona
Verifique os logs:
1. Output Panel → Claude Code
2. Procure por erros relacionados ao MCP específico

## Exemplos Práticos

### Análise de Código com Filesystem + Magic
```
Use o Filesystem MCP para ler bot-live.mjs e depois use o Magic MCP para sugerir otimizações
```

### Query Database + GitHub Issue
```
Liste todos os trades com resultado LOSS da última semana no Supabase, depois crie uma issue no GitHub com um relatório
```

### Web Search + Documentation
```
Busque as melhores práticas para trading bots em 2025 e crie uma documentação no projeto
```

### Browser Automation + Data Analysis
```
Use Playwright para acessar o site da Avalon, extrair a lista de ativos, e compare com os ativos no nosso banco de dados
```

## Configurações Avançadas

### Desabilitar MCP específico
Edite `.vscode/settings.json` e remova o MCP que não quer usar.

### Adicionar novo MCP
1. Adicione no `.mcp.json`
2. Adicione no `.vscode/settings.json` → `claudeCode.mcpServers`
3. Recarregue o VS Code

### Timeout customizado
```json
{
  "claudeCode.mcpTimeout": 30000  // 30 segundos
}
```

## Status das Credenciais

| MCP | Credencial Necessária | Status |
|-----|----------------------|--------|
| Supabase | Connection String | ✅ Configurada |
| GitHub | Personal Access Token | ✅ Configurada |
| Git | - | ✅ N/A |
| Filesystem | - | ✅ N/A |
| Notion | API Key | ✅ Configurada |
| Playwright | - | ✅ N/A |
| Web Search | API Key (FREE) | ✅ Configurada |
| ShadCN | - | ✅ N/A |
| Magic | API Key | ✅ Configurada |

## Próximos Passos

Agora você pode:

1. **Testar cada MCP** com os exemplos acima
2. **Combinar MCPs** para workflows complexos
3. **Explorar capacidades** de cada MCP
4. **Integrar no desenvolvimento** diário

---

**Data**: 15/10/2025
**Status**: ✅ Todos os MCPs configurados e prontos para uso no VS Code
