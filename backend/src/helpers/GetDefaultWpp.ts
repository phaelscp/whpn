import AppError from "../errors/AppError";
import Whatsapp from "../models/Whatsapp";

const wppOficial = async (companyId: number): Promise<Whatsapp> => {
  const defaultWhatsapp = await Whatsapp.findOne({
    where: { isDefault: true, companyId }
  });
  if (!defaultWhatsapp) {
   // throw new AppError("ERR_NO_DEF_WAPP_FOUND");
    console.log("Id",defaultWhatsapp);
  }
  return defaultWhatsapp;
};
export default wppOficial;
