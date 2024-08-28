import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import Contact from '../../models/Contact';
import Ticket from '../../models/Ticket';
import CreateOrUpdateContactService from '../ContactServices/CreateOrUpdateContactService';
import CreateMessageService from '../MessageServices/CreateMessageService';
import FindOrCreateTicketService from '../TicketServices/FindOrCreateTicketService';
import ShowWhatsAppService from '../WhatsappService/ShowWhatsAppService';
import UpdateTicketService from '../TicketServices/UpdateTicketService';
import formatBody from '../../helpers/Mustache';
import Queue from '../../models/Queue';
import Chatbot from '../../models/Chatbot';
import { getIO } from '../../libs/socket';
import FindOrCreateATicketTrakingService from '../TicketServices/FindOrCreateATicketTrakingService';
import sequelize from 'sequelize';
import AppError from '../../errors/AppError';
import moment from 'moment';
import UserRating from '../../models/UserRating';
import { isNil, isNull } from 'lodash';
import TicketTraking from '../../models/TicketTraking';
import Message from '../../models/Message';

const bot = new TelegramBot('6811256634:AAEDSWHRvanifDQCeEwsN1AmNLeJLceJvzY');

const webhookUrl = 'https://facebook.evolvecenter.online/telegram/webhook'; // Substitua pela URL do seu webhook

bot.setWebHook(webhookUrl)
    .then(() => {
        console.log(`Webhook set to ${webhookUrl}`);
    })
    .catch(err => {
        console.error('Error setting webhook:', err);
    });
let userState = {};

export const receiveMessage = async (msg) => {
    console.log('Mensagem recebida:', msg);

    if (msg && msg.message && msg.message.chat && msg.message.chat.id && msg.message.text) {
        const { chat: { id }, text } = msg.message;
        console.log(`Mensagem recebida no chat ${id}: ${text}`);

        // Obtenha a foto do perfil do usuário
        let profilePicUrl = "";
        try {
            const photos = await bot.getUserProfilePhotos(msg.message.from.id);
            if (photos.total_count > 0) {
                const fileId = photos.photos[0][0].file_id;
                const file = await bot.getFile(fileId);
                profilePicUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
            }
        } catch (error) {
            console.error("Erro ao obter a foto do perfil:", error);
        }

            const contactData = {
            name: `${msg.message.from?.first_name || ''} ${msg.message.from?.last_name || ''}`.trim(),
            number: id.toString(),
            profilePicUrl: profilePicUrl,
            isGroup: false,
            companyId: 1,
            channel: 'telegram'
        };

        const contact = await verifyContact(contactData, 'telegram', 1);
        if (!contact) return;

        const ticket = await FindOrCreateTicketService(contact, 1, 0, 1);
        if (!ticket) return;

        if (text) {
            await verifyMessage(msg.message, text, ticket, contact);
        }

        if (msg.message.photo || msg.message.document) {
            await verifyMessageMedia(msg.message, ticket, contact);
        }

        if (text === "#") {
            userState[id] = undefined;
            await sendMessageToTelegramChat(id, "Você saiu do chatbot.");
            return;
        }

        if (!userState[id]) {
            userState[id] = { step: 0 };
            const queues = await Queue.findAll();
            if (queues.length > 0) {
                const queueOptions = queues.map((queue, index) => `[ ${index + 1} ] ${queue.name}`).join("\n");
                await sendMessageToTelegramChat(id, `Escolha uma das seguintes filas:\n${queueOptions}`);
                userState[id].queues = queues;
            } else {
                await sendMessageToTelegramChat(id, "Não foram encontradas filas no banco de dados.");
            }
            return;
        }

        const state = userState[id];
        if (state.step === 0) {
            const selectedQueueIndex = parseInt(text?.trim() || '');

            if (!isNaN(selectedQueueIndex) && selectedQueueIndex > 0 && selectedQueueIndex <= state.queues.length) {
                const selectedQueue = state.queues[selectedQueueIndex - 1];
                // await continueQueueFlow(id, selectedQueue);
            } else {
                await sendMessageToTelegramChat(id, 'Escolha inválida. Por favor, escolha uma das filas listadas.');
            }
        } else {
            // Lógica para continuar o fluxo após a seleção da fila
        }
    } else {
        console.error('Mensagem recebida inválida:', msg);
    }
};

