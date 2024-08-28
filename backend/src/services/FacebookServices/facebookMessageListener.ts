import { writeFileSync } from "fs";
import fs from "fs";
import axios, { Method } from 'axios';
import { join } from "path";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import path from 'path';
import CreateOrUpdateContactService from "../ContactServices/CreateOrUpdateContactService";
import CreateMessageService from "../MessageServices/CreateMessageService";
import FindOrCreateTicketService from "../TicketServices/FindOrCreateTicketService";
import { profilePsid } from "./graphAPI";
import Whatsapp from "../../models/Whatsapp";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import formatBody from "../../helpers/Mustache";
import Queue from "../../models/Queue";
import Chatbot from "../../models/Chatbot";
import Message from "../../models/Message";
import { getIO } from "../../libs/socket";
import FindOrCreateTicketServiceMeta from "../TicketServices/FindOrCreateTicketServiceMeta";
import FindOrCreateATicketTrakingService from "../TicketServices/FindOrCreateATicketTrakingService";
import sequelize from "sequelize";
import sendFaceMessage from "./sendFacebookMessage";
import AppError from "../../errors/AppError";
import moment from "moment";
import UserRating from "../../models/UserRating";
import { isNil, isNull } from "lodash";
import TicketTraking from "../../models/TicketTraking";
import sendFacebookMessageTemplate from "./sendFacebookMessageTemplate";
import sendFacebookMessage from "./sendFacebookMessage";

interface IMe {
  name: string;
  first_name: string;
  last_name: string;
  profile_pic: string;
  id: string;
}

interface MessageStatus {
  messageId: string;
  status: string;
}

export interface Entry {
  id: string;
  time: number;
  messaging: Messaging[];
}

export interface Root {
  object: string;
  entry: Entry[];
}

export interface Sender {
  id: string;
}

export interface Recipient {
  id: string;
}

export interface MessageX {
  mid: string;
  text: string;
  reply_to: ReplyTo;
}

export interface Messaging {
  sender: Sender;
  recipient: Recipient;
  timestamp: number;
  message: MessageX;
}

export interface ReplyTo {
  mid: string;
}

const verifyContact = async (
  msgContact: any,
  channel: string,
  companyId: any
) => {
  if (!msgContact) return null;
  const contactData = {
    name: msgContact?.name || `${msgContact?.first_name} ${msgContact?.last_name}`,
    number: msgContact.id,
    profilePicUrl: "",
    isGroup: false,
    companyId: companyId,
    channel: channel
  };
  const contact = await CreateOrUpdateContactService(contactData);
  return contact;
};

export const verifyMessage = async (
  msg: any,
  body: any,
  ticket: Ticket,
  contact: Contact
) => {
  const quotedMsg = await verifyQuotedMessage(msg);
  const messageData = {
    id: msg.mid || msg.message_id,
    ticketId: ticket.id,
    contactId: msg.is_echo ? undefined : contact.id,
    body: msg.text || body,
    fromMe: msg.is_echo,
    read: msg?.is_echo,
    quotedMsgId: quotedMsg?.id,
    ack: 3,
    dataJson: JSON.stringify(msg)
  };

  await CreateMessageService({ messageData, companyId: ticket.companyId });
  await ticket.update({ lastMessage: msg.text });
};

export const verifyMessageMedia = async (
  msg: any,
  ticket: Ticket,
  contact: Contact
): Promise<void> => {
  const { data } = await axios.get(msg.attachments[0].payload.url, {
    responseType: "arraybuffer"
  });
  const { fileTypeFromBuffer } = await (eval('import("file-type")') as Promise<
    typeof import("file-type")
  >);
  const type = await fileTypeFromBuffer(data);
  const fileName = `${new Date().getTime()}.${type.ext}`;
  const folder = `8080:/public/company${ticket.companyId}`;
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
    fs.chmodSync(folder, 0o777);
  }
  writeFileSync(
    join(__dirname, "..", "..", "..", folder, fileName),
    data,
    "base64"
  );
  const messageData = {
    id: msg.mid,
    ticketId: ticket.id,
    contactId: msg.is_echo ? undefined : contact.id,
    body: msg.text || fileName,
    fromMe: msg.is_echo,
    mediaType: msg.attachments[0].type,
    mediaUrl: fileName,
    read: msg.is_echo,
    quotedMsgId: null,
    ack: 3,
    dataJson: JSON.stringify(msg)
  };
  await CreateMessageService({ messageData, companyId: ticket.companyId });
  await ticket.update({ lastMessage: msg.text });
};

