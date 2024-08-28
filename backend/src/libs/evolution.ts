/*


import { Server as SocketIOServer, Socket } from "socket.io";
import { Server } from "http";
import AppError from "../errors/AppError";
import { logger } from "../utils/logger";
import { userMonitor } from "../queues/userMonitor";
import validateLicense from "../routes/licenseR";
import { io as ClientSocket, Socket as ClientSocketType } from "socket.io-client";

let io: SocketIOServer;

export const initIO0 = (httpServer: Server): SocketIOServer => {
  io = new SocketIOServer(httpServer);

  io.on("connection", async (socket: Socket) => {
    
    logger.info("Client Connected");

    const { userId } = socket.handshake.query as { userId: string };

    // Exemplo de conexão com outro WebSocket
    const externalSocket: ClientSocketType = ClientSocket("wss://evolution.evolvecenter.online/WhatsAppCloud", {
      transports: ['websocket']
    });

    externalSocket.on('connect', () => {
      console.log('Conectado ao WebSocket da Evolution API');
    });

    // Escutando eventos do WebSocket externo
    externalSocket.on('send_message', (data: any) => {
      console.log('Evento recebido:', data);
    });

    socket.emit('send_message', { message: 'Olá, Mundo!' });
    // Neste caso, send_message é o nome do evento, e o objeto { message: 'Olá, Mundo!' } é os dados sendo enviados.

    // Lidando com desconexão do WebSocket externo
    externalSocket.on('disconnect', () => {
      console.log('Desconectado do WebSocket da Evolution API');
    });

    socket.on("joinChatBox", (ticketId: string) => {
      logger.info("A client joined a ticket channel");
      socket.join(ticketId);
    });

    socket.on("joinNotification", () => {
      
      logger.info("A client joined notification channel");
      socket.join("notification");
    });

    socket.on("joinTickets", (status: string) => {
      
      logger.info(`A client joined to ${status} tickets channel.`);
      socket.join(status);
    });

    userMonitor.add(
      "UserConnection",
      { id: userId },
      {
        removeOnComplete: { age: 60 * 60, count: 10 },
        removeOnFail: { age: 60 * 60, count: 10 }
      }
    );
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new AppError("Socket IO not initialized");
  }
  return io;
};
*/