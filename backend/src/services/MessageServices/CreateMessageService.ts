import { getIO } from "../../libs/socket";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import Whatsapp from "../../models/Whatsapp";
import OldMessage from "../../models/OldMessage";
import Tag from "../../models/Tag";

interface MessageData {
  id: string;
  ticketId: number;
  body: string;
  contactId?: number;
  fromMe?: boolean;
  read?: boolean;
  mediaType?: string;
  mediaUrl?: string;
  ack?: number;
  queueId?: number;
}
interface Request {
  messageData: MessageData;
  companyId: number;
}

const CreateMessageService = async ({
  messageData,
  companyId
}: Request): Promise<Message> => {


  await Message.upsert({ ...messageData, companyId });

  const message = await Message.findByPk(messageData.id, {
    include: [
      "contact",
      {
        model: Ticket,
        as: "ticket",
        include: [
          "contact",
          "queue",
          {
            model: Whatsapp,
            as: "whatsapp",
            attributes: ["name"]
          },
          {
            model: Tag,
            as: "tags",
            attributes: ["id", "name", "color"]
          },
        ]
      },
      {
        model: Message,
        as: "quotedMsg",
        include: ["contact"]
      },
      {
        model: OldMessage,
        as: "oldMessages"
      }
    ],
  });

  await message.ticket.contact.update({ presence: "available" });
  await message.ticket.contact.reload();


  if (message.ticket.queueId !== null && message.queueId === null) {
    await message.update({ queueId: message.ticket.queueId });
  }

  if (!message) {
    throw new Error("ERR_CREATING_MESSAGE");
  }

  const io = getIO();
  io.to(message.ticketId.toString())
    .to(`company-${companyId}-${message.ticket.status}`)
    .to(`company-${companyId}-notification`)
    .to(`queue-${message.queueId}-notification`)
    .to(`queue-${message.queueId}-${message.ticket.status}`)

    .emit(`company-${companyId}-appMessage`, {
      action: "create",
      message,
      ticket: message.ticket,
      contact: message.ticket.contact
    });

    io.to(`company-${companyId}-mainchannel`)
    .emit(`company-${companyId}-contact`, {
        action: "update",
        contact: message.ticket.contact
    });

  return message;
};

export default CreateMessageService;
