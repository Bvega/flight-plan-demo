/**
 * Minimal static server + LAN sync for the Flight Plan demo kit.
 *
 * Usage:
 *   node server.js
 * Then open:
 *   http://localhost:8000/#/presenter
 *
 * Cross-device sync (laptop -> phone):
 * - GET  /api/state   -> current state JSON (in-memory)
 * - POST /api/state   -> replace state JSON (in-memory) and broadcast
 * - GET  /api/stream  -> Server-Sent Events stream of state updates
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8000;
const ROOT = __dirname;

const mime = {
  ".html":"text/html; charset=utf-8",
  ".css":"text/css; charset=utf-8",
  ".js":"application/javascript; charset=utf-8",
  ".png":"image/png",
  ".webmanifest":"application/manifest+json; charset=utf-8",
  ".json":"application/json; charset=utf-8",
};

function safeJoin(base, target){
  const targetPath = "." + target.replace(/\\/g,"/");
  const resolved = path.resolve(base, targetPath);
  if(!resolved.startsWith(base)) return null;
  return resolved;
}

let state = null;
const sseClients = new Set();

function sendSse(res, payload){
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}
function broadcastState(){
  const payload = { type:"state", state: state || {}, ts: Date.now() };
  for(const res of sseClients){
    try { sendSse(res, payload); } catch(e){}
  }
}
function readJsonBody(req, cb){
  let raw = "";
  req.on("data", chunk => { raw += chunk; if(raw.length > 2e6) req.destroy(); });
  req.on("end", () => {
    try{ cb(null, raw ? JSON.parse(raw) : null); } catch(e){ cb(e); }
  });
}

const server = http.createServer((req,res)=>{
  const url = req.url.split("?")[0];

  if(url === "/api/state" && req.method === "GET"){
    res.writeHead(200, {"Content-Type":"application/json; charset=utf-8", "Cache-Control":"no-store"});
    res.end(JSON.stringify(state || {}));
    return;
  }
  if(url === "/api/state" && req.method === "POST"){
    readJsonBody(req, (err, obj)=>{
      if(err || !obj){
        res.writeHead(400, {"Content-Type":"application/json; charset=utf-8"});
        res.end(JSON.stringify({ ok:false, error:"Invalid JSON" }));
        return;
      }
      state = obj;
      broadcastState();
      res.writeHead(200, {"Content-Type":"application/json; charset=utf-8"});
      res.end(JSON.stringify({ ok:true }));
    });
    return;
  }
  if(url === "/api/stream" && req.method === "GET"){
    res.writeHead(200, {
      "Content-Type":"text/event-stream",
      "Cache-Control":"no-cache",
      "Connection":"keep-alive"
    });
    res.write("\n");
    sseClients.add(res);
    sendSse(res, { type:"state", state: state || {}, ts: Date.now() });
    req.on("close", ()=>{ sseClients.delete(res); });
    return;
  }

  const filePath = url === "/" ? "/index.html" : url;
  const full = safeJoin(ROOT, filePath);
  if(!full){ res.writeHead(403); res.end("Forbidden"); return; }

  fs.stat(full,(err,stat)=>{
    if(err || !stat.isFile()){
      const indexPath = path.join(ROOT, "index.html");
      fs.readFile(indexPath,(e,data)=>{
        if(e){ res.writeHead(404); res.end("Not found"); return; }
        res.writeHead(200, {"Content-Type": mime[".html"], "Cache-Control":"no-store"});
        res.end(data);
      });
      return;
    }
    const ext = path.extname(full).toLowerCase();
    const type = mime[ext] || "application/octet-stream";
    fs.readFile(full,(e,data)=>{
      if(e){ res.writeHead(500); res.end("Server error"); return; }
      res.writeHead(200, {"Content-Type": type, "Cache-Control":"no-store"});
      res.end(data);
    });
  });
});

server.listen(PORT, "0.0.0.0", ()=>{
  console.log(`Flight Plan demo running on http://localhost:${PORT}`);
  console.log(`LAN sync enabled: /api/state and /api/stream`);
});