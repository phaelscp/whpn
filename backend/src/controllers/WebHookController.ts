import { Request, Response } from "express";
import Whatsapp from "../models/Whatsapp";
import { handleMessageWpp } from "../services/FacebookServices/facebookMessageListener";

export const index = async (req: Request, res: Response): Promise<Response> => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "whaticket";

  const mode = req.query["hub.mode"] as string;
  const token = req.query["hub.verify_token"] as string;
  const challenge = req.query["hub.challenge"] as string;

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Verification successful. Sending challenge:", challenge);
      return res.status(200).send(challenge);
    }
  }

  console.log("Verification failed. Forbidden access.");
  return res.status(403).json({
    message: "Forbidden"
  });
};

export const webHook = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { body } = req;
    console.log("WEBHOOK MESSAGE", JSON.stringify(body));

    if (body.object === "whatsapp_business_account") {
      const channel = "wppoficial";

      for (const entry of body.entry || []) {
        //console.log("ENTRY:", JSON.stringify(entry));

        for (const change of entry.changes || []) {
          const metadata = change.value.metadata;
          const phoneNumberId = metadata.phone_number_id.trim();

          const tokenPage = await Whatsapp.findOne({
            where: {
              idZap: phoneNumberId,
              channel
            }
          });

          if (tokenPage) {
            for (const message of change.value.messages || []) {
             // console.log(`Handling WhatsApp message:`, JSON.stringify(message));
              
              // Verificação do tipo de mensagem
              if (["image", "video", "audio", "sticker"].includes(message.type)) {
                console.log(`Media message detected: ${message.type}`);
              }

              handleMessageWpp(tokenPage, message, channel, tokenPage.companyId);
            }
          } else {
            console.log(`No token page found for WhatsApp entry. Metadata:`, metadata);
          }
        }
      }

      //console.log("Processed all WhatsApp entries");
      return res.status(200).json({
        status: true
      });
    }

    console.log("Unsupported webhook object type:", body.object);
    return res.status(200).json({
      status: false,
      message: "Unsupported webhook object type"
    });
  } catch (error) {
    console.error("Error in webhook processing:", error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};
