#!/usr/bin/env node

/**
 * Check strategy_trades table via Supabase REST API
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

async function checkTable() {
  console.log('\n🔍 Checking strategy_trades table via REST API...\n');

  try {
    // Check table structure
    console.log('📋 Fetching table structure...');
    const infoUrl = `${SUPABASE_URL}/rest/v1/strategy_trades?limit=0`;

    const infoResponse = await fetch(infoUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    if (!infoResponse.ok) {
      console.error(`❌ Error fetching table info: ${infoResponse.status} ${infoResponse.statusText}`);
      const error = await infoResponse.text();
      console.error(error);
      return;
    }

    console.log('✅ Table exists!\n');

    // Get row count
    console.log('📊 Fetching data count...');
    const countUrl = `${SUPABASE_URL}/rest/v1/strategy_trades?select=count=count()`;

    const countResponse = await fetch(countUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    if (countResponse.ok) {
      const countData = await countResponse.json();
      const count = countData[0]?.count || 0;
      console.log(`✅ Total rows in table: ${count}\n`);

      // Get latest records
      if (count > 0) {
        console.log('📝 Latest 5 records:');
        const dataUrl = `${SUPABASE_URL}/rest/v1/strategy_trades?order=signal_timestamp.desc&limit=5`;

        const dataResponse = await fetch(dataUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
          }
        });

        if (dataResponse.ok) {
          const data = await dataResponse.json();
          console.log(JSON.stringify(data, null, 2));
        }
      }
    }

    // Get column info
    console.log('\n📋 Table columns:');
    const columnsUrl = `${SUPABASE_URL}/rest/v1/strategy_trades?limit=1`;

    const columnsResponse = await fetch(columnsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    if (columnsResponse.ok) {
      const columnsData = await columnsResponse.json();
      if (columnsData.length > 0) {
        const columns = Object.keys(columnsData[0]);
        columns.forEach((col, i) => {
          console.log(`  ${i + 1}. ${col}`);
        });
      } else {
        console.log('  (No data yet - table is empty)');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n');
}

checkTable();
