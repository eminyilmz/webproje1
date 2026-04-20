FROM node:20-slim
WORKDIR /app

# Install dependencies first (cached layer)
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# Source code is mounted via docker-compose volume
# so we don't COPY . . here — dev mode uses live files

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["npm", "run", "dev"]
