FROM node:20-alpine

WORKDIR /app

ENV NODE_OPTIONS="--max-old-space-size=512"

COPY . .

EXPOSE 5173

CMD ["sh", "-c", "npm install --prefer-offline && npm run dev -- --host 0.0.0.0"]
