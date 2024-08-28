import axios from "axios";
import FormData from "form-data";
import { createReadStream } from "fs";
import { logger } from "../../utils/logger";
import Whatsapp from "../../models/Whatsapp";
import fs from "fs";
import Message from "../../models/Message";

const formData: FormData = new FormData();

const apiBase = (token: string) => {
  const params = new URLSearchParams({ access_token: token }).toString();

  return axios.create({
    baseURL: "https://graph.facebook.com/v19.0/",
    paramsSerializer: () => params
  });
};

export const getAccessToken = async (): Promise<string> => {
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID,
    client_secret: process.env.FACEBOOK_APP_SECRET,
    grant_type: "client_credentials"
  });

  const { data } = await axios.get(
    `https://graph.facebook.com/v19.0/oauth/access_token?${params}`
  );

  return data.access_token;
};

export const markSeen = async (id: string, token: string): Promise<void> => {
  await apiBase(token).post(`${id}/messages?access_token=${token}`, {
    recipient: {
      id
    },
    sender_action: "mark_seen"
  });
};

export const sendText = async (
  id: string | number,
  text: string,
  token: string
): Promise<void> => {
  try {
    const { data } = await apiBase(token).post("me/messages?access_token=" + token, {
      recipient: {
        id
      },
      message: {
        text: `${text}`
      }
    });

    return data;
  } catch (error) {
    console.log(error);
  }
};

export const sendTextWpp = async (
  id: string | number,
  text: string,
  whatsapp: Whatsapp
): Promise<void> => {
  console.log("CHAMOU O SEND TEXT", id, text, whatsapp.tokenZap);
  try {
    const { data } = await axios.post(
      `https://graph.facebook.com/v19.0/${whatsapp.idZap}/messages`,
      {
        messaging_product: "whatsapp",
        to: id,
        type: "text",
        text: {
          body: text
        }
      },
      {
        headers: {
          Authorization: `Bearer ${whatsapp.tokenZap}`
        }
      }
    );
    console.log(data);
  } catch (error) {
    console.log(error);
    throw new Error("ERR_SENDING_WPP_MSG");
  }
};

export const sendTemplateWpp = async (
  id: string | number,
  template: string,
  whatsApp: Whatsapp
): Promise<any> => {
  console.log("CHAMOU O SEND TEMPLATE", id, template, whatsApp.facebookUserToken);
  try {
    const { data } = await apiBase(whatsApp.facebookUserToken).post(`${whatsApp.facebookPageUserId}/messages/?access_token=${whatsApp.facebookUserToken}`,
      {
        messaging_product: "whatsapp",
        to: id,
        type: "template",
        template:
        {
          name: template,
          language:
          {
            code: "pt_BR"
          }
        }
      }
    );
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const SendMediaWpp = async (
  mediaType: string,
  mediaUrl: string,
  whatsApp: Whatsapp,
  id: string
): Promise<any> => {
  console.log("CHAMOU O SEND MEDIA", id, whatsApp.id, mediaUrl, mediaType);
  try {
    let body;
    let url = `${process.env.BACKEND_URL}/public/${mediaUrl}`;

    switch (mediaType) {
      case "audio":
        body = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: id,
          type: "audio",
          audio: { link: url }
        };
        break;
      case "image":
        body = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: id,
          type: "image",
          image: { link: url }
        };
        break;
      case "video":
        body = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: id,
          type: "video",
          video: { link: url }
        };
        break;
      case "document":
        body = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: id,
          type: "document",
          document: { link: url }
        };
        break;
      default:
        throw new Error("Unsupported media type");
    }

    console.log("BODY DA MENSAGEM", JSON.stringify(body));
    const { data } = await apiBase(whatsApp.facebookUserToken).post(`${whatsApp.facebookPageUserId}/messages/?access_token=${whatsApp.facebookUserToken}`, body);
    console.log("ENVIOU A MENSAGEM", data);

    return data;
  } catch (error) {
    console.log(error);
    throw new Error("ERR_SENDING_WPP_MSG");
  }
};

export const sendMedia = async (
  whatsApp: Whatsapp,
  fileType: string,
  filePath: string
): Promise<any> => {
  const url = `https://graph.facebook.com/v19.0/${whatsApp.facebookPageUserId}/media`;
  const accessToken = `${whatsApp.facebookUserToken}`; // Substitua com seu token de acesso real

  const form = new FormData();
  form.append('file', fs.createReadStream(filePath), {
    filename: 'cross-trainers-summer-sale.jpg',
    contentType: 'image/jpeg'
  });
  form.append('type', fileType);
  form.append('messaging_product', 'whatsapp');

  const config = {
    headers: {
      ...form.getHeaders(),
      'Authorization': `Bearer ${accessToken}`
    }
  };

  try {
    const response = await axios.post(url, form, config);
    console.log('Media uploaded successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to upload media:', error.response ? error.response.data : error.message);
  }
}