const verifyQuotedMessage = async (msg: any): Promise<Message | null> => {
  if (!msg) return null;
  const quoted = msg?.reply_to?.mid;
  if (!quoted) return null;
  const quotedMsg = await Message.findOne({ where: { id: quoted } });
  if (!quotedMsg) return null;
  return quotedMsg;
};

const verifyContactWpp = async (msgContact: any, companyId: number, channel = "whatsapp") => {
  if (!msgContact) return null;

  const contactData = {
    name: msgContact?.name || `${msgContact?.profile.name}`,
    number: msgContact.wa_id,
    profilePicUrl: "",
    isGroup: false,
    companyId,
    channel
  };

  const contact = await CreateOrUpdateContactService(contactData);

  return contact;
};

const UpdateStatusMessage = async ({ messageId, status }: MessageStatus): Promise<any> => {
  const message = await Message.findByPk(messageId, {
    include: [{
      model: Ticket,
      as: 'ticket'
    }]
  });

  let ack = 0;
  switch (status) {
    case "sent":
      ack = 1;
      break;
    case "delivered":
      ack = 2;
      break;
    case "read":
      ack = 3;
      break;
  }

  if (ack <= message.ack) return;

  message.update({ ack });
  const ticket = message.ticket;

  const io = getIO();
  io.to(ticket.id.toString())
    .to(`company-${ticket.companyId}-${ticket.status}`)
    .to(`company-${ticket.companyId}-notification`)
    .to(`queue-${ticket.queueId}-${ticket.status}`)
    .to(`queue-${ticket.queueId}-notification`)
    .emit(`company-${ticket.companyId}-appMessage`, {
      action: "update",
      message,
      ticket: message.ticket,
      contact: message.ticket.contact
    });
};

const verifyQueue = async (
  getSession: Whatsapp,
  msg: any,
  ticket: Ticket,
  contact: Contact
) => {
  const { queues, greetingMessage } = await ShowWhatsAppService(
    getSession.id!,
    ticket.companyId
  );

  if (queues.length === 1) {
    await UpdateTicketService({
      ticketData: { queueId: queues[0].id },
      ticketId: ticket.id,
      companyId: ticket.companyId,
      ratingId: undefined
    });
    return;
  }

  const selectedOption = msg.text?.body || msg.text;
  const choosenQueue = queues[+selectedOption - 1];

  if (choosenQueue) {
    await UpdateTicketService({
      ticketData: { queueId: choosenQueue.id },
      ticketId: ticket.id,
      companyId: ticket.companyId,
      ratingId: undefined
    });

    const body = formatBody(`\u200e${choosenQueue.greetingMessage}`, ticket);
    await sendFacebookMessage({ body, ticket });
    await verifyMessageWpp(msg, body, ticket, contact, ticket.companyId, "whatsapp");

    if (choosenQueue.chatbots.length > 0) {
      let options = "";
      choosenQueue.chatbots.forEach((chatbot, index) => {
        options += `*${index + 1}* - ${chatbot.name}\n`;
      });
      const chatbotBody = formatBody(
        `\u200e${choosenQueue.greetingMessage}\n\n${options}\n*#* Voltar ao menu principal`,
        ticket
      );
      await sendFacebookMessage({ body: chatbotBody, ticket });
      await verifyMessageWpp(msg, chatbotBody, ticket, contact, ticket.companyId, "whatsapp");
      return;
    }
  } else {
    let options = "";
    queues.forEach((queue, index) => {
      options += `*${index + 1}* - ${queue.name}\n`;
    });
    const body = formatBody(`\u200e${greetingMessage}\n\n${options}`, ticket);
    await sendFacebookMessage({ body, ticket });
    await verifyMessageWpp(msg, body, ticket, contact, ticket.companyId, "whatsapp");
  }
};

