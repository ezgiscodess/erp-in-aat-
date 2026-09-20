# Railway derlemesi: uygulama alt klasörde (ihale-modulu) olduğu için Nixpacks otomatik
# algılayamıyordu. Dockerfile ile hem Node sürümü hem derleme adımları sabitlenir.
# Vite 8, Node 20.19+ ister; burada 22 kullanılıyor.
FROM node:22-alpine AS build
WORKDIR /app/ihale-modulu
# Önce yalnızca bağımlılık dosyaları: kaynak değişince npm ci yeniden çalışmasın.
COPY ihale-modulu/package.json ihale-modulu/package-lock.json ./
RUN npm ci
COPY ihale-modulu/ ./
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Yalnızca üretilen dosyalar ve küçük statik sunucu taşınır (bağımlılık yok).
COPY --from=build /app/ihale-modulu/dist ./ihale-modulu/dist
COPY server.mjs ./server.mjs
EXPOSE 8080
CMD ["node", "server.mjs"]
