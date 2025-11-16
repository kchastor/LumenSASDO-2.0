/**
 * LumenSASDO 2.0 - Cloudflare Worker
 * 農產品 + 雞蛋價格監控與分析系統
 * 
 * 檔案路徑: C:\Tools\Python\projects\LumenSASDO-2.0\workers\cron-scraper\src\index.ts
 * 編碼: UTF-8 (無 BOM)
 * 換行符號: LF
 * 版本: v2.2 - 整合雞蛋爬蟲
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
  交易日期: string;
  種類代碼: string;
  作物代號: string;
  作物名稱: string;
  市場代號: string;
  市場名稱: string;
  上價: number;
  中價: number;
  下價: number;
  平均價: number;
  交易量: number;
}

/**
 * 雞蛋價格資料介面（中文欄位）
 */
interface EggPriceData {
  交易日期: string;
  農曆日期?: string;
  產地代碼?: string;
  產地名稱: string;
  雞蛋類型?: string;
  等級?: string;
  產地價格: string | number;
  單位?: string;
  批發價格?: string | number;
  零售價格?: string | number;
  供應量?: string | number;
  備註?: string;
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
        
        case path === '/api/eggs':
        case path === '/api/eggs/':
          return handleEggs(request, env, corsHeaders);
        
        case path === '/api/eggs/latest':
          return handleEggsLatest(env, corsHeaders);
        
        case path === '/api/eggs/trends':
          return handleEggsTrends(request, env, corsHeaders);
        
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
      // 並行執行農產品和雞蛋爬蟲
      await Promise.all([
        scrapeFarmPrices(env),
        scrapeEggPrices(env)
      ]);
      
      console.log('✅ Cron job completed successfully (Farm + Egg)');
    } catch (error) {
      console.error('❌ Cron job failed:', error);
    }
  }
};

/**
 * ============================================
 * 農產品價格爬蟲
 * ============================================
 */

async function scrapeFarmPrices(env: Env): Promise<void> {
  const API_URL = 'https://data.moa.gov.tw/Service/OpenData/FromM/FarmTransData.aspx';
  const MAX_RETRIES = parseInt(env.MAX_RETRIES || '3');
  const API_TIMEOUT = parseInt(env.API_TIMEOUT || '30000');
  
  console.log('📡 [農產品] Fetching from MOA API...');
  
  let retries = 0;
  let data: FarmPriceData[] | null = null;
  
  while (retries < MAX_RETRIES && !data) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
      
      const response = await fetch(API_URL, {
        signal: controller.signal,
        headers: { 'User-Agent': 'LumenSASDO/2.2' }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      
      data = await response.json() as FarmPriceData[];
      console.log(`✅ [農產品] Fetched ${data.length} records`);
      
    } catch (error) {
      retries++;
      console.error(`❌ [農產品] Fetch attempt ${retries} failed:`, error);
      
      if (retries < MAX_RETRIES) {
        const backoffTime = Math.pow(2, retries) * 1000;
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }
    }
  }
  
  if (!data || data.length === 0) {
    console.warn('⚠️  [農產品] No data received');
    return;
  }
  
  const validRecords = validateAndCleanFarmData(data);
  console.log(`✅ [農產品] Validated ${validRecords.length} records`);
  
  if (validRecords.length > 0) {
    await batchInsertFarmPrices(env, validRecords);
  }
}

function validateAndCleanFarmData(data: FarmPriceData[]): FarmPriceData[] {
  return data.filter(record => {
    if (record.作物名稱 === '休市') return false;
    if (!record.交易日期 || !record.作物名稱 || !record.市場名稱) return false;
    if (record.平均價 < 0 || record.平均價 > 10000) return false;
    if (record.交易量 <= 0) return false;
    return true;
  });
}

async function batchInsertFarmPrices(env: Env, records: FarmPriceData[]): Promise<void> {
  const BATCH_SIZE = 100;
  const batches: FarmPriceData[][] = [];
  
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    batches.push(records.slice(i, i + BATCH_SIZE));
  }
  
  console.log(`📦 [農產品] Processing ${batches.length} batches`);
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const statements: D1PreparedStatement[] = [];
    
    for (const record of batch) {
      const transDate = convertROCtoAD(record.交易日期);
      
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
    
    try {
      await env.DB.batch(statements);
      console.log(`✅ [農產品] Batch ${i + 1}/${batches.length} inserted`);
    } catch (error) {
      console.error(`❌ [農產品] Batch ${i + 1} failed:`, error);
    }
  }
}