export const handleRating = async (
  msg: any,
  ticket: Ticket,
  ticketTraking: TicketTraking
) => {
  const io = getIO();
  let rate: number | null = null;

  if (msg.text) {
    rate = +msg.text || null;
  }

  if (!Number.isNaN(rate) && Number.isInteger(rate) && !isNull(rate)) {
    const { complationMessage } = await ShowWhatsAppService(
      ticket.whatsappId,
      ticket.companyId
    );

    let finalRate = rate;

    if (rate < 1) {
      finalRate = 1;
    }
    if (rate > 3) {
      finalRate = 3;
    }

    await UserRating.create({
      ticketId: ticketTraking.ticketId,
      companyId: ticketTraking.companyId,
      userId: ticketTraking.userId,
      rate: finalRate,
    });
    const body = formatBody(`${complationMessage}`, ticket);

    await sendFaceMessage({
      ticket,
      body: body
    });

    await ticketTraking.update({
      finishedAt: moment().toDate(),
      rated: true,
    });

    setTimeout(async () => {
      await ticket.update({
        queueId: null,
        chatbot: null,
        queueOptionId: null,
        userId: null,
        status: "closed",
      });

      io.to("open").emit(`company-${ticket.companyId}-ticket`, {
        action: "delete",
        ticket,
        ticketId: ticket.id,
      });

      io.to(ticket.status)
        .to(ticket.id.toString())
        .emit(`company-${ticket.companyId}-ticket`, {
          action: "update",
          ticket,
          ticketId: ticket.id,
        });

    }, 2000);
  }
};

export const verifyRating = (ticketTraking: TicketTraking) => {
  if (
    ticketTraking &&
    ticketTraking.finishedAt === null &&
    ticketTraking.userId !== null &&
    ticketTraking.ratingAt !== null
  ) {
    return true;
  }
  return false;
};
export const verifyMessageWpp = async (
  msg: any,
  body: any,
  ticket: Ticket,
  contact: Contact,
  companyId: number,
  channel: string,
) => {
  try {
    if (!msg) {
      throw new Error("Invalid input data: msg is undefined");
    }
    if (!ticket) {
      throw new Error("Invalid input data: ticket is undefined");
    }
    if (!contact) {
      throw new Error("Invalid input data: contact is undefined");
    }

    console.log("Message data received:", msg);
    console.log("Ticket data received:", ticket);
    console.log("Contact data received:", contact);

    const quotedMsg = await verifyQuotedMessage(msg);

    const messageBody = msg?.text?.body || msg?.text || body || '';

    const messageData = {
      id: msg.id || msg.mid || msg.message_id,
      wid: msg.from,
      ticketId: ticket.id,
      contactId: contact.id,
      body: messageBody,
      fromMe: false,
      read: true,
      quotedMsgId: quotedMsg?.id,
      ack: 3,
      dataJson: JSON.stringify(msg),
      channel: channel
    };

    if (!messageData.id) {
      throw new Error("Missing required message data: id");
    }
    if (!messageData.wid) {
      throw new Error("Missing required message data: wid");
    }
    if (!messageData.ticketId) {
      throw new Error("Missing required message data: ticketId");
    }
    if (!messageData.contactId) {
      throw new Error("Missing required message data: contactId");
    }

    console.log("Message data constructed:", messageData);

    await CreateMessageService({ messageData, companyId });

    await ticket.update({
      lastMessage: messageBody
    });

    console.log("Message processed and ticket updated successfully");
  } catch (error) {
    console.error("Erro ao lidar com webhook do WhatsApp:", error);
  }
};


