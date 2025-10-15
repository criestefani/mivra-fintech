# Configuração de MCPs - MivraTech

Este documento explica como configurar e usar os Model Context Protocol (MCP) servers no projeto MivraTech.

## MCPs Instalados

### 1. **Supabase MCP**
- **Descrição**: Operações de banco de dados e queries
- **Comandos disponíveis**:
  - `supabase_query` - Executar queries SQL
  - `supabase_list_tables` - Listar tabelas
  - `supabase_get_schema` - Ver schema de tabelas
- **Credenciais**: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`

### 2. **GitHub MCP**
- **Descrição**: Gerenciamento de repositórios, issues e PRs
- **Comandos disponíveis**:
  - `github_create_issue` - Criar issue
  - `github_create_pr` - Criar pull request
  - `github_list_repos` - Listar repositórios
  - `github_get_file` - Obter conteúdo de arquivo
- **Credenciais**: `GITHUB_TOKEN`

### 3. **Git MCP**
- **Descrição**: Operações git locais
- **Comandos disponíveis**:
  - `git_status` - Ver status
  - `git_diff` - Ver diferenças
  - `git_commit` - Criar commit
  - `git_log` - Ver histórico
- **Credenciais**: Não requer (usa git local)

### 4. **Magic MCP (21st.dev)**
- **Descrição**: Ferramentas AI-powered avançadas
- **Comandos disponíveis**:
  - `magic_generate_code` - Gerar código
  - `magic_explain_code` - Explicar código
  - `magic_refactor` - Refatorar código
- **Credenciais**: `MAGIC_MCP`

### 5. **Sentry MCP**
- **Descrição**: Monitoramento de erros e tracking
- **Comandos disponíveis**:
  - `sentry_list_issues` - Listar erros
  - `sentry_get_issue` - Detalhes de erro
  - `sentry_create_alert` - Criar alerta
- **Credenciais**: `SENTRY_API`

### 6. **Notion MCP**
- **Descrição**: Integração com workspace Notion
- **Comandos disponíveis**:
  - `notion_get_page` - Obter página
  - `notion_create_page` - Criar página
  - `notion_query_database` - Query em database
- **Credenciais**: `NOTION_API`

### 7. **ShadCN UI MCP**
- **Descrição**: Componentes UI do ShadCN
- **Comandos disponíveis**:
  - `shadcn_add_component` - Adicionar componente
  - `shadcn_list_components` - Listar componentes
- **Credenciais**: Não requer

### 8. **Web Search MCP**
- **Descrição**: Busca na web
- **Comandos disponíveis**:
  - `web_search` - Buscar na web
  - `web_get_page` - Obter conteúdo de página
- **Credenciais**: Não requer (usa APIs públicas)

### 9. **Deep Thinking MCP**
- **Descrição**: Análise profunda e reasoning
- **Comandos disponíveis**:
  - `deep_think` - Análise profunda
  - `deep_analyze` - Análise detalhada
- **Credenciais**: Usa API Anthropic do projeto

## Instalação

### Opção 1: Script Automático
```bash
bash install-mcps.sh
```

### Opção 2: Manual
```bash
# Instalar cada MCP individualmente
npm install -g @modelcontextprotocol/server-supabase
npm install -g @modelcontextprotocol/server-github
npm install -g @modelcontextprotocol/server-git
npm install -g @21st-dev/magic
npm install -g @modelcontextprotocol/server-sentry
npm install -g @notionhq/client-mcp
```

## Configuração

1. **Credenciais**: Todas as credenciais já estão no arquivo `apps/backend/.env`

2. **Config MCP**: O arquivo `.claude/mcp-config.json` contém a configuração dos MCPs

3. **Claude Desktop**: Se usar Claude Desktop, adicione ao `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    // Copie o conteúdo de .claude/mcp-config.json aqui
  }
}
```

## Como Usar

### Exemplo: Query no Supabase
```
Claude, execute uma query no Supabase para listar todos os usuários:
SELECT * FROM profiles LIMIT 10
```

### Exemplo: Criar Issue no GitHub
```
Claude, crie uma issue no GitHub com título "Bug no login" e descrição "Usuários não conseguem fazer login"
```

### Exemplo: Análise com Deep Thinking
```
Claude, use deep thinking para analisar a arquitetura do bot de trading e sugerir melhorias
```

## Troubleshooting

### MCPs não estão sendo reconhecidos
1. Verifique se os MCPs foram instalados: `npm list -g`
2. Reinicie o Claude Code/Desktop
3. Verifique as credenciais no `.env`

### Erro de autenticação
1. Verifique se as chaves API estão corretas no `.env`
2. Teste as credenciais diretamente nas APIs
3. Regenere tokens se necessário

### MCP específico não funciona
1. Verifique logs: `~/.claude/logs/mcp.log`
2. Teste o MCP manualmente: `npx @modelcontextprotocol/server-[nome]`
3. Reinstale o MCP específico

## Referências

- [MCP Documentation](https://modelcontextprotocol.io/)
- [Supabase MCP](https://github.com/modelcontextprotocol/servers/tree/main/src/supabase)
- [GitHub MCP](https://github.com/modelcontextprotocol/servers/tree/main/src/github)
- [Magic MCP](https://21st.dev/docs/magic-mcp)
