FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_API_URL=/api
ARG VITE_AUTH_API_URL=/auth-api
ARG REACT_APP_API_URL=/api

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_AUTH_API_URL=$VITE_AUTH_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

COPY package*.json /app/
RUN npm install

COPY . /app
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
