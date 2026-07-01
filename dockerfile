# ===== STAGE 1: BUILD ANGULAR =====
FROM node:20 AS build

WORKDIR /app

# Copiar dependencias
COPY package*.json ./
RUN npm install

# Copiar código fuente
COPY . .

# Build correcto Angular
RUN npx ng build --configuration production


# ===== STAGE 2: NGINX SERVER =====
FROM nginx:alpine

# Copiar build generado de Angular
COPY --from=build /app/dist/ /usr/share/nginx/html

# Configuración SPA (routing Angular)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]