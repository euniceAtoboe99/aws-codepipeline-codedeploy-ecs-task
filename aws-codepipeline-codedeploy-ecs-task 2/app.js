const http = require("http");
const port = Number(process.env.PORT || 8080);

http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "text/plain" });
    return res.end("ok");
  }
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AWS DevSecOps Demo</title><style>body{font:18px system-ui,sans-serif;margin:4rem auto;max-width:720px;padding:0 1rem;color:#172033}main{border-left:5px solid #ff9900;padding:1rem 1.5rem;background:#f5f7fa}code{color:#075985}</style></head><body><main><h1>It works!</h1><p>This container is running on <strong>Amazon ECS with AWS Fargate</strong>.</p><p>CodePipeline builds the image, and CodeDeploy performs the ECS blue/green deployment.</p><p>Health check: <code>/health</code></p></main></body></html>`);
}).listen(port, "0.0.0.0", () => console.log(`Demo app listening on port ${port}`));
