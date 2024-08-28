// routes/telegramRoutes.ts
import express, { Request, Response } from 'express';
import { receiveMessage } from '../services/Telegram/Telegram';
import { TelegramMessage } from '../models/TelegramMessage';
import MsgTelegram from '../services/Telegram/modeloDB';

const router = express.Router();

router.get('/messages/:chatId', async (req: Request<any, any, any, { chatId: string }>, res: Response) => {
  try {
    const chatId = req.params.chatId; 
    const messages = await MsgTelegram.findAll({ where: { chatId } });
    res.json(messages);
  } catch (error) {
    console.error('Erro ao consultar mensagens:', error);
    res.status(500).json({ error: 'Erro ao consultar mensagens' });
  }
});

router.get('/chatIds', async (req: Request<any, any, any, any>, res: Response) => {
  try {
    const chatIds = await MsgTelegram.findAll({ attributes: ['chatId'], group: ['chatId'] });
    res.json(chatIds.map(chat => chat.chatId));
  } catch (error) {
    console.error('Erro ao consultar chatIds:', error);
    res.status(500).json({ error: 'Erro ao consultar chatIds' });
  }
});


router.post('/webhook', (req: Request<any, any, TelegramMessage>, res: Response) => {
  const message: TelegramMessage = req.body;
  receiveMessage(message);
  res.sendStatus(200);
});

export default router;
