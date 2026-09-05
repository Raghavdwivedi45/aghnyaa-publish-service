FROM ghcr.io/puppeteer/puppeteer:25.7.0

USER root

WORKDIR /app

RUN chown pptruser:pptruser /app

USER pptruser

ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY --chown=pptruser:pptruser package.json package-lock.json ./

RUN npm ci

COPY --chown=pptruser:pptruser . .

CMD ["npm", "run", "dev"]
