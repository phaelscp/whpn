import AppError from "../../errors/AppError";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import { sendText, sendTextWpp, sendTemplateWpp } from "./graphAPI";
import formatBody from "../../helpers/Mustache";
import Whatsapp from "../../models/Whatsapp";
import CreateMessageService from "../MessageServices/CreateMessageService";
import { getIO } from "../../libs/socket";

interface Request {
  idMessage: string;
  phoneNumber: string;
  ticket: Ticket;
  templateName: string;
  recipientId: string;
}

interface MessageStatus{
  messageId: string;
  status: string;
  ticket: Ticket;
}

const sendFacebookMessageTemplate = async ({ idMessage, phoneNumber, ticket, templateName, recipientId }: Request): Promise<any> => {
  //const { number } = ticket.contact;

  const whatsapp = await Whatsapp.findOne({
    where: {
      facebookPageUserId: phoneNumber
    }
  });
  if (!whatsapp)
    return;

    //console.log("Enviando Instagram", whatsapp.id, whatsapp.facebookUserToken, ticket.id, ticket.whatsappId);

    const ret = await sendTemplateWpp(recipientId, templateName, whatsapp);

    //GRAVA A MENSAGEM NO BANCO DE DADOS
    const messageData = {
      id: ret.messages[0].id,
      wid: ret.contacts[0].wa_id,
      ticketId: ticket.id,
      contactId: ticket.contactId,
      body: "Recebi sua mensagem, podemos falar agora?",
      fromMe: true,
      mediaType: 'text',
      mediaUrl: '',
      read: false,
      quotedMsgId: null,
      ack: 0,
      dataJson: JSON.stringify(ret),
      channel: "wppoficial"
    };

    await CreateMessageService({ messageData, companyId: ticket.companyId });
    await ticket.update({ lastMessage: "Recebi sua mensagem, podemos falar agora?" });
};
export default sendFacebookMessageTemplate;
