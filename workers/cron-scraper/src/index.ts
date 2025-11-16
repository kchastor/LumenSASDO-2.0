/**
 * LumenSASDO 2.0 - Cloudflare Worker
 * 農產品價格監控與分析系統
 * 
 * 檔案路徑: C:\Tools\Python\projects\LumenSASDO-2.0\workers\cron-scraper\src\index.ts
 * 編碼: UTF-8 (無 BOM)
 * 換行符號: LF
 * 版本: v2.1 - 修正中文欄位名稱
 */

export interface Env {
  DB: D1Database;
  ENVIRONMENT: string;
  API_TIMEOUT: string;
  MAX_RETRIES: string;
}

/**
 * 農產品價格資料介面（中文欄位）
 */
interface FarmPriceData {
  交易日期: string;      // 格式: 114.11.17 (民國年)
  種類代碼: string;      // 例: N04
  作物代號: string;      // 例: A101
  作物名稱: string;      // 例: 高麗菜
  市場代號: string;      // 例: 104
  市場名稱: string;      // 例: 台北一
  上價: number;          // 上價
  中價: number;          // 中價
  下價: number;          // 下價
  平均價: number;        // 平均價
  交易量: number;        // 交易量
}

/**
 * Fetch Handler (HTTP 請求處理)
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    // Handle OPTIONS request (CORS preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    try {
      // Route handlers
      switch (true) {
        case path === '/health':
          return handleHealth(env, corsHeaders);
        
        case path === '/':
          return handleRoot(corsHeaders);
        
        case path === '/api/prices':
          return handlePrices(request, env, corsHeaders);
        
        case path === '/api/search':
          return handleSearch(request, env, corsHeaders);
        
        case path.startsWith('/api/watchlist'):
          return handleWatchlist(request, env, corsHeaders);
        
        case path === '/api/test-cron':
          return handleTestCron(env, corsHeaders);
        
        default:
          return jsonResponse({ error: 'Not Found' }, 404, corsHeaders);
      }
    } catch (error) {
      console.error('Request handling error:', error);
      return jsonResponse({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 500, corsHeaders);
    }
  },
  
  /**
   * Scheduled Handler (Cron 觸發)
   */
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('🕐 Cron job started at:', new Date().toISOString());
    
    try {
      // 執行農產品價格爬蟲
      await scrapeFarmPrices(env);
      
      console.log('✅ Cron job completed successfully');
    } catch (error) {
      console.error('❌ Cron job failed:', error);
      // 這裡可以加入告警機制
    }
  }
};

/**
 * 農產品價格爬蟲 - 主邏輯
 */
