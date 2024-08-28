import Ticket from "../../models/Ticket";
import Contact from "../../models/Contact";
import Message from "../../models/Message";
import { Store } from "../../libs/store";
import Queue from "../../models/Queue";
import { getBodyMessage, verifyMessage } from "../WbotServices/wbotMessageListener";
import Prompt from "../../models/Prompt";
import AppError from "../../errors/AppError";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import sendFacebookMessage from "../FacebookServices/sendFacebookMessage";

import {
    proto,
    WASocket,
} from "@whiskeysockets/baileys";
import QueueIntegrations from "../../models/QueueIntegrations";
import { createClient } from 'redis'; // Importar createClient do 'redis'
import axios, { AxiosResponse } from 'axios';
import * as path from 'path'; // Importar path do Node.js
import * as fs from 'fs'; // Importar fs do Node.js
//import HandlePromptGeminiService from "./HandlePromptGeminiService";
import { publicFolder } from "../../config/upload";

type Session = WASocket & {
    id?: number;
    store?: Store;
};
type GenericObject = { [key: string]: any };

const sanitizeName = (name: string): string | null => {
    // Extrai a primeira palavra e remove caracteres não alfanuméricos
    let sanitized = name.split(" ")[0].replace(/[^a-zA-Z0-9]/g, "");

    // Limita o tamanho da string sanitizada a 60 caracteres
    sanitized = sanitized.substring(0, 60);

    // Verifica se a string sanitizada é composta apenas por dígitos
    if (/^\d+$/.test(sanitized)) {
        return null;  // Retorna null se o nome contém apenas números
    }

    return sanitized;
};

const execIntegration = async (
    prompt: Prompt,
    name: string,
    args,
    waid,
    companyId
): Promise<any> => {
    if (prompt.queueIntegrationId) {
        const config = {
            headers: {
                // Define o Content-Type como application/json
                'Content-Type': 'application/json'
            }
        };
        args.functionName = name;
        args.waid = waid;
        args.companyId = companyId;

        const qI: QueueIntegrations = await QueueIntegrations.findByPk(prompt.queueIntegrationId);
        try {
            const response: AxiosResponse = await axios.post(qI.urlN8N, args, config);
            return response.data;
        } catch (error) {
            console.error('Algo deu errado na requisição:', error);
            return { status: false, message: "Ocorreu um erro ao chamar a integração" };
        }
    } else {
        return { status: false, message: "Integração não encontrada" };
    }
};

const LoadMessagesService = async (
    ticket: Ticket,
    prompt: Prompt,
    contact: Contact
): Promise<any[]> => {
    let messagesOpenAi: any[] = [];
    const client = createClient({
        url: process.env.REDIS_URI
    });

    try {
        await client.connect(); // Conectar ao cliente Redis
        const cache = await client.get(ticket.uuid);
        if (cache) {
            messagesOpenAi = JSON.parse(cache);
            await client.disconnect(); // Desconectar do cliente Redis
        } else {
            var messages = await Message.findAll({
                where: { ticketId: ticket.id },
                order: [["createdAt", "DESC"]],
                limit: 20
            });

            // BOTA TUDO EM ORDEM
            messages = messages.reverse();

            const sanitizedName = sanitizeName(contact.name);
            let promptSystem;
            if (sanitizedName === null) {
                promptSystem = `${getDataAtualFormatada()}\nAo iniciar o atendimento, peça para que o cliente informe o seu nome\n`;
            } else {
                promptSystem = `${getDataAtualFormatada()}\nNas respostas utilize o nome ${sanitizeName(
                    contact.name || "Amigo(a)"
                )} para identificar o cliente.\n`;
            }
            promptSystem = `${promptSystem}\n${prompt.prompt}\n`;

            messagesOpenAi = [];

            for (let i = 0; i < messages.length; i++) {
                if (i > 20)
                    break;
                const message = messages[i];
                if (message.mediaType === "conversation" || message.mediaType === "extendedTextMessage") {
                    if (message.fromMe) {

                    } else {

                    }
                }
            }
        }
    } catch (e) {
        console.log(e);
    }
    return messagesOpenAi;
};