export const handleMessageWpp = async (
  token: Whatsapp,
  webhookEvent: any,
  channel: string,
  companyId: number
): Promise<void> => {
  try {
    if (webhookEvent.value && Array.isArray(webhookEvent.value.messages) && webhookEvent.value.messages.length > 0) {
      throw new Error("Invalid webhook event structure");
    }

    if (webhookEvent.is_echo) {
      return;
    }

    const contactData = {
      profile: { name: webhookEvent.from },
      wa_id: webhookEvent.from
    };
    const messageData = webhookEvent;

    const contact = await verifyContactWpp(contactData, companyId, channel);
    if (!contact) {
      throw new Error("Contact verification failed");
    }
    
    const fromMe = messageData.is_echo;

    console.log("fromMeeee", messageData.is_echo)
    
    let msgContact: any;
    const senderPsid = webhookEvent.sender.id;
    const recipientPsid = webhookEvent.recipient.id;

    if (fromMe) {
      msgContact = await profilePsid(recipientPsid, token.tokenZap);
    } else {
      msgContact = await profilePsid(senderPsid, token.tokenZap);
    }
    
    const unreadCount = 0 ;

    const getSession = await Whatsapp.findOne({
      where: { idZap: token.idZap },
      include: [
        {
          model: Queue,
          as: "queues",
          attributes: ["id", "name", "color", "greetingMessage"],
          include: [{ model: Chatbot, as: "chatbots" }]
        },
      ],
    });

    if (!getSession) {
      throw new Error("Session not found");
    }

    const ticket = await FindOrCreateTicketServiceMeta(
      contact,
      getSession.id,
      unreadCount,
      companyId,
      channel
    );

    if (!ticket.queueId) {
      await verifyQueue(getSession, messageData, ticket, ticket.contact);
    } else {
      if (messageData.text) {
        await verifyMessageWpp(messageData, messageData.text.body || messageData.text, ticket, contact, companyId, channel);
      } else if (messageData.image || messageData.video || messageData.audio) {
        await verifyMessageMediaWpp(messageData, ticket, contact, companyId, channel, getSession.idZap);
      } else {
        console.warn("Invalid message data: messageData or messageData.text is undefined");
        throw new Error("Invalid message data: messageData or messageData.text is undefined");
      }
    }

    if (messageData.message?.type === "audio" || messageData.message?.type === "image" || messageData.message?.type === "video") {
      await verifyMessageMediaWpp(messageData.message, ticket, contact, companyId, channel, getSession.idZap);
    } else {
      if (messageData.message) {
        await verifyMessageWpp(messageData.message, messageData.message?.text?.body, ticket, contact, companyId, channel);
      } else {
        console.warn("messageData.message is undefined, skipping media message handling.");
      }
    }

    await ticket.reload();

    let audioMessage = false;
    let text = messageData.message?.text?.body || messageData.message?.text || '';
    if (messageData.message?.type === "audio") {
      text = 'Audio';
      audioMessage = true;
    }
   // const fromMe = false;
   
    const message = webhookEvent.value?.messages ? webhookEvent.value.messages[0] : null;
    const status = webhookEvent.value?.statuses ? webhookEvent.value.statuses[0] : null;
    const statusId = status ? status.id : '';
    const messageStatus = status ? status.status : '';
   // const phoneNumber = webhookEvent.value.metadata.phone_number_id;
    const recipientId = status ? status.recipient_id : '';

    if (!ticket.queue && !fromMe && !ticket.userId && getSession?.queues?.length >= 1) {
      await verifyQueue(getSession, message?.text?.body || '', ticket, ticket.contact);
    }
    
/*    if (message.type === "audio" || message.type === "image" || message.type === "video") {
      await verifyMessageMediaWpp(message, ticket, contact, companyId, channel, getSession.facebookUserToken);
    } else {
      await verifyMessageWpp(message, message.text.body, ticket, contact, companyId, channel);
    }
*/
    if (message == "#") {
      await ticket.update({
        queueOptionId: null,
        chatbot: false,
        queueId: null,
      });
      return;
    }

   // const fromMe = true;

    const ticketTraking = await FindOrCreateATicketTrakingService({
      ticketId: ticket.id,
      companyId,
      whatsappId: getSession.id,
      userId: ticket.userId
    });

    if (!fromMe) {
      if (ticketTraking !== null && verifyRating(ticketTraking)) {
        handleRating(message, ticket, ticketTraking);
        return;
      }
    }

    //console.log("VERIFICANDO FILA");
    if (!ticket.queue && !fromMe && !ticket.userId && getSession?.queues?.length >= 1) {
      await verifyQueue(getSession, message.text, ticket, ticket.contact);
    }

    const dontReadTheFirstQuestion = ticket.queue === null;

    await ticket.reload();

    if (getSession?.queues?.length == 1 && ticket.queue) {
      if (ticket.chatbots && !fromMe) {
        await handleChartbot(ticket, message.text, getSession);
      }
    }

    if (getSession?.queues?.length > 1 && ticket.queue) {
      if (ticket.chatbots && !fromMe) {
        await handleChartbot(ticket, message, getSession, dontReadTheFirstQuestion);
      }
    }

  } catch (error) {
    console.error("Erro ao lidar com webhook do WhatsApp:", error);
  }
};

