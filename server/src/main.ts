import dotenv from "dotenv"
import fastifyCors  from "@fastify/cors";
import fastifyIO from "fastify-socket.io";
const fastify = require('fastify')
import Redis from 'ioredis';
import closeWithGrace from "close-with-grace";


dotenv.config();
const PORT = parseInt(process.env.PORT || '3001', 10) // base10 , 3001 so that the UI can run on 3000
const HOST = process.env.host || '0.0.0.0' // docker does not know what localhost is 

const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000'
const UPSTASH_REDIS_URL = process.env.REDIS_URL_ENDPOINT;

const CONNECTION_COUNT_KEY = "chat:connection-count";
const CONNECION_COUNT_UPDATED_CHANNEL = 'chat:connection-count-updated'
const NEW_MESSAGE_CHANNEL = "chat:new-message";
 

if(!UPSTASH_REDIS_URL){console.log("missing UPSTASH_REDIS_URL "); process.exit(1)};

// create redis pub/sub
const redis_publisher = new Redis(UPSTASH_REDIS_URL);

const redis_subscriber = new Redis(UPSTASH_REDIS_URL);

interface socketMessage {
    message: string | Buffer
}
let connectedClients = 0;

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

        const currentCount = await redis_publisher.get(CONNECTION_COUNT_KEY); // want to get current connection count incre/decre

        if(!currentCount){
            await redis_publisher.set(CONNECTION_COUNT_KEY, 0)
        }

        

        app.io.on("connection", async (io: { on: (arg0: string, arg1: () => void) => void; }) => {
            console.log('Connected Client')
            const incrClientCount = await redis_publisher.incr(CONNECTION_COUNT_KEY);
            connectedClients++;

            await redis_publisher.publish(CONNECION_COUNT_UPDATED_CHANNEL, String(incrClientCount));

            //listen for messages reuse message channel
            io.on(NEW_MESSAGE_CHANNEL,  () => {
                
            })

            io.on("disconnect",async () =>{
                connectedClients--;
                console.log("Client Disconnected")
                const decrClientCount = await redis_publisher.decr(CONNECTION_COUNT_KEY);
                await redis_publisher.publish(CONNECION_COUNT_UPDATED_CHANNEL, String(decrClientCount));
            })
        })

        redis_subscriber.subscribe(CONNECION_COUNT_UPDATED_CHANNEL,(error, count) =>{

            if(error)
            {
                console.error(`Error subscribing to ${CONNECION_COUNT_UPDATED_CHANNEL}`, error);
                return;
            }
            console.log(`${count} clients connected to ${CONNECION_COUNT_UPDATED_CHANNEL} channel`);
        
        });

        // receive messages and do something 

        redis_subscriber.on('message',(channel, text) => {
            if(channel === CONNECION_COUNT_UPDATED_CHANNEL){

                app.io.emit(CONNECION_COUNT_UPDATED_CHANNEL, {
                    count: text
                })
                return;
            }
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

        closeWithGrace({ delay: 2000}, async () => {
            console.log('Shutting down');
            if(connectedClients > 0){
                console.log(`Removing ${connectedClients} from the count`)
                const currentCount = parseInt(await redis_publisher.get(CONNECTION_COUNT_KEY) || '0', 10);

                const newCount = Math.max(currentCount - connectedClients,0);

                await redis_publisher.set(CONNECTION_COUNT_KEY, newCount);
            }
            // await app.close();
            await app.close();            
            

        });


        console.log(`Server started at http://${HOST}:${PORT}`)

    }catch(e){
        console.log(e);
        process.exit(1);
    }


}

 main();

function async(arg0: { message: number; }): () => void {
    throw new Error("Function not implemented.");
}
