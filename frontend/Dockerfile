# Dev-oriented image so `docker compose up` runs the whole product in one command.
# Deps are baked in (npm ci) for a reliable, network-light startup. For active
# frontend development with hot-reload, run `npm run dev` on the host instead.
FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 5173

# Bind to 0.0.0.0 so the dev server is reachable from the host via the mapped port.
# /api is proxied to the backend (VITE_PROXY_TARGET, set in docker-compose).
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