const verifyContact = async (msgContact, channel, companyId) => {
    if (!msgContact) return null;
    const contactData = {
                        name: msgContact.name,
                        number: msgContact.number,
                        chatId: msgContact.number,
                        profilePicUrl: msgContact.profilePicUrl,
                        isGroup: msgContact.isGroup,
                        companyId: companyId,
                        channel: 'telegram'
    };
    const contact = await CreateOrUpdateContactService(contactData);
    return contact;
};

const verifyMessage = async (msg, body, ticket, contact) => {
    try {
        const quotedMsg = await verifyQuotedMessage(msg);
        const messageData = {
            id: msg.message_id.toString(),
            ticketId: ticket.id,
            contactId: contact.id,
            body: msg.text || body,
            quotedMsgId: quotedMsg?.id,
            fromMe: false,
            read: true,
            ack: 3,
            dataJson: JSON.stringify(msg)
        };

        // Verifica se msg.text está definido antes de usar
        const messageText = msg.text || body;

        // Chama o serviço para criar a mensagem
        await CreateMessageService({ messageData, companyId: ticket.companyId });

        // Atualiza o ticket com a última mensagem
        await ticket.update({ lastMessage: messageText });

    } catch (error) {
        // Trate o erro aqui
        console.error('Erro ao processar mensagem:', error);
        // Lançar ou retornar um erro pode ser necessário dependendo do fluxo da aplicação
        throw error;
    }
};



const verifyMessageMedia = async (msg, ticket, contact) => {
    let fileId;
    let fileName;
    if (msg.photo) {
        fileId = msg.photo[msg.photo.length - 1].file_id;
        fileName = `${msg.photo[msg.photo.length - 1].file_id}.jpg`;
    } else if (msg.document) {
        fileId = msg.document.file_id;
        fileName = msg.document.file_name;
    }

    if (!fileId) return;

    const file = await bot.getFile(fileId);
    const url = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
    const { data } = await axios.get(url, { responseType: 'arraybuffer' });

    const folder = `./public/company${ticket.companyId}`;
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
        fs.chmodSync(folder, 0o777);
    }
    writeFileSync(path.join(folder, fileName), data, 'base64');

    const messageData = {
        id: msg.message_id.toString(),
        ticketId: ticket.id,
        contactId: contact.id,
        body: fileName,
        fromMe: false,
        mediaType: msg.photo ? 'image' : 'document',
        mediaUrl: fileName,
        read: true,
        quotedMsgId: null,
        ack: 3,
        dataJson: JSON.stringify(msg)
    };

    await CreateMessageService({ messageData, companyId: ticket.companyId });
    await ticket.update({ lastMessage: msg.caption || fileName });
};

const verifyQuotedMessage = async (msg) => {
    if (!msg) return null;
    const quoted = msg?.reply_to_message?.message_id.toString();
    if (!quoted) return null;
    const quotedMsg = await Message.findOne({ where: { id: quoted } });
    if (!quotedMsg) return null;
    return quotedMsg;
};

export const sendMessageToTelegramChat = async (number, text) => {
    try {
        await bot.sendMessage(number, text);

        // Adicione o registro da mensagem enviada no banco de dados com `fromMe: true`
        const contact = await Contact.findOne({ where: { number } });
      
            const ticket = await Ticket.findOne({ where: { contactId: contact.id } });
          
                const messageData = {
                    id: uuidv4(), // Gera um ID único usando uuid
                    ticketId: ticket.id,
                    contactId: contact.id,
                    body: text,
                    fromMe: true,
                    read: true,
                    quotedMsgId: null,
                    ack: 3,
                    dataJson: JSON.stringify({ text })
                };

                await CreateMessageService({ messageData, companyId: ticket.companyId });
                console.log("TEXT DO TICKET UPDATE", text)
                await ticket.update({ lastMessage: text });
            
        
    } catch (error) {
        console.error(`Erro ao enviar mensagem para o chat ${number}:`, error);
    }
};
