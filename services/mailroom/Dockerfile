# Build context: Big LWA repository root. Runtime secrets must be injected by host.
FROM node:22-alpine
WORKDIR /app
COPY services/mailroom/package.json ./services/mailroom/package.json
RUN cd services/mailroom && npm install --omit=dev --ignore-scripts --no-audit --no-fund
COPY --chown=node:node --chmod=0555 services/mailroom/ ./services/mailroom/
COPY --chown=node:node --chmod=0555 developer/mailroom/templates.js ./developer/mailroom/templates.js
ENV NODE_ENV=production PORT=8080 MAILROOM_ENABLE_TEST_SEND=false MAILROOM_ENABLE_AUTH_DELIVERY=false
USER node
CMD ["node", "services/mailroom/server.mjs"]