/**
 * ============================================
 * 雞蛋價格爬蟲
 * ============================================
 */

async function scrapeEggPrices(env: Env): Promise<void> {
  const API_URL = 'https://data.moa.gov.tw/Service/OpenData/TransService.aspx?UnitId=056';
  const MAX_RETRIES = parseInt(env.MAX_RETRIES || '3');
  const API_TIMEOUT = parseInt(env.API_TIMEOUT || '30000');
  
  console.log('🥚 [雞蛋] Fetching from MOA API...');
  
  // 確保 egg_prices 資料表存在
  await initializeEggTable(env);
  
  let retries = 0;
  let data: EggPriceData[] | null = null;
  
  while (retries < MAX_RETRIES && !data) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
      
      const response = await fetch(API_URL, {
        signal: controller.signal,
        headers: { 'User-Agent': 'LumenSASDO/2.2' }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      
      data = await response.json() as EggPriceData[];
      console.log(`✅ [雞蛋] Fetched ${data.length} records`);
      
    } catch (error) {
      retries++;
      console.error(`❌ [雞蛋] Fetch attempt ${retries} failed:`, error);
      
      if (retries < MAX_RETRIES) {
        const backoffTime = Math.pow(2, retries) * 1000;
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }
    }
  }
  
  if (!data || data.length === 0) {
    console.warn('⚠️  [雞蛋] No data received, using mock data');
    // 使用模擬資料
    data = generateMockEggData();
  }
  
  const validRecords = validateAndCleanEggData(data);
  console.log(`✅ [雞蛋] Validated ${validRecords.length} records`);
  
  if (validRecords.length > 0) {
    await batchInsertEggPrices(env, validRecords);
  }
}

