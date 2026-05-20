const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8"
};

http.createServer((request, response) => {
  const safePath = path.normalize(request.url === "/" ? "/index.html" : request.url).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(root, safePath);
  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    response.writeHead(200, { "Content-Type": types[path.extname(filePath)] || "text/plain; charset=utf-8" });
    response.end(data);
  });
}).listen(8080, "127.0.0.1", () => {
  console.log("Library Management System running at http://127.0.0.1:8080");
});
