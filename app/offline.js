// This snapshot can only read the example session. There is no network fallback.
window.fetch = async () => new Response(JSON.stringify({error:'This is an example session.'}), {status:405,headers:{'Content-Type':'application/json'}});
window.open = () => null;
window.__showcaseErrors = [];
window.addEventListener('error', e => window.__showcaseErrors.push(e.message));
window.addEventListener('unhandledrejection', e => window.__showcaseErrors.push(String(e.reason)));
