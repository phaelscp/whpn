import axios from "axios";
import * as Sentry from "@sentry/node";
import { v4 as uuidv4 } from 'uuid'; // Importando a biblioteca para gerar UUIDs
import AppError from "../../errors/AppError";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import Whatsapp from "../../models/Whatsapp";
import formatBody from "../../helpers/Mustache";
import CreateMessageService from "../MessageServices/CreateMessageService";

interface Request {
  body: string;
  ticket: Ticket;
}

export const sendFacebookMessage = async ({
  body,
  ticket,
}: Request): Promise<any> => {
  const whatsapp = await Whatsapp.findByPk(ticket.whatsappId);

  if (!whatsapp) {
    throw new AppError("ERR_WAPP_NOT_FOUND");
  }

  let options: any = {};
  const number = `${ticket.contact.number}@${
    ticket.isGroup ? "g.us" : "s.whatsapp.net"
  }`;
  let quotedText = body; // Inicia com o corpo recebido como padrão

  // Verifica se há uma mensagem citada para substituir
  if (quotedText) {
    try {
      // Procura pela mensagem no banco de dados com base no corpo recebido
      const chatMessage = await Message.findOne({ where: { body: quotedText } });

      // Aqui não estamos analisando o JSON do body, mas sim verificando se o body existe na base de dados
      if (chatMessage) {
        quotedText = chatMessage.body; // Substitui pelo corpo da mensagem encontrada
      }
    } catch (error) {
      console.error("Erro ao buscar mensagem citada:", error);
      // Trate o erro conforme necessário, por exemplo, lançando uma exceção ou lidando de outra forma
    }
  }

  const formattedBody = formatBody(quotedText, ticket); // Formata o corpo da mensagem a ser enviado
  const payload = {
    messaging_product: "whatsapp",
    to: number,
    type: "text",
    text: {
      body: formattedBody
    },
    ...options
  };

  try {
    const { data } = await axios.post(
      `https://graph.facebook.com/v19.0/${whatsapp.idZap}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${whatsapp.tokenZap}`
        }
      }
    );

    // Atualiza o ticket com a última mensagem enviada e marca como enviada pelo sistema
    try {
      const messageData = {
        id: uuidv4(), // Gerando um UUID para a mensagem
        body: formattedBody,
        fromMe: true,
        ticketId: ticket.id,
        contactId: ticket.contact.id,
        read: true,
        dataJson: JSON.stringify(payload)
      };

      await CreateMessageService({ messageData, companyId: ticket.companyId });
      await ticket.update({ lastMessage: formattedBody });
      console.log("Ticket updated successfully.");
    } catch (updateError) {
      console.error("Error updating ticket:", updateError);
    }

    return data;
  } catch (error) {
    Sentry.captureException(error);
    console.error("Erro ao enviar mensagem:", error);
    throw new AppError("ERR_SENDING_WPP_MSG");
  }
};

// Função para analisar logs de envio de mensagens
export const analyzeWebhookMessage = (log: string) => {
  try {
    const parsedLog = JSON.parse(log);
    if (parsedLog.object === "whatsapp") {
      parsedLog.entry.forEach(entry => {
        entry.changes.forEach(change => {
          if (change.field === "messages") {
            const value = change.value;
            value.statuses.forEach(status => {
              console.log(`Status: ${status.status}`);
              console.log(`Timestamp: ${status.timestamp}`);
              console.log(`Recipient ID: ${status.recipient_id}`);
              if (status.conversation) {
                console.log(`Conversation ID: ${status.conversation.id}`);
              }
              if (status.pricing) {
                console.log(`Pricing Model: ${status.pricing.pricing_model}`);
                console.log(`Category: ${status.pricing.category}`);
              }
            });
          }
        });
      });
    }
  } catch (error) {
    console.error("Erro ao analisar log de webhook:", error);
  }
};

export default sendFacebookMessage;
