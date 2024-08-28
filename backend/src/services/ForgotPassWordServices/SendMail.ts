import nodemailer from "nodemailer";
import sequelize from "sequelize";
import database from "../../database";
import Setting from "../../models/Setting";

interface UserData {
  companyId: number;
}

const SendMail = async (email: string, tokenSenha: string) => {
  const companyId = 1; 


  const { hasResult, data } = await filterEmail(email);

  if (!hasResult) {
    return { status: 404, message: "Email não encontrado" };
  }

  const userData = data[0][0] as UserData;

  if (!userData || userData.companyId === undefined) {
    return { status: 404, message: "Dados do usuário não encontrados" };
  }

  const smtpHost = process.env.MAIL_HOST;
  const smtpUser = process.env.MAIL_USER;
  const smtpPass = process.env.MAIL_PASS;
  const smtpPort = 465;
  const fromEmail = smtpUser;

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: true, // Use true se estiver usando a porta 465 (SSL)
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  if (hasResult === true) {
    const { hasResults, datas } = await insertToken(email, tokenSenha);

    async function sendEmail() {
      try {
        const mailOptions = {
          from: fromEmail,
          to: email,
          subject: "Redefinição de Senha",
          text: `Olá,\n\nVocê solicitou a redefinição de senha para sua conta, utilize o seguinte Código de Verificação para concluir o processo de redefinição de senha:\n\nCódigo de Verificação: ${tokenSenha}\n\nPor favor, copie e cole o Código de Verificação no campo 'Código de Verificação'.\n\nSe você não solicitou esta redefinição de senha, por favor, ignore este e-mail.\n\n\nAtenciosamente`,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("E-mail enviado: " + info.response);

        return { status: 200, message: "E-mail enviado com sucesso" };
      } catch (error) {
        console.log("Erro ao enviar e-mail:", error);
        return { status: 500, message: "Erro ao enviar e-mail" };
      }
    }

    return sendEmail();
  }
};

const filterEmail = async (email: string) => {
  console.log("Verificando e-mail:", email); 
  const sql = `SELECT * FROM "Users" WHERE email ='${email}'`;
  const result = await database.query(sql, { type: sequelize.QueryTypes.SELECT });
  console.log("Resultado da consulta:", result); 
  return { hasResult: result.length > 0, data: [result] };
};

const insertToken = async (email: string, tokenSenha: string) => {
  const sqls = `UPDATE "Users" SET "resetPassword"= '${tokenSenha}' WHERE email ='${email}'`;
  const results = await database.query(sqls, { type: sequelize.QueryTypes.UPDATE });
  return { hasResults: results.length > 0, datas: results };
};

export default SendMail;