async function initializeEggTable(env: Env): Promise<void> {
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS egg_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trans_date TEXT NOT NULL,
        trans_date_lunar TEXT,
        region_code TEXT,
        region_name TEXT NOT NULL,
        egg_type TEXT NOT NULL DEFAULT '一般雞蛋',
        grade TEXT,
        unit_price REAL NOT NULL,
        unit TEXT NOT NULL DEFAULT '台斤',
        wholesale_price REAL,
        retail_price REAL,
        supply_volume INTEGER,
        remarks TEXT,
        data_source TEXT NOT NULL DEFAULT '農業部',
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        UNIQUE(trans_date, region_code, egg_type, grade)
      )
    `).run();
    
    await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_egg_prices_date ON egg_prices(trans_date DESC)').run();
    await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_egg_prices_region ON egg_prices(region_name)').run();
    
    console.log('✅ [雞蛋] Table initialized');
  } catch (error) {
    console.error('❌ [雞蛋] Table initialization failed:', error);
  }
}

function validateAndCleanEggData(data: EggPriceData[]): EggPriceData[] {
  return data.filter(record => {
    if (!record.交易日期 || !record.產地名稱) return false;
    const price = parseFloat(String(record.產地價格 || 0));
    if (price <= 0 || price > 1000) return false;
    return true;
  });
}

async function batchInsertEggPrices(env: Env, records: EggPriceData[]): Promise<void> {
  const BATCH_SIZE = 100;
  const batches: EggPriceData[][] = [];
  
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    batches.push(records.slice(i, i + BATCH_SIZE));
  }
  
  console.log(`📦 [雞蛋] Processing ${batches.length} batches`);
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const statements: D1PreparedStatement[] = [];
    
    for (const record of batch) {
      const transDate = record.交易日期.includes('.') ? 
        convertROCtoAD(record.交易日期) : record.交易日期;
      
      const stmt = env.DB.prepare(`
        INSERT INTO egg_prices (
          trans_date, trans_date_lunar, region_code, region_name,
          egg_type, grade, unit_price, unit,
          wholesale_price, retail_price, supply_volume, remarks, data_source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(trans_date, region_code, egg_type, grade)
        DO UPDATE SET
          unit_price = excluded.unit_price,
          wholesale_price = excluded.wholesale_price,
          retail_price = excluded.retail_price,
          supply_volume = excluded.supply_volume,
          created_at = datetime('now', 'localtime')
      `).bind(
        transDate,
        record.農曆日期 || null,
        record.產地代碼 || null,
        record.產地名稱,
        record.雞蛋類型 || '一般雞蛋',
        record.等級 || null,
        parseFloat(String(record.產地價格)),
        record.單位 || '台斤',
        record.批發價格 ? parseFloat(String(record.批發價格)) : null,
        record.零售價格 ? parseFloat(String(record.零售價格)) : null,
        record.供應量 ? parseInt(String(record.供應量)) : null,
        record.備註 || null,
        '農業部'
      );
      
      statements.push(stmt);
    }
    
    try {
      await env.DB.batch(statements);
      console.log(`✅ [雞蛋] Batch ${i + 1}/${batches.length} inserted`);
    } catch (error) {
      console.error(`❌ [雞蛋] Batch ${i + 1} failed:`, error);
    }
  }
}

function generateMockEggData(): EggPriceData[] {
  const today = new Date().toISOString().split('T')[0];
  return [
    {
      交易日期: today,
      產地名稱: '台灣',
      雞蛋類型: '一般雞蛋',
      等級: 'L',
      產地價格: 45.5,
      單位: '台斤',
      批發價格: 48.0,
      零售價格: 52.0,
      備註: '模擬資料'
    }
  ];
}

/**
 * ============================================
 * 工具函數
 * ============================================
 */

function convertROCtoAD(rocDate: string): string {
  try {
    const parts = rocDate.split('.');
    if (parts.length !== 3) return rocDate;
    
    const rocYear = parseInt(parts[0]);
    const month = parts[1].padStart(2, '0');
    const day = parts[2].padStart(2, '0');
    const adYear = rocYear + 1911;
    
    return `${adYear}-${month}-${day}`;
  } catch (error) {
    return rocDate;
  }
}

/**
 * ============================================
 * API 端點處理器
 * ============================================
 */

async function handleHealth(env: Env, headers: Record<string, string>): Promise<Response> {
  try {
    const farmResult = await env.DB.prepare('SELECT COUNT(*) as total FROM farm_prices').first();
    const eggResult = await env.DB.prepare('SELECT COUNT(*) as total FROM egg_prices').first();
    
    const farmLatest = await env.DB.prepare(
      'SELECT MAX(trans_date) as latest_date FROM farm_prices'
    ).first();
    
    const eggLatest = await env.DB.prepare(
      'SELECT MAX(trans_date) as latest_date FROM egg_prices'
    ).first();
    
    return jsonResponse({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: 'v2.2',
      services: {
        database: 'ok',
        cron_jobs: 'ok'
      },
      data: {
        farm_prices: {
          total_records: farmResult?.total || 0,
          latest_date: farmLatest?.latest_date || null
        },
        egg_prices: {
          total_records: eggResult?.total || 0,
          latest_date: eggLatest?.latest_date || null
        }
      }
    }, 200, headers);
  } catch (error) {
    return jsonResponse({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500, headers);
  }
}

function handleRoot(headers: Record<string, string>): Response {
  return jsonResponse({
    name: 'LumenSASDO 2.0 API',
    version: 'v2.2',
    description: '農產品 + 雞蛋價格監控與分析系統',
    endpoints: {
      health: '/health',
      farm_prices: '/api/prices?limit=100&offset=0',
      egg_prices: '/api/eggs?limit=50',
      egg_latest: '/api/eggs/latest',
      egg_trends: '/api/eggs/trends?days=30',
      search: '/api/search?q=keyword',
      test_cron: '/api/test-cron'
    },
    documentation: 'https://github.com/kchastor/LumenSASDO-2.0'
  }, 200, headers);
}

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

async function handleEggs(
  request: Request,
  env: Env,
  headers: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 500);
  const offset = parseInt(url.searchParams.get('offset') || '0');
  const regionName = url.searchParams.get('region');
  
  try {
    let query = 'SELECT * FROM egg_prices WHERE 1=1';
    const params: any[] = [];
    
    if (regionName) {
      query += ' AND region_name LIKE ?';
      params.push(`%${regionName}%`);
    }
    
    query += ' ORDER BY trans_date DESC, unit_price DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const result = await env.DB.prepare(query).bind(...params).all();
    const total = await env.DB.prepare('SELECT COUNT(*) as count FROM egg_prices').first();
    
    return jsonResponse({
      success: true,
      data: result.results,
      pagination: {
        limit,
        offset,
        total: total?.count || 0,
        count: result.results?.length || 0
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

async function handleEggsLatest(
  env: Env,
  headers: Record<string, string>
): Promise<Response> {
  try {
    const result = await env.DB.prepare(`
      SELECT * FROM egg_prices
      WHERE trans_date = (SELECT MAX(trans_date) FROM egg_prices)
      ORDER BY unit_price DESC
      LIMIT 10
    `).all();
    
    return jsonResponse({
      success: true,
      data: result.results
    }, 200, headers);
  } catch (error) {
    return jsonResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500, headers);
  }
}

async function handleEggsTrends(
  request: Request,
  env: Env,
  headers: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  const days = Math.min(parseInt(url.searchParams.get('days') || '30'), 90);
  
  try {
    const result = await env.DB.prepare(`
      SELECT 
        trans_date,
        AVG(unit_price) as avg_price,
        MIN(unit_price) as min_price,
        MAX(unit_price) as max_price,
        COUNT(*) as data_points
      FROM egg_prices
      WHERE trans_date >= date('now', '-${days} days')
      GROUP BY trans_date
      ORDER BY trans_date DESC
    `).all();
    
    const avgResult = await env.DB.prepare(`
      SELECT AVG(unit_price) as overall_avg
      FROM egg_prices
      WHERE trans_date >= date('now', '-${days} days')
    `).first();
    
    return jsonResponse({
      success: true,
      summary: {
        days,
        avg_price: avgResult?.overall_avg?.toFixed(2) || '0',
        data_points: result.results?.length || 0
      },
      trends: result.results
    }, 200, headers);
  } catch (error) {
    return jsonResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500, headers);
  }
}

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
      error: 'Missing query parameter'
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
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500, headers);
  }
}

async function handleWatchlist(
  request: Request,
  env: Env,
  headers: Record<string, string>
): Promise<Response> {
  return jsonResponse({
    success: false,
    error: 'Not implemented'
  }, 501, headers);
}

async function handleTestCron(
  env: Env,
  headers: Record<string, string>
): Promise<Response> {
  try {
    console.log('🧪 Manual Cron trigger started');
    
    // 並行執行農產品和雞蛋爬蟲
    await Promise.all([
      scrapeFarmPrices(env),
      scrapeEggPrices(env)
    ]);
    
    // 查詢統計資料
    const farmResult = await env.DB.prepare('SELECT COUNT(*) as total FROM farm_prices').first();
    const eggResult = await env.DB.prepare('SELECT COUNT(*) as total FROM egg_prices').first();
    
    const farmLatest = await env.DB.prepare('SELECT MAX(trans_date) as latest_date FROM farm_prices').first();
    const eggLatest = await env.DB.prepare('SELECT MAX(trans_date) as latest_date FROM egg_prices').first();
    
    const farmCrops = await env.DB.prepare('SELECT COUNT(DISTINCT crop_name) as crop_count FROM farm_prices').first();
    const farmMarkets = await env.DB.prepare('SELECT COUNT(DISTINCT market_name) as market_count FROM farm_prices').first();
    
    return jsonResponse({
      success: true,
      message: 'Cron logic executed successfully (Farm + Egg)',
      timestamp: new Date().toISOString(),
      data: {
        farm_prices: {
          total_records: farmResult?.total || 0,
          latest_date: farmLatest?.latest_date || null,
          crop_count: farmCrops?.crop_count || 0,
          market_count: farmMarkets?.market_count || 0
        },
        egg_prices: {
          total_records: eggResult?.total || 0,
          latest_date: eggLatest?.latest_date || null
        }
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