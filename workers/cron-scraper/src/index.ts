/**
 * LumenSASDO 2.0 - Cloudflare Workers Cron Scraper
 * 
 * 主要功能：
 * 1. 每日自動收集農產品價格資料
 * 2. 提供 RESTful API 查詢服務
 * 3. 監控清單管理
 * 4. AI 分析功能（規劃中）
 */

interface Env {
  DB: D1Database;
  GEMINI_API_KEY?: string;
}

export default {
  /**
   * Scheduled Event Handler (Cron Jobs)
   * 每日凌晨 3:00 (UTC) 自動執行
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('🕐 Cron job started at:', new Date().toISOString());
    
    try {
      // TODO: 實作農產品價格爬蟲邏輯
      // 1. 從農業部 API 擷取資料
      // 2. 資料驗證與轉換
      // 3. 批次寫入 D1 資料庫
      
      console.log('✅ Cron job completed successfully');
    } catch (error) {
      console.error('❌ Cron job failed:', error);
      // TODO: 實作錯誤通知機制
    }
  },

  /**
   * Fetch Event Handler (HTTP Requests)
   * 處理所有 HTTP 請求
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS Headers
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
      console.error('Error handling request:', error);
      return jsonResponse(
        { 
          success: false,
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        500,
        corsHeaders
      );
    }
  },
};

/**
 * Health Check Endpoint
 */
async function handleHealth(env: Env, headers: Record<string, string>): Promise<Response> {
  try {
    // Test database connection
    const result = await env.DB.prepare('SELECT COUNT(*) as count FROM farm_prices').first();
    
    return jsonResponse({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'ok',
        cron_jobs: 'ok'
      },
      data: {
        total_records: result?.count || 0
      }
    }, 200, headers);
  } catch (error) {
    return jsonResponse({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 503, headers);
  }
}

/**
 * Root Endpoint
 */
function handleRoot(headers: Record<string, string>): Response {
  return jsonResponse({
    name: 'LumenSASDO 2.0 API',
    version: '1.0.0',
    description: '智能化農產品採購決策平台',
    endpoints: {
      health: '/health',
      prices: '/api/prices',
      search: '/api/search',
      watchlist: '/api/watchlist'
    },
    documentation: 'https://github.com/windcgz/LumenSASDO-2.0'
  }, 200, headers);
}

/**
 * Get Prices Endpoint
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
    const result = await env.DB.prepare(`
      SELECT * FROM farm_prices 
      ORDER BY trans_date DESC, created_at DESC 
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    const total = await env.DB.prepare('SELECT COUNT(*) as count FROM farm_prices').first();

    return jsonResponse({
      success: true,
      data: result.results,
      meta: {
        total: total?.count || 0,
        limit,
        offset,
        has_more: (offset + limit) < (total?.count || 0)
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
      error: 'Missing required parameter',
      message: "Query parameter 'q' is required"
    }, 400, headers);
  }

  try {
    const result = await env.DB.prepare(`
      SELECT * FROM farm_prices 
      WHERE crop_name LIKE ?
      ORDER BY trans_date DESC
      LIMIT 50
    `).bind(`%${query}%`).all();

    return jsonResponse({
      success: true,
      query,
      data: result.results,
      meta: {
        total: result.results.length
      }
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
    
    // TODO: 這裡應該呼叫實際的爬蟲邏輯
    // 目前只是示範，實際實作時需要：
    // 1. 從農業部 API 擷取資料
    // 2. 資料驗證與轉換
    // 3. 批次寫入 D1 資料庫
    
    // 示範：插入一筆測試資料
    await env.DB.prepare(`
      INSERT INTO farm_prices 
      (trans_date, crop_name, market_name, up_price, mid_price, low_price, avg_price, trans_quantity)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      new Date().toISOString().split('T')[0],
      '測試作物',
      '測試市場',
      '50.00',
      '45.00',
      '40.00',
      '45.00',
      '1000.00'
    ).run();
    
    console.log('✅ Manual Cron trigger completed successfully');
    
    return jsonResponse({
      success: true,
      message: 'Cron logic executed successfully',
      note: 'This is a test endpoint. Actual scraper logic needs to be implemented.',
      timestamp: new Date().toISOString()
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
  additionalHeaders: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...additionalHeaders
    }
  });
}