async function scrapeFarmPrices(env: Env): Promise<void> {
  const API_URL = 'https://data.moa.gov.tw/Service/OpenData/FromM/FarmTransData.aspx';
  const MAX_RETRIES = parseInt(env.MAX_RETRIES || '3');
  const API_TIMEOUT = parseInt(env.API_TIMEOUT || '30000');
  
  console.log('📡 Fetching farm prices from MOA API...');
  
  let retries = 0;
  let data: FarmPriceData[] | null = null;
  
  // 重試邏輯
  while (retries < MAX_RETRIES && !data) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
      
      const response = await fetch(API_URL, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'LumenSASDO/2.0 (Agricultural Price Monitor)',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      
      data = await response.json() as FarmPriceData[];
      console.log(`✅ Fetched ${data.length} records from API`);
      
    } catch (error) {
      retries++;
      console.error(`❌ Fetch attempt ${retries} failed:`, error);
      
      if (retries < MAX_RETRIES) {
        // 指數退避
        const backoffTime = Math.pow(2, retries) * 1000;
        console.log(`⏳ Retrying in ${backoffTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      } else {
        throw new Error(`Failed to fetch data after ${MAX_RETRIES} attempts`);
      }
    }
  }
  
  if (!data || data.length === 0) {
    console.warn('⚠️  No data received from API');
    return;
  }
  
  // 資料驗證與清理
  const validRecords = validateAndCleanData(data);
  console.log(`✅ Validated ${validRecords.length} records (filtered ${data.length - validRecords.length} invalid)`);
  
  if (validRecords.length === 0) {
    console.warn('⚠️  No valid records to insert');
    return;
  }
  
  // 批次寫入資料庫
  await batchInsertPrices(env, validRecords);
  console.log(`✅ Successfully inserted ${validRecords.length} records into database`);
}

/**
 * 資料驗證與清理
 */
function validateAndCleanData(data: FarmPriceData[]): FarmPriceData[] {
  return data.filter(record => {
    // 過濾休市資料
    if (record.作物名稱 === '休市') {
      return false;
    }
    
    // 必要欄位檢查
    if (!record.交易日期 || !record.作物名稱 || !record.市場名稱) {
      console.warn('⚠️  Skipping record with missing required fields:', record);
      return false;
    }
    
    // 價格合理性檢查 (應該是正數)
    const avgPrice = record.平均價 || 0;
    if (avgPrice < 0 || avgPrice > 10000) {
      console.warn('⚠️  Skipping record with invalid price:', record);
      return false;
    }
    
    // 交易量檢查（休市通常交易量為 0）
    if (record.交易量 <= 0) {
      return false;
    }
    
    return true;
  }).map(record => {
    // 保持原始資料，不做額外處理
    return record;
  });
}

/**
 * 批次寫入資料庫
 */
async function batchInsertPrices(env: Env, records: FarmPriceData[]): Promise<void> {
  const BATCH_SIZE = 100; // D1 批次限制
  const batches: FarmPriceData[][] = [];
  
  // 分批處理
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    batches.push(records.slice(i, i + BATCH_SIZE));
  }
  
  console.log(`📦 Processing ${batches.length} batches (${BATCH_SIZE} records each)`);
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const statements: D1PreparedStatement[] = [];
    
    for (const record of batch) {
      // 轉換民國年為西元年 (114.11.17 -> 2025-11-17)
      const transDate = convertROCtoAD(record.交易日期);
      
      // 使用 INSERT OR REPLACE 避免重複
      // UNIQUE 約束: (trans_date, crop_name, market_name)
      const stmt = env.DB.prepare(`
        INSERT INTO farm_prices (
          trans_date, crop_name, market_name,
          up_price, mid_price, low_price,
          avg_price, trans_quantity
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(trans_date, crop_name, market_name)
        DO UPDATE SET
          up_price = excluded.up_price,
          mid_price = excluded.mid_price,
          low_price = excluded.low_price,
          avg_price = excluded.avg_price,
          trans_quantity = excluded.trans_quantity,
          created_at = CURRENT_TIMESTAMP
      `).bind(
        transDate,
        record.作物名稱,
        record.市場名稱,
        record.上價.toString(),
        record.中價.toString(),
        record.下價.toString(),
        record.平均價.toString(),
        record.交易量.toString()
      );
      
      statements.push(stmt);
    }
    
    // 執行批次
    try {
      await env.DB.batch(statements);
      console.log(`✅ Batch ${i + 1}/${batches.length} inserted successfully`);
    } catch (error) {
      console.error(`❌ Batch ${i + 1}/${batches.length} failed:`, error);
      throw error;
    }
  }
}

/**
 * 民國年轉西元年
 * 114.11.17 -> 2025-11-17
 */
function convertROCtoAD(rocDate: string): string {
  try {
    const parts = rocDate.split('.');
    if (parts.length !== 3) {
      throw new Error(`Invalid date format: ${rocDate}`);
    }
    
    const rocYear = parseInt(parts[0]);
    const month = parts[1].padStart(2, '0');
    const day = parts[2].padStart(2, '0');
    
    const adYear = rocYear + 1911;
    
    return `${adYear}-${month}-${day}`;
  } catch (error) {
    console.error('Date conversion error:', error);
    return rocDate; // 返回原始日期
  }
}

/**
 * Health Check Endpoint
 */
async function handleHealth(env: Env, headers: Record<string, string>): Promise<Response> {
  try {
    // 檢查資料庫連接
    const result = await env.DB.prepare('SELECT COUNT(*) as total FROM farm_prices').first();
    
    // 查詢最新資料日期
    const latest = await env.DB.prepare(
      'SELECT MAX(trans_date) as latest_date FROM farm_prices'
    ).first();
    
    return jsonResponse({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: 'v2.1',
      services: {
        database: 'ok',
        cron_jobs: 'ok'
      },
      data: {
        total_records: result?.total || 0,
        latest_date: latest?.latest_date || null
      }
    }, 200, headers);
  } catch (error) {
    return jsonResponse({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500, headers);
  }
}

/**
 * Root Endpoint
 */
function handleRoot(headers: Record<string, string>): Response {
  return jsonResponse({
    name: 'LumenSASDO 2.0 API',
    version: 'v2.1',
    description: '農產品價格監控與分析系統',
    endpoints: {
      health: '/health',
      prices: '/api/prices?limit=100&offset=0',
      search: '/api/search?q=keyword',
      watchlist: '/api/watchlist',
      test_cron: '/api/test-cron'
    },
    documentation: 'https://github.com/kchastor/LumenSASDO-2.0/blob/main/docs/API.md'
  }, 200, headers);
}

/**
 * Prices Endpoint (分頁查詢)
 */
async function handlePrices(
  request: Request,
  env: Env,
  headers: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 1000);
  const offset = parseInt(url.searchParams.get('offset') || '0');
  
  try {
    const results = await env.DB.prepare(`
      SELECT * FROM farm_prices
      ORDER BY trans_date DESC, created_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();
    
    const total = await env.DB.prepare('SELECT COUNT(*) as count FROM farm_prices').first();
    
    return jsonResponse({
      success: true,
      data: results.results,
      pagination: {
        limit,
        offset,
        total: total?.count || 0,
        has_more: offset + limit < (total?.count || 0)
      }
    }, 200, headers);
  } catch (error) {
    return jsonResponse({
      success: false,
      error: 'Database query failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500, headers);
  }
}

/**
 * Search Endpoint
 */
async function handleSearch(
  request: Request,
  env: Env,
  headers: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');
  
  if (!query) {
    return jsonResponse({
      success: false,
      error: 'Missing query parameter',
      message: 'Please provide a search query using ?q=keyword'
    }, 400, headers);
  }
  
  try {
    const results = await env.DB.prepare(`
      SELECT * FROM farm_prices
      WHERE crop_name LIKE ? OR market_name LIKE ?
      ORDER BY trans_date DESC
      LIMIT 100
    `).bind(`%${query}%`, `%${query}%`).all();
    
    return jsonResponse({
      success: true,
      query,
      count: results.results?.length || 0,
      data: results.results
    }, 200, headers);
  } catch (error) {
    return jsonResponse({
      success: false,
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500, headers);
  }
}

/**
 * Watchlist Endpoint
 */
async function handleWatchlist(
  request: Request,
  env: Env,
  headers: Record<string, string>
): Promise<Response> {
  // TODO: 實作監控清單 CRUD 邏輯
  return jsonResponse({
    success: false,
    error: 'Not implemented',
    message: 'Watchlist feature is under development'
  }, 501, headers);
}

/**
 * Test Cron Endpoint (手動觸發 Cron 邏輯)
 */
async function handleTestCron(
  env: Env,
  headers: Record<string, string>
): Promise<Response> {
  try {
    console.log('🧪 Manual Cron trigger started at:', new Date().toISOString());
    
    // 執行實際的爬蟲邏輯
    await scrapeFarmPrices(env);
    
    console.log('✅ Manual Cron trigger completed successfully');
    
    // 查詢最新資料數量
    const result = await env.DB.prepare('SELECT COUNT(*) as total FROM farm_prices').first();
    
    // 查詢最新資料日期
    const latest = await env.DB.prepare(
      'SELECT MAX(trans_date) as latest_date FROM farm_prices'
    ).first();
    
    // 查詢作物種類數
    const crops = await env.DB.prepare(
      'SELECT COUNT(DISTINCT crop_name) as crop_count FROM farm_prices'
    ).first();
    
    // 查詢市場數
    const markets = await env.DB.prepare(
      'SELECT COUNT(DISTINCT market_name) as market_count FROM farm_prices'
    ).first();
    
    return jsonResponse({
      success: true,
      message: 'Cron logic executed successfully',
      timestamp: new Date().toISOString(),
      data: {
        total_records: result?.total || 0,
        latest_date: latest?.latest_date || null,
        crop_count: crops?.crop_count || 0,
        market_count: markets?.market_count || 0
      }
    }, 200, headers);
    
  } catch (error) {
    console.error('❌ Manual Cron trigger failed:', error);
    return jsonResponse({
      success: false,
      error: 'Cron execution failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500, headers);
  }
}

/**
 * Helper: JSON Response
 */
function jsonResponse(
  data: any,
  status: number = 200,
  headers: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
}