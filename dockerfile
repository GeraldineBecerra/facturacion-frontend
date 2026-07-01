# ===== STAGE 1: BUILD ANGULAR =====
FROM node:20 AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx ng build --configuration production

# ===== STAGE 2: NGINX SERVER =====
FROM nginx:alpine

# CORREGIR ESTA LÍNEA
COPY --from=build /app/dist/facturacion-frontend/browser/ /usr/share/nginx/html/

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80