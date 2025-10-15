# Status de MCPs - MivraTech

## MCPs Instalados ✅

### 1. Supabase (PostgreSQL) ✅
- **Status**: Configurado
- **Arquivo**: `claude_desktop_config.json`
- **Credenciais**: Connection string configurada
- **Uso**: Query SQL, listar tabelas, ver schemas

### 2. GitHub ✅
- **Status**: Configurado
- **Arquivo**: `claude_desktop_config.json`
- **Credenciais**: GitHub Token configurado
- **Uso**: Issues, PRs, repos, arquivos

### 3. Git ✅
- **Status**: Configurado
- **Arquivo**: `claude_desktop_config.json`
- **Credenciais**: Não requer (usa git local)
- **Uso**: status, diff, commit, log

### 4. Filesystem ✅
- **Status**: Configurado
- **Arquivo**: `claude_desktop_config.json`
- **Credenciais**: Não requer
- **Uso**: Ler/escrever arquivos, navegar diretórios

### 5. Notion ✅
- **Status**: Configurado
- **Arquivo**: `claude_desktop_config.json`
- **Credenciais**: Notion API Key configurada
- **Uso**: Páginas, databases

### 6. Playwright (Browser) ✅
- **Status**: Configurado
- **Arquivo**: `claude_desktop_config.json`
- **Credenciais**: Não requer
- **Uso**: Automação de browser, scraping

### 7. Web Search (Brave) ✅
- **Status**: Configurado
- **Arquivo**: `claude_desktop_config.json`
- **Credenciais**: Brave API (FREE mode)
- **Uso**: Busca na web

### 8. ShadCN UI ✅
- **Status**: ✅ **INSTALADO**
- **Comando**: `pnpm dlx shadcn@latest mcp init --client claude`
- **Arquivo**: `.mcp.json` (criado)
- **Uso**: Adicionar componentes UI, gerar interfaces

### 9. Magic MCP (21st.dev) ✅
- **Status**: ✅ **INSTALADO**
- **Comando**: `npx @21st-dev/cli@latest install cline`
- **API Key**: Configurada (3d4a62c7...)
- **Uso**: IA avançada, geração de código, análise profunda

## Arquivos de Configuração

### `.mcp.json` (Raiz do projeto)
```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```

### `claude_desktop_config.json`
Contém configuração de todos os 9 MCPs.

**Localização no sistema**:
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

## Como Ativar

1. **Copie** o conteúdo de `I:\Mivra Fintech\claude_desktop_config.json`
2. **Cole** no arquivo de configuração do Claude Desktop (ver localização acima)
3. **Reinicie** o Claude Desktop completamente
4. **Teste** perguntando: "Quais MCPs estão disponíveis?"

## Status de Credenciais

| MCP | Credencial | Status |
|-----|-----------|--------|
| Supabase | Connection String | ✅ Configurada |
| GitHub | Token | ✅ Configurada |
| Git | - | ✅ N/A |
| Filesystem | - | ✅ N/A |
| Notion | API Key | ✅ Configurada |
| Playwright | - | ✅ N/A |
| Web Search | API Key (FREE) | ✅ Configurada |
| ShadCN | - | ✅ N/A |
| Magic | API Key | ✅ Configurada |

## Exemplos de Uso

### Supabase
```
Claude, execute esta query no Supabase:
SELECT * FROM profiles LIMIT 10
```

### GitHub
```
Claude, liste todos os repositórios do GitHub
```

### ShadCN UI
```
Claude, adicione um componente de Card do ShadCN ao projeto
```

### Magic MCP
```
Claude, use o Magic MCP para analisar e otimizar o código do bot-live.mjs
```

### Web Search
```
Claude, busque as últimas tendências sobre trading bots com AI
```

## Troubleshooting

### MCPs não aparecem no Claude
1. Verifique se copiou o conteúdo de `claude_desktop_config.json` para o arquivo correto
2. Reinicie o Claude Desktop completamente (feche e abra de novo)
3. Verifique logs em: `~/.config/Claude/logs/` (Linux/Mac) ou `%APPDATA%\Claude\logs\` (Windows)

### Erro "MCP server not found"
- Verifique se os pacotes npm podem ser executados via npx
- Teste manualmente: `npx shadcn@latest mcp --help`

### Erro de autenticação
- Verifique as credenciais no arquivo `.env`
- Para Supabase: use a connection string completa do PostgreSQL
- Para GitHub: regenere o token se necessário

## Próximos Passos

Agora que todos os MCPs estão instalados e configurados, você pode:

1. **Reiniciar o Claude Desktop** para carregar as configurações
2. **Testar cada MCP** com os exemplos acima
3. **Explorar as capacidades** de cada MCP
4. **Integrar MCPs** no workflow de desenvolvimento

---

**Data de Instalação**: 15/10/2025
**Versão**: 1.0
**Status Geral**: ✅ Todos os MCPs configurados