const handleChartbot = async (ticket: Ticket, msg: string, wbot: any, dontReadTheFirstQuestion: boolean = false) => {
  const queue = await Queue.findByPk(ticket.queueId, {
    include: [
      {
        model: Chatbot,
        as: "chatbots",
        where: { parentId: null },
        order: [
          ["name", "ASC"],
          ["createdAt", "ASC"],
        ],
      },
    ],
  });

  if (queue && ticket.queueId) {
    const { schedules }: any = queue;
    const now = moment();
    const weekday = now.format("dddd").toLowerCase();
    let schedule;

    if (Array.isArray(schedules) && schedules?.length > 0) {
      schedule = schedules.find((s) => s.weekdayEn === weekday && s.startTime !== "" && s.startTime !== null && s.endTime !== "" && s.endTime !== null);
    }

    if (queue.outOfHoursMessage !== null && queue.outOfHoursMessage !== "" && !isNil(schedule)) {
      const startTime = moment(schedule.startTime, "HH:mm");
      const endTime = moment(schedule.endTime, "HH:mm");

      if (now.isBefore(startTime) || now.isAfter(endTime)) {
        const body = formatBody(`${queue.outOfHoursMessage}\n\n*[ # ]* - Voltar ao Menu Principal`, ticket);

        await sendFacebookMessage({
          body: body,
          ticket
        });
        return;
      }

      const body = formatBody(`${queue.greetingMessage}`, ticket);

      await sendFacebookMessage({
        body: body,
        ticket
      });
    }
  }

  const messageBody = msg;

  if (messageBody == "#") {
    // Voltar para o menu inicial
    await ticket.update({ queueOptionId: null, chatbot: false, queueId: null });
    await verifyQueue(wbot, msg, ticket, ticket.contact);
    return;
  }

  // Voltar para o menu anterior
  if (!isNil(queue) && !isNil(ticket.queueOptionId) && messageBody == "#") {
    const option = await Chatbot.findByPk(ticket.queueOptionId);
    await ticket.update({ queueOptionId: option?.parentId });
  } else if (!isNil(queue) && !isNil(ticket.queueOptionId)) {
    const count = await Chatbot.count({
      where: { parentId: ticket.queueOptionId },
    });
    let option: any = {};
    if (count == 1) {
      option = await Chatbot.findOne({
        where: { parentId: ticket.queueOptionId },
      });
    } else {
      option = await Chatbot.findOne({
        where: {
          name: messageBody || "",
          parentId: ticket.queueOptionId,
        },
      });
    }
    if (option) {
      await ticket.update({ queueOptionId: option?.id });
    }
  } else if (!isNil(queue) && isNil(ticket.queueOptionId) && !dontReadTheFirstQuestion) {
    const option = queue?.chatbots.find((o) => o.name == messageBody);
    if (option) {
      await ticket.update({ queueOptionId: option?.id });
    }
  }

  await ticket.reload();

  if (!isNil(queue) && isNil(ticket.queueOptionId)) {
    const queueOptions = await Chatbot.findAll({
      where: { queueId: ticket.queueId, parentId: null },
      order: [
        ["name", "ASC"],
        ["createdAt", "ASC"],
      ],
    });

    const botText = async () => {
      let options = "";

      queueOptions.forEach((option, i) => {
        options += `*[ ${option.name} ]* - ${option.title}\n`;
      });
      options += `\n*[ # ]* - Voltar Menu Inicial`;

      const textMessage = formatBody(`${queue.greetingMessage}\n\n${options}`, ticket);

      await sendFacebookMessage({
        body: textMessage,
        ticket
      });
    };
    return botText();
  } else if (!isNil(queue) && !isNil(ticket.queueOptionId)) {
    const currentOption = await Chatbot.findByPk(ticket.queueOptionId);
    const queueOptions = await Chatbot.findAll({
      where: { parentId: ticket.queueOptionId },
      order: [
        ["name", "ASC"],
        ["createdAt", "ASC"],
      ],
    });

    if (queueOptions?.length > 1) {
      const botText = async () => {
        let options = "";

        queueOptions.forEach((option, i) => {
          options += `*[ ${option.name} ]* - ${option.title}\n`;
        });
        options += `\n*[ # ]* - Voltar Menu Inicial`;

        await sendFacebookMessage({
          body: formatBody(`${currentOption.message}\n\n${options}`, ticket),
          ticket
        });
      };

      return botText();
    }
  }
};


