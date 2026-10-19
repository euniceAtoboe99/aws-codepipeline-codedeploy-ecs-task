FROM node:20-alpine
WORKDIR /app
COPY package.json app.js ./
ENV PORT=8080
EXPOSE 8080
USER node
CMD ["npm", "start"]
