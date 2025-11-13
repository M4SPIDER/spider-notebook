/* ============================================================
   SPIDER AI - TEST VERSION
   ============================================================ */

export async function onRequest(context) {
  const { request } = context;
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  // Simple test endpoint
  if (request.url.includes('/test')) {
    return new Response(JSON.stringify({
      status: 'Worker is running!',
      timestamp: new Date().toISOString(),
      message: 'Spider AI is deployed successfully'
    }), {
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  // Test search endpoint
  if (request.url.includes('/test-search')) {
    const query = new URL(request.url).searchParams.get('q') || 'hello world';
    
    try {
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`;
      const response = await fetch(ddgUrl);
      const data = await response.json();
      
      return new Response(JSON.stringify({
        query: query,
        result: data.AbstractText || 'No abstract found',
        success: true
      }, null, 2), {
        headers: {
          'content-type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error.message,
        success: false
      }), {
        headers: {
          'content-type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }

  // Handle POST requests (main AI functionality)
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const { prompt } = body;
      
      return new Response(JSON.stringify({
        response: `Test response to: ${prompt || 'no prompt'}`,
        success: true
      }), {
        headers: {
          'content-type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Invalid JSON',
        success: false
      }), {
        status: 400,
        headers: {
          'content-type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }

  // Default response
  return new Response(JSON.stringify({
    message: 'Spider AI Worker is running!',
    endpoints: [
      'GET /test - Basic health check',
      'GET /test-search?q=query - Test search',
      'POST / - Main AI endpoint'
    ]
  }), {
    headers: {
      'content-type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
