import { WASocket } from "@whiskeysockets/baileys";
import GetDefaultWhatsApp from "./GetDefaultWhatsApp";
import Ticket from "../models/Ticket";
import { getWbotWpp } from "../libs/wbot"; // Certifique-se de que a função getWbot esteja correta


type idZap = {
  [x: string]: any; id: number; whatsappId: number 
};
const idZapArray: idZap[] = []; // Inicializa idZapArray como um array de objetos idZap

const GetTicketWpp = async (ticket: Ticket): Promise<idZap> => {
  if (!ticket.whatsappId) {
    const defaultWhatsapp = await GetDefaultWhatsApp(ticket.companyId);
    await ticket.$set("whatsapp", defaultWhatsapp);
    ticket.whatsappId = defaultWhatsapp.id;
  }
  const wbot = getWbotWpp(ticket.whatsappId);
  return wbot;
};

export default GetTicketWpp;
