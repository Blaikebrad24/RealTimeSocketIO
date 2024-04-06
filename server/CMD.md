### SERVER ###
    
    npm install -g pnpm  *-> installs pnpm globally
    pnpm add fastify fastify-socket.io ioredis close-with-grace dotenv socket.io @fastify/cors *-> installs all packages

    pnpm add @types/node tsx typescript @types/ws -D *-> installs as Dev dependencies 
    pnpm tsc --init *-> creates typescript config file

### UI ###

    pnpm create next-app ui *-> creates NextJS app called UI
    pnpm add socket.io-client *-> install client side socket io 
    pnpm add @types/ws -D *-> install types as dev dependencies 
    npx shadcn-ui@latest init *-> installs shadcn-ui for UI Components
    npx shadcn-ui@latest add textarea buttom form *-> install components from shadcn