export const verifyMessageMediaWpp = async (
  msg: any,
  ticket: Ticket,
  contact: Contact,
  companyId: number,
  channel: string,
  token: string
): Promise<void> => {
  let mediaId: string | undefined;

  if (msg.type === "audio") {
    mediaId = msg.audio.id;
  } else if (msg.type === "image") {
    mediaId = msg.image.id;
  } else if (msg.type === "video") {
    mediaId = msg.video.id;
  }

  if (!mediaId) {
    console.error("Media ID not found for message", msg);
    return;
  }

  try {
    const config: { method: Method; url: string } = {
      method: 'get',
      url: `https://graph.facebook.com/v19.0/${mediaId}/?access_token=EAAeA9pdZCucoBO2M7ozvj1YE5v7ZBlgNwTDhu3NmAiffjJZAtZBBz27bI41dUTSz5JS1binXDiho2toyhZAiNZCx5k7qZARZCgxyLqDuMshT2qhGAkEplohNfXUcZCeWepE31XuYyZBMHXlnxAGEgMI1fiSLSZANkweETFDHMPC4kgJXVP4TKGNnyNDI4nYtxq1FHzpSWZCOOict0VyCrjbA1jYf5wdE7qdHAKKiMqCO`
    };

    const response = await axios(config);
    const { data } = await axios.get(response.data.url, {
      responseType: "arraybuffer",
      headers: {
        'Authorization': `Bearer EAAeA9pdZCucoBO2M7ozvj1YE5v7ZBlgNwTDhu3NmAiffjJZAtZBBz27bI41dUTSz5JS1binXDiho2toyhZAiNZCx5k7qZARZCgxyLqDuMshT2qhGAkEplohNfXUcZCeWepE31XuYyZBMHXlnxAGEgMI1fiSLSZANkweETFDHMPC4kgJXVP4TKGNnyNDI4nYtxq1FHzpSWZCOOict0VyCrjbA1jYf5wdE7qdHAKKiMqCO`
      }
    });

    const { fileTypeFromBuffer } = await (eval('import("file-type")') as Promise<typeof import('file-type')>);

    const type = await fileTypeFromBuffer(data);

    const fileName = `${new Date().getTime()}.${type.ext}`;

    writeFileSync(
      join(__dirname, "..", "..", "..", "public", fileName),
      data
    );

    const messageData = {
      id: msg.id,
      wid: msg.mid,
      ticketId: ticket.id,
      contactId: contact.id,
      body: msg?.text?.body || fileName,
      fromMe: false,
      mediaType: msg.type,
      mediaUrl: fileName,
      read: false,
      quotedMsgId: null,
      ack: 3,
      dataJson: JSON.stringify(msg),
      channel: channel
    };

    await CreateMessageService({ messageData, companyId });

    await ticket.update({
      lastMessage: msg?.text?.body || fileName,
    });
  } catch (error) {
    console.error("Error processing media message", error);
  }
};


export const handleMessage = async (
  token: Whatsapp,
  webhookEvent: any,
  channel: string,
  companyId: any
): Promise<any> => {
  try {
    if (webhookEvent.message) {
      let msgContact: any;
      const senderPsid = webhookEvent.sender.id;
      const recipientPsid = webhookEvent.recipient.id;
      const { message } = webhookEvent;
      const fromMe = message.is_echo;
      if (fromMe) {
        msgContact = await profilePsid(recipientPsid, token.tokenZap);
      } else {
        msgContact = await profilePsid(senderPsid, token.tokenZap);
      }
      const contact = await verifyContact(msgContact, channel, companyId);
      const unreadCount = fromMe ? 0 : 1;
      const getSession = await Whatsapp.findOne({
        where: { idZap: token.idZap },
        include: [
          {
            model: Queue,
            as: "queues",
            attributes: ["id", "name", "color", "greetingMessage"],
            include: [
              {
                model: Chatbot,
                as: "chatbots",
                attributes: ["id", "name", "greetingMessage"]
              }
            ]
          }
        ],
        order: [
          ["queues", "id", "ASC"],
          ["queues", "chatbots", "id", "ASC"]
        ]
      });
      const _ticket = await FindOrCreateTicketService(
        contact,
        getSession.id,
        unreadCount,
        1,
        contact,
        channel
      );
      if (
        getSession.farewellMessage &&
        formatBody(getSession.farewellMessage, _ticket) === message.text
      )
        return;
      const ticket = await FindOrCreateTicketService(
        contact,
        getSession.id,
        unreadCount,
        companyId,
        contact,
        channel
      );
      await ticket.update({ lastMessage: message.text });
      if (message.attachments) {
        await verifyMessageMedia(message, ticket, contact);
      } else {
        await verifyMessage(message, message.text, ticket, contact);
      }
      if (
        !ticket.queue &&
        !fromMe &&
        !ticket.userId &&
        getSession.queues.length >= 1
      ) {
        await verifyQueue(getSession, message, ticket, contact);
      }
      if (ticket.queue && ticket.queueId) {
        if (!ticket.user) {
          await handleChartbot(
            ticket,
            message.text,
            getSession,
            false
          );
        }
      }
    }
    return;
  } catch (error) {
    throw new Error(error);
  }
};
