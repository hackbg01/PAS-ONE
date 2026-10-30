// PAS-One Cloudflare Worker API gateway
// Worker Settings > Variables: GAS_WEB_APP_URL, ALLOWED_ORIGIN
const cors = (origin, allowed) => ({
  'Access-Control-Allow-Origin': origin === allowed ? allowed : 'null',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
  'Vary': 'Origin'
});
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = env.ALLOWED_ORIGIN || '';
    const headers = cors(origin, allowed);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (origin && allowed && origin !== allowed) return new Response(JSON.stringify({success:false,error:'Origin tidak diizinkan'}), {status:403,headers:{...headers,'Content-Type':'application/json'}});
    if (!env.GAS_WEB_APP_URL) return new Response(JSON.stringify({success:false,error:'GAS_WEB_APP_URL belum diatur'}), {status:500,headers:{...headers,'Content-Type':'application/json'}});
    if (request.method === 'GET') return new Response(JSON.stringify({success:true,service:'PAS-One API Gateway',status:'online'}), {headers:{...headers,'Content-Type':'application/json'}});
    try {
      const incoming = await request.json();
      const endpoint = String(incoming.endpoint || '').trim();
      if (!endpoint || endpoint.includes('..')) throw new Error('Endpoint tidak valid');
      const payload = incoming.payload && typeof incoming.payload === 'object' ? incoming.payload : {};
      const token = String(payload.token || '');
      const gasUrl = new URL(env.GAS_WEB_APP_URL);
      gasUrl.searchParams.set('endpoint', endpoint);
      if (token) gasUrl.searchParams.set('token', token);
      delete payload.token;
      const upstream = await fetch(gasUrl.toString(), {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),redirect:'follow'});
      const body = await upstream.text();
      let parsed; try { parsed = JSON.parse(body); } catch { parsed = {success:false,error:'Respons backend bukan JSON',detail:body.slice(0,300)}; }
      return new Response(JSON.stringify(parsed), {status:upstream.ok ? 200 : upstream.status,headers:{...headers,'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
    } catch (err) {
      return new Response(JSON.stringify({success:false,error:err.message || 'Gateway error'}), {status:400,headers:{...headers,'Content-Type':'application/json'}});
    }
  }
};
