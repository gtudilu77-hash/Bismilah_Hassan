# Imagem Node leve, com ffmpeg instalado para /api/transcribe e /api/analyze-video
FROM node:20-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia só os manifestos primeiro para tirar partido da cache do Docker
COPY package*.json ./
RUN npm install --omit=dev

# Copia o resto do código
COPY . .

ENV NODE_ENV=production

# Documentativo — o Render injeta a porta real via $PORT em runtime,
# e o teu server.js já lê process.env.PORT
EXPOSE 3001

# Ajusta o nome do ficheiro se o teu entrypoint não se chamar server.js
CMD ["node", "server.js"]