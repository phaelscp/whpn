import fs from "fs";
import axios from "axios";
import AppError from "../../errors/AppError";
import Ticket from "../../models/Ticket";
import Whatsapp from "../../models/Whatsapp";

interface Request {
  ticket: Ticket;
  media?: Express.Multer.File;
  body?: string;
  url?: string;
}

export const typeAttachment = (media: Express.Multer.File) => {
  if (media.mimetype.includes("image")) {
    return "image";
  }
  if (media.mimetype.includes("video")) {
    return "video";
  }
  if (media.mimetype.includes("audio")) {
    return "audio";
  }

  return "file";
};

export const sendFacebookMessageMedia = async ({
  media,
  ticket,
  body
}: Request): Promise<any> => {
  const whatsapp = await Whatsapp.findByPk(ticket.whatsappId);

  if (!whatsapp) {
    throw new AppError("ERR_WAPP_NOT_FOUND");
  }

  try {
    const type = typeAttachment(media);
    
    const domain = `${process.env.BACKEND_URL}/public/${media.filename}`;

    const formData = {
      messaging_product: "whatsapp",
      to: ticket.contact.number,
      type: type,
      [type]: {
        link: domain
      }
    };

    const { data } = await axios.post(
      `https://graph.facebook.com/v19.0/${whatsapp.idZap}/messages`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${whatsapp.tokenZap}`
        }
      }
    );

    await ticket.update({ lastMessage: media.filename });
    fs.unlinkSync(media.path);
    console.log(data);
  } catch (error) {
    console.log(error);
    throw new AppError("ERR_SENDING_WPP_MSG");
  }
};


export const sendFacebookMessageMediaExternal = async ({
  url,
  ticket,
  body
}: Request): Promise<any> => {
  const whatsapp = await Whatsapp.findByPk(ticket.whatsappId);

  if (!whatsapp) {
    throw new AppError("ERR_WAPP_NOT_FOUND");
  }

  try {
    const type = "image"; // Supondo que o tipo seja sempre imagem para mídia externa

    const formData = {
      messaging_product: "whatsapp",
      to: ticket.contact.number,
      type: type,
      [type]: {
        link: url
      }
    };

    const { data } = await axios.post(
      `https://graph.facebook.com/v19.0/${whatsapp.idZap}/messages`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${whatsapp.tokenZap}`
        }
      }
    );

    const randomName = Math.random().toString(36).substring(7);
    await ticket.update({ lastMessage: body || `${randomName}.jpg}` });
    console.log(data);
  } catch (error) {
    console.log(error);
    throw new AppError("ERR_SENDING_WPP_MSG");
  }
};

export const sendFacebookMessageFileExternal = async ({
  url,
  ticket,
  body
}: Request): Promise<any> => {
  const whatsapp = await Whatsapp.findByPk(ticket.whatsappId);

  if (!whatsapp) {
    throw new AppError("ERR_WAPP_NOT_FOUND");
  }

  try {
    const type = "file";

    const formData = {
      messaging_product: "whatsapp",
      to: ticket.contact.number,
      type: type,
      [type]: {
        link: url
      }
    };

    const { data } = await axios.post(
      `https://graph.facebook.com/v19.0/${whatsapp.idZap}/messages`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${whatsapp.tokenZap}`
        }
      }
    );

    const randomName = Math.random().toString(36).substring(7);
    await ticket.update({ lastMessage: body || `${randomName}.pdf}` });
    console.log(data);
  } catch (error) {
    console.log(error);
    throw new AppError("ERR_SENDING_WPP_MSG");
  }
};
