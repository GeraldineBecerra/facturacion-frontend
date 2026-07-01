# Build stage
FROM node:20 AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build --configuration production


# Serve stage
FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Copia build de Angular (IMPORTANTE el path correcto)
COPY --from=build /app/dist/ ./

# Config nginx para SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]