const HandlePromptService = async (
    msg: proto.IWebMessageInfo,
    wbot: Session,
    ticket: Ticket,
    contact: Contact,
    mediaSent: Message | undefined,
    channel?: string,
    message?: any
): Promise<void> => {
    console.log("Chamou o o OpenAi");
    const whatsAppId = ticket.whatsappId;

    if (!channel && !wbot.id)
        return;

    // SE O TICKET TIVER UMA FILA, NAO RODA NA IA
    // if (ticket?.queue)
    //  return;

    let bodyMessage;
    if (!channel) {
        bodyMessage = getBodyMessage(msg);
    } else {
        // console.log("CONTEUDO DE MESSAGE", message);
        bodyMessage = message.text;
    }

    // if (!bodyMessage) return;

    if (!prompt) return;
    // SE A CHAVE NAO FOR DA OPENAI É GEMINI
    // if (!prompt.apiKey.startsWith("sk-"))
    //return HandlePromptGeminiService(msg, wbot, ticket, contact, mediaSent, channel);

    if (!channel) {
        if (msg.messageStubType) return;
    }
    const publicFolder: string = path.resolve(
        __dirname,
        "..",
        "..",
        "..",
        "public"
    );

    // SE FOR AUDIO, CONVERTER PARA TEXTO
    if (msg?.message?.audioMessage || message?.attachments || message?.audioMessage3) {
        let fileName;
        if (channel) {
            const messageRow = await Message.findByPk(message.id);
            // fileName = messageRow.mediaUrl.split("/").pop();
        } else {
            fileName = mediaSent!.mediaUrl.split("/").pop();
        }
        console.log("MEDIA FILE NAME", fileName);
        const file = fs.createReadStream(`${publicFolder}/${fileName}`) as any;


        // SE O TICKET ESTIVER ABERTO, NOS VAMOS USAR A FUNCAO DE AUDIO PARA TEXTO ACIMA
        // MAS A IA NÃO DEVE RESPONDER AO CLIENTE
        if (ticket.status === "open") return;

        const response = '9';
        // console.log("RESPONSE:", response);

        // await SaveMessagesRedis(ticket);

        if (!channel) {
            const sentMessage = await wbot.sendMessage(msg.key.remoteJid!, {
                text: response!
            });

            await verifyMessage(sentMessage!, ticket, contact);
        } else {
            sendFacebookMessage({ body: response, ticket });
        }
    }
};

const HandlePromptService1 = async (
  msg: any, // Assuming msg is an object containing message details
  ticket: any, // Assuming ticket is an object containing ticket details
  contact: any, // Assuming contact is an object containing contact details
  mediaSent: any, // Assuming mediaSent is an object containing media details
  channel: boolean, // Assuming channel is a boolean indicating the channel type
  wbot: any // Assuming wbot is an object containing WhatsApp bot instance
) => {
  if (msg?.message?.audioMessage || msg?.attachments || msg?.audioMessage3) {
    let fileName;
    if (channel) {
      const messageRow = await Message.findByPk(msg.id);
      if (messageRow) {
        fileName = messageRow.mediaUrl.split("/").pop();
      }
    } else {
      if (mediaSent && mediaSent.mediaUrl) {
        fileName = mediaSent.mediaUrl.split("/").pop();
      }
    }
    if (!fileName) {
      console.error("File name not found for media");
      return;
    }

    console.log("MEDIA FILE NAME", fileName);
    const filePath = `${publicFolder}/${fileName}`;
    const file = fs.createReadStream(filePath);

    // If the ticket is open, convert audio to text but do not respond to the client
    if (ticket.status === "open") return;

    const response = '9';
    // console.log("RESPONSE:", response);

    // await SaveMessagesRedis(ticket); // Assuming this is a function to save messages to Redis

    if (!channel) {
      sendFacebookMessage({ body: response, ticket });
      const sentMessage = await wbot.sendMessage(msg.key.remoteJid!, {
        text: response
      });

      if (sentMessage) {
        await verifyMessage(sentMessage, ticket, contact);
        sendFacebookMessage({ body: response, ticket });
      }
    } else {
      sendFacebookMessage({ body: response, ticket });
    }
  }
};
export default HandlePromptService1;



//export default HandlePromptService;
function getDataAtualFormatada() {
  throw new Error("Function not implemented.");
}

