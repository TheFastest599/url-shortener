# Stage 1: Build React Vite SPA client
FROM node:20-alpine AS client-builder
WORKDIR /app

COPY client/package*.json ./
RUN npm ci

COPY client/ .
RUN npm run build

# Stage 2: Unified Ingress & Frontend Nginx server
FROM nginx:alpine

COPY --from=client-builder /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
