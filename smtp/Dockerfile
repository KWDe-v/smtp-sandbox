FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++

RUN npm install -g Haraka

# Inicializa configuração padrão completa do Haraka
RUN haraka -i /app

# Sobrescreve com nossos plugins e configurações
COPY config/plugins /app/config/plugins
COPY config/smtp.ini /app/config/smtp.ini
COPY plugins/ /app/plugins/

EXPOSE 25 587

CMD ["haraka", "-c", "/app"]