export const sendAttachmentFromUrl = async (
  id: string,
  url: string,
  type: string,
  tokenZap: string, // Corrigido o tipo do argumento para string
  token: string
): Promise<void> => {
  try {
    const { data } = await apiBase(token).post(`me/messages?access_token=${token}`, {
      recipient: {
        id
      },
      message: {
        attachment: {
          type,
          payload: {
            url
          }
        }
      }
    });

    return data;
  } catch (error) {
    console.log(error);
  }
};

export const sendAttachment = async (
  id: string,
  file: Express.Multer.File,
  type: string,
  token: string
): Promise<void> => {
  formData.append(
    "recipient",
    JSON.stringify({
      id
    })
  );

  formData.append(
    "message",
    JSON.stringify({
      attachment: {
        type,
        payload: {
          is_reusable: true
        }
      }
    })
  );

  const fileReaderStream = createReadStream(file.path);

  formData.append("filedata", fileReaderStream);

  try {
    await apiBase(token).post(`me/messages?access_token=${token}`, formData, {
      headers: {
        ...formData.getHeaders()
      }
    });
  } catch (error) {
    throw new Error(error);
  }
};

export const genText = (text: string): any => {
  const response = {
    text
  };

  return response;
};

export const getProfile = async (id: string, token: string): Promise<any> => {
  try {
    const { data } = await apiBase(token).get(id);

    return data;
  } catch (error) {
    console.log(error);
    throw new Error("ERR_FETCHING_FB_USER_PROFILE_2");
  }
};

export const getPageProfile = async (
  id: string,
  token: string
): Promise<any> => {
  try {
    const { data } = await apiBase(token).get(
      `${id}/accounts?access_token=${token}&fields=name,access_token,instagram_business_account{id,username,profile_picture_url,name}`
    );
    return data;
  } catch (error) {
    console.log(error);
    throw new Error("ERR_FETCHING_FB_PAGES");
  }
};

export const profilePsid = async (id: string, token: string): Promise<any> => {
  try {
    const { data } = await axios.get(
      `https://graph.facebook.com/v19.0/${id}?access_token=${token}`
    );
    return data;
  } catch (error) {
    console.log(error);
    await getProfile(id, token);
  }
};

export const subscribeApp = async (id: string, token: string): Promise<any> => {
  try {
    const { data } = await axios.post(
      `https://graph.facebook.com/v19.0/${id}/subscribed_apps?access_token=${token}`,
      {
        subscribed_fields: [
          "messages",
          "messaging_postbacks",
          "message_deliveries",
          "message_reads",
          "message_echoes"
        ]
      }
    );
    return data;
  } catch (error) {
    console.log(error)
    throw new Error("ERR_SUBSCRIBING_PAGE_TO_MESSAGE_WEBHOOKS");
  }
};

export const unsubscribeApp = async (
  id: string,
  token: string
): Promise<any> => {
  try {
    const { data } = await axios.delete(
      `https://graph.facebook.com/v19.0/${id}/subscribed_apps?access_token=${token}`
    );
    return data;
  } catch (error) {
    throw new Error("ERR_UNSUBSCRIBING_PAGE_TO_MESSAGE_WEBHOOKS");
  }
};

export const getSubscribedApps = async (
  id: string,
  token: string
): Promise<any> => {
  try {
    const { data } = await apiBase(token).get(`${id}/subscribed_apps`);
    return data;
  } catch (error) {
    throw new Error("ERR_GETTING_SUBSCRIBED_APPS");
  }
};

export const getAccessTokenFromPage = async (
  token: string
): Promise<string> => {
  try {
    if (!token) throw new Error("ERR_FETCHING_FB_USER_TOKEN");

    const params = new URLSearchParams({
      client_id: process.env.FACEBOOK_APP_ID!,
      client_secret: process.env.FACEBOOK_APP_SECRET!,
      grant_type: "fb_exchange_token",
      fb_exchange_token: token
    });

    const url = `https://graph.facebook.com/v19.0/oauth/access_token?${params}`;

    const data = await axios.get(url);

    return data.data.access_token;
  } catch (error) {
    console.log(error);
    throw new Error("ERR_FETCHING_FB_USER_TOKEN");
  }
};

export const removeApplication = async (
  id: string,
  token: string
): Promise<void> => {
  try {
    await axios.delete(`https://graph.facebook.com/v19.0/${id}/permissions`, {
      params: {
        access_token: token
      }
    });
  } catch (error) {
    logger.error("ERR_REMOVING_APP_FROM_PAGE");
  }
};

export default {
  getAccessToken,
  markSeen,
  sendText,
  sendTextWpp,
  sendTemplateWpp,
  SendMediaWpp,
  sendMedia,
  sendAttachmentFromUrl,
  sendAttachment,
  genText,
  getProfile,
  getPageProfile,
  profilePsid,
  subscribeApp,
  unsubscribeApp,
  getSubscribedApps,
  getAccessTokenFromPage,
  removeApplication
};
