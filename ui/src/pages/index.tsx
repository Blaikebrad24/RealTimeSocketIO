import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormEvent, useEffect, useState } from "react";
import io, { Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://localhost:3001' // caddy is listening on this URL
const CONNECION_COUNT_UPDATED_CHANNEL = 'chat:connection-count-updated'
const NEW_MESSAGE_CHANNEL = "chat:new-message";


type Message = {
  message: string;
  id: string;
  createdAt: string;
  port: string;
};


// define custom hook
function useSocket(){
  const [socket, setSocket] = useState<Socket | null>(null);




useEffect(() =>{
  const socketIO = io(SOCKET_URL, {
    reconnection: true,
    upgrade: true,
    transports: ["websocket", "polling"],
  });
 setSocket(socketIO);

 // callback function
 return function(){
  socketIO. disconnect(); // when unmount it will disconnect
 }
}, [])


  return socket;
}


export default function Home() {
  
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Array<Message>>([])
  const socket = useSocket();
  

  useEffect(() => {
    socket?.on("connect", () =>{
      console.log("Connected to socket")
    })

    socket?.on(NEW_MESSAGE_CHANNEL,(message : Message) => {

      setMessages((prevMessages) => [...prevMessages,message ] ) // return new array spread prevMessages with new msgs
    })
  })

  function handleSubmit(e: FormEvent){
    e.preventDefault(); // default behavior is submitting to a URL when the form is refreshed

    socket?.emit(NEW_MESSAGE_CHANNEL, {
      message: newMessage,
    })
    
    setNewMessage(""); // reset when you submit
  }

  return (

    
    <main className=" flex flex-col p-4 w-full max-w-3xl m-auto">

    <ol>
      {messages.map((m) => {
        return( 
        <li key={m.id}>
              <p className="text-small text-gray-500">{m.createdAt}</p>
              <p className="text-small text-gray-500">{m.port}</p>
              <p>{m.message}</p>
        </li>)
      })}
    </ol>

    <form onSubmit={handleSubmit} className=" flex items-center" >

      <Textarea 
      className=" rounded-lg mr-4"
      placeholder="Tell us what's on your mind" 
      value={newMessage}
      onChange={(e) => setNewMessage(e.target.value)}
      maxLength={255}
      
      />
    <Button className=" h-full">
      Send Message
    </Button>
    </form>



    </main>
  );
}
