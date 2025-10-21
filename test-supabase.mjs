import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, 'apps', 'backend', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

console.log('✅ Conexão Supabase Estabelecida!\n');

const tables = [
  'users', 'profiles', 'trades', 'signals', 'accounts', 'settings',
  'transactions', 'notifications', 'logs', 'bots', 'strategies',
  'candles', 'market_data', 'orders', 'portfolios'
];

console.log('📊 Verificando tabelas no Supabase:\n');

const results = [];

for (const table of tables) {
  try {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (!error) {
      results.push({ table, exists: true, rows: count || 0 });
      console.log(`✅ ${table.padEnd(20)} - ${count || 0} registros`);
    }
  } catch (e) {
    // Tabela não existe
  }
}

console.log('\n');
if (results.length > 0) {
  console.log(`📈 Total: ${results.length} tabelas encontradas`);
} else {
  console.log('⚠️ Nenhuma tabela padrão encontrada');
  console.log('💡 Dica: Verifique as tabelas específicas do seu projeto no Supabase Dashboard');
}
