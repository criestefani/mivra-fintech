import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, 'apps', 'backend', '.env') });

const apiKey = process.env.NOTION_API;

if (!apiKey) {
  console.log('❌ NOTION_API não encontrada nas variáveis de ambiente');
  process.exit(1);
}

console.log('🔐 Testando Notion MCP...\n');
console.log('API Key:', apiKey.substring(0, 20) + '...\n');

try {
  // Test Notion API directly
  const response = await fetch('https://api.notion.com/v1/users/me', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const user = await response.json();
  console.log('✅ Conexão Notion Estabelecida!\n');
  console.log('👤 Usuário:', user.name || user.id);
  console.log('   Tipo:', user.type);

  // List databases
  console.log('\n📊 Buscando Databases no Notion:\n');

  const dbResponse = await fetch('https://api.notion.com/v1/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      filter: { property: 'object', value: 'database' },
      sort: { direction: 'descending', timestamp: 'last_edited_time' }
    })
  });

  const dbData = await dbResponse.json();

  if (!dbData.results || dbData.results.length === 0) {
    console.log('⚠️ Nenhum database encontrado');
  } else {
    console.log(`✅ Total: ${dbData.results.length} databases\n`);
    dbData.results.slice(0, 10).forEach((db, i) => {
      const title = db.title?.[0]?.plain_text || db.id;
      console.log(`${i + 1}. ${title}`);
    });

    if (dbData.results.length > 10) {
      console.log(`\n... e ${dbData.results.length - 10} mais`);
    }
  }

  console.log('\n✅ Notion MCP está funcionando!');

} catch (error) {
  console.log('❌ Erro ao conectar com Notion:');
  console.log('   ', error.message);
  console.log('\n💡 Dica: Verifique se a chave da API está correta');
}
