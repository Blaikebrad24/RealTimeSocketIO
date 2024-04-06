import dotenv from "dotenv"
import fastifyCors  from "@fastify/cors";
import fastifyIO from "fastify-socket.io";
const fastify = require("fastify");
import Redis from 'ioredis';

dotenv.config();
 const PORT = parseInt(process.env.PORT || '3001', 10) // base10 , 3001 so that the UI can run on 3000
 const HOST = process.env.host || '0.0.0.0' // docker does not know what localhost is 

 const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000'
 const UPSTASH_REDIS_URL = process.env.REDIS_URL_ENDPOINT;

 const CONNECTION_COUNT_CHANNEL = "chat:connection-count";
 

if(!UPSTASH_REDIS_URL){console.log("missing UPSTASH_REDIS_URL "); process.exit(1)};
const redis_publisher = new Redis(UPSTASH_REDIS_URL, {
    tls: {
        rejectUnauthorized: true
    }
});

const redis_subscriber = new Redis(UPSTASH_REDIS_URL);
 /*
 buildServer() function - builds the endpoints and installs plugins
 */
async function buildServer(){

const app = fastify();

// register CORS PLUGIN
await app.register(fastifyCors, {
    origin: CORS_ORIGIN,
});

await app.register(fastifyIO); // websockets

app.io.on("connection", (io: { on: (arg0: string, arg1: () => void) => void; }) => {
    console.log('Client connected');

    io.on("disconnect", () =>{
        console.log("Client Disconnected")
    })
})

// add healthcheck endpoint to make sure responding to request
// maintains endpoints here
    app.get("/healthcheck", () =>{
        return{
            status: "ok",
            port: PORT,
        };
    });


    return app;
 }

 async function main(){
    const app = await buildServer(); // returns promise
    
    try{

        await app.listen({
            port: PORT,
            host: HOST,
        });
        console.log(`Server started at http://${HOST}:${PORT}`)

    }catch(e){
        console.log(e);
        process.exit(1);
    }


}

 main();