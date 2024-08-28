import cron from 'node-cron';
import axios from 'axios';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import express, { Router, Request, Response } from 'express';

dotenv.config();

const app = express();
const router = Router();
const purchaseKey = process.env.PURCHASE_KEY;
const domainUrl = process.env.BACKEND_URL;
const phpValidationUrl = 'https://www.meupost.net/licen/index.php';

if (!purchaseKey) {
    console.error('Chave de compra não encontrada no arquivo .env');
    process.exit(1);
}

if (!domainUrl) {
    console.error('URL de domínio não encontrada no arquivo .env');
    process.exit(1);
}

export async function validateLicense(purchaseKey: string): Promise<boolean> {
    try {
        const response = await axios.get(phpValidationUrl, {
            params: {
                purchase_key: purchaseKey,
                domain_url: domainUrl
            }
        });
        return response.data.success;
    } catch (error) {
        console.error('Erro ao verificar a licença:', error);
        throw new Error('Erro ao verificar a licença');
    }
}

router.get('/checkLicense', async (req: Request, res: Response) => {
    if (!purchaseKey) {
        return res.status(400).json({ error: 'Chave de compra não encontrada no arquivo .env' });
    }

    try {
        const isValidLicense = await validateLicense(purchaseKey);
        if (isValidLicense) {
            res.json({ success: true, msg: 'Licença válida' });
        } else {
            res.status(400).json({ success: false, msg: 'Licença inválida' });
            console.log('A licença não é válida. Desligando o aplicativo...');
            exec('pm2 stop all', (error, stdout, stderr) => {
                if (error) {
                    console.error(`Erro ao parar o PM2: ${error}`);
                    return;
                }
                console.log(`PM2 parado: ${stdout}`);
                process.exit(1);
            });
        }
    } catch (error) {
        console.error('Erro ao verificar a licença:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.use(router);

export const executaAcaoACada10Segundos = async () => {
    console.log('Executando CronJob...');
    try {
        //const isValidLicense = await validateLicense(purchaseKey);
        console.log(`Resposta da validação da licença:`);
       /* if (!isValidLicense) {
            console.log('A licença não é válida. Desligando o aplicativo...');
            exec('pm2 stop all', (error, stdout, stderr) => {
                if (error) {
                    console.error(`Erro ao parar o PM2: ${error}`);
                    return;
                }
                console.log(`PM2 parado: ${stdout}`);
                process.exit(1);
            });
        }*/
    } catch (error) {
        console.error('Erro ao verificar a licença:', error);
    }
};

cron.schedule('*/10 * * * * *', () => {
    executaAcaoACada10Segundos();
});
