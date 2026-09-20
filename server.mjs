// Üretilen statik dosyaları sunan küçük sunucu (bağımlılık yok).
// Railway PORT'u ortam değişkeniyle verir; tüm arayüzlerden dinlenir.
// Tek sayfa uygulaması olduğu için bilinmeyen yollar index.html'e düşer.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), "ihale-modulu", "dist");
const PORT = Number(process.env.PORT) || 8080;

const TUR = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".map": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".pdf": "application/pdf",
};

const gonder = (res, kod, govde, basliklar = {}) => {
  res.writeHead(kod, { "X-Content-Type-Options": "nosniff", ...basliklar });
  res.end(govde);
};

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") return gonder(res, 405, "Method Not Allowed");

  // Sağlık kontrolü: Railway/izleme için sabit bir uç.
  if (req.url === "/healthz") return gonder(res, 200, "ok", { "Content-Type": "text/plain" });

  let yol;
  try {
    yol = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch {
    return gonder(res, 400, "Bad Request");
  }

  // Dizin dışına çıkma denemelerini engelle.
  const dosya = path.join(KOK, path.normalize(yol));
  if (!dosya.startsWith(KOK)) return gonder(res, 403, "Forbidden");

  const bas = (p, cacheLong) => {
    const uzanti = path.extname(p).toLowerCase();
    fs.readFile(p, (err, veri) => {
      if (err) return sayfa404(res);
      gonder(res, 200, req.method === "HEAD" ? "" : veri, {
        "Content-Type": TUR[uzanti] || "application/octet-stream",
        "Cache-Control": cacheLong ? "public, max-age=31536000, immutable" : "no-cache",
      });
    });
  };

  fs.stat(dosya, (err, st) => {
    if (!err && st.isFile()) return bas(dosya, yol.startsWith("/assets/"));
    if (!err && st.isDirectory()) return bas(path.join(dosya, "index.html"), false);
    // SPA geri dönüşü: uzantısı olmayan yollar uygulamanın kendi yönlendiricisine bırakılır.
    if (!path.extname(yol)) return bas(path.join(KOK, "index.html"), false);
    sayfa404(res);
  });
});

function sayfa404(res) {
  gonder(res, 404, "Not Found", { "Content-Type": "text/plain; charset=utf-8" });
}

server.listen(PORT, "0.0.0.0", () => {
  console.log(`ihale-modulu yayında → http://0.0.0.0:${PORT} (kök: ${KOK})`);
});
