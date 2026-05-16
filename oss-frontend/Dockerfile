# Stage 1: dependencies를 먼저 설치해 builder stage에서 재사용합니다.
# 이렇게 하면 application source만 바뀌고 package metadata가 같을 때
# Docker layer cache를 더 효율적으로 사용할 수 있습니다.
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./

# 현재 프로젝트에는 lockfile이 없으므로 npm install을 사용합니다.
# 나중에 package-lock.json이 추가되면 재현 가능한 설치를 위해 npm ci가 더 적절합니다.
RUN npm install

# Stage 2: Next.js application을 build합니다.
# 이 stage는 deps stage에서 설치한 node_modules를 받아오고,
# 이후 project source 전체를 복사해 standalone output을 생성합니다.
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# production 환경 기준으로 build하여 Next가 최적화된 output을 생성하게 합니다.
ENV NODE_ENV=production

# next.config.ts에서 output: "standalone"을 사용하므로 build 결과로
# - .next/standalone
# - .next/static
# 이 생성됩니다.
# standalone 폴더에는 Next server 실행에 필요한 최소 Node runtime 파일이 들어갑니다.
RUN npm run build

# Stage 3: 최종 runtime image를 만듭니다.
# 이 image에는 standalone server 실행에 필요한 파일만 담기므로,
# source tree 전체를 포함하는 방식보다 production image를 더 작게 유지할 수 있습니다.
FROM node:20-alpine AS runner
WORKDIR /app

# 아래 기본값은 일반적인 container runtime 환경에 맞춘 설정입니다.
# - NODE_ENV=production: Node/Next를 production 모드로 실행합니다.
# - PORT=3000: 이 image가 사용하는 container port와 맞춥니다.
# - HOSTNAME=0.0.0.0: container 외부에서 들어오는 요청도 받을 수 있게 합니다.
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# 더 안전한 container 기본값을 위해 non-root user로 server를 실행합니다.
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# standalone output에는 public assets가 기본 포함되지 않으므로 별도로 복사합니다.
COPY --from=builder /app/public ./public

# next build가 만든 standalone server bundle을 복사합니다.
# 여기에는 server.js와 Next가 추적한 runtime dependencies가 포함됩니다.
COPY --from=builder /app/.next/standalone ./

# Next static assets를 복사해 standalone server가 직접 제공할 수 있게 합니다.
COPY --from=builder /app/.next/static ./.next/static
USER nextjs

# container가 사용하는 runtime port를 명시합니다.
EXPOSE 3000

# Next.js가 생성한 최소 standalone Node server를 실행합니다.
CMD ["node", "server.js"]
