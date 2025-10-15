# Guia de Instalação de MCPs - MivraTech

## O que são MCPs?

Model Context Protocol (MCP) servers são ferramentas que estendem as capacidades do Claude, permitindo acesso a sistemas externos como bancos de dados, APIs, sistemas de arquivos, etc.

## Como MCPs Funcionam

MCPs **não são instalados via npm**. Eles são configurados no Claude Desktop e executados on-demand via `npx` quando necessário.

## Instalação no Claude Desktop

### Passo 1: Localizar o arquivo de configuração

O arquivo de configuração do Claude Desktop está em:

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

**MacOS:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Linux:**
```
~/.config/Claude/claude_desktop_config.json
```

### Passo 2: Copiar a configuração

1. Abra o arquivo `claude_desktop_config.json` do diretório acima
2. Copie o conteúdo do arquivo `I:\Mivra Fintech\claude_desktop_config.json`
3. Cole no arquivo de configuração do Claude Desktop
4. Salve o arquivo

### Passo 3: Reiniciar o Claude Desktop

Feche completamente o Claude Desktop e abra novamente. Os MCPs serão carregados automaticamente.

## MCPs Configurados

### 1. Supabase (PostgreSQL)
- **Servidor**: `@modelcontextprotocol/server-postgres`
- **Capacidades**: Query SQL, listar tabelas, ver schemas
- **Uso**: "Claude, liste todas as tabelas do Supabase"

### 2. GitHub
- **Servidor**: `@modelcontextprotocol/server-github`
- **Capacidades**: Criar issues, PRs, ver repos, ler arquivos
- **Uso**: "Claude, crie uma issue no GitHub"

### 3. Git
- **Servidor**: `@modelcontextprotocol/server-git`
- **Capacidades**: status, diff, commit, log
- **Uso**: "Claude, mostre o git status"

### 4. Filesystem
- **Servidor**: `@modelcontextprotocol/server-filesystem`
- **Capacidades**: Ler/escrever arquivos, navegar diretórios
- **Uso**: "Claude, leia o arquivo X"

### 5. Notion
- **Servidor**: `@notionhq/client`
- **Capacidades**: Ler/criar páginas, query databases
- **Uso**: "Claude, busque informações no Notion"

### 6. Playwright (Browser Automation)
- **Servidor**: `@playwright/mcp`
- **Capacidades**: Automação de navegador, scraping
- **Uso**: "Claude, acesse o site X e extraia dados"

### 7. Web Search (Brave)
- **Servidor**: `@modelcontextprotocol/server-brave-search`
- **Capacidades**: Buscar na web
- **Uso**: "Claude, busque informações sobre X na web"

### 8. ShadCN UI
- **Servidor**: `shadcn@latest mcp`
- **Capacidades**: Adicionar componentes UI, gerar interfaces
- **Uso**: "Claude, adicione um componente de botão ShadCN"
- **Instalação**: ✅ Instalado via `pnpm dlx shadcn@latest mcp init --client claude`

### 9. Magic MCP (21st.dev)
- **Servidor**: `@21st-dev/magic`
- **Capacidades**: IA avançada, geração de código, análise profunda
- **Uso**: "Claude, use Magic MCP para otimizar este código"
- **Instalação**: ✅ Instalado via `@21st-dev/cli` com API key configurada

## Verificação

Para verificar se os MCPs foram carregados corretamente:

1. Abra o Claude Desktop
2. No chat, pergunte: "Quais MCPs estão disponíveis?"
3. O Claude deve listar todos os MCPs configurados

## Troubleshooting

### MCPs não aparecem
- Verifique se o arquivo `claude_desktop_config.json` está no local correto
- Verifique a sintaxe JSON (sem vírgulas extras, chaves balanceadas)
- Reinicie o Claude Desktop completamente

### Erro de credenciais
- Verifique se as variáveis de ambiente estão corretas
- Para Supabase, use a connection string completa do PostgreSQL
- Para GitHub, use um Personal Access Token válido

### MCP específico falha
- Verifique os logs do Claude Desktop em:
  - Windows: `%APPDATA%\Claude\logs\`
  - MacOS: `~/Library/Logs/Claude/`
  - Linux: `~/.config/Claude/logs/`

## Credenciais Necessárias

Todas as credenciais já estão configuradas no `.env`:

```env
# Supabase (PostgreSQL)
POSTGRES_CONNECTION_STRING=postgresql://postgres.vecofrvxrepogtigmeyj:HAuysg6A87sgus@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# GitHub
GITHUB_TOKEN=github_pat_...

# Notion
NOTION_API=ntn_...

# Brave Search (opcional - pode usar FREE)
BRAVE_API_KEY=BRAVE_SEARCH_FREE
```

## Recursos Adicionais

- [MCP Documentation](https://modelcontextprotocol.io/)
- [MCP GitHub](https://github.com/modelcontextprotocol)
- [Available MCP Servers](https://github.com/modelcontextprotocol/servers)

## Próximos Passos

Após configurar os MCPs, você pode:

1. **Testar Supabase**: "Claude, mostre todas as tabelas do banco de dados"
2. **Testar GitHub**: "Claude, liste os repos do GitHub"
3. **Testar Git**: "Claude, mostre o status do git"
4. **Testar Filesystem**: "Claude, leia o arquivo README.md"

---

**Nota**: MCPs são executados localmente via `npx`. Na primeira vez que usar cada MCP, pode demorar alguns segundos para baixar o pacote.
