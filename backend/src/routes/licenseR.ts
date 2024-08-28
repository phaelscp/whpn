import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();
const phpValidationUrl = 'https://evolvecenter.online/license/index.php'; // Endpoint PHP teste

router.get('/checkLicense', async (req: Request, res: Response) => {
    const purchaseKey = process.env.PURCHASE_KEY;
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
            process.exit(1);
        }
    } catch (error) {
        console.error('Erro ao verificar a licença:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

export async function validateLicense(purchaseKey: string): Promise<boolean> {
    try {
        const response = await axios.get(phpValidationUrl, {
            params: {
                purchase_key: purchaseKey
            }
        });
        return response.data.success;
    } catch (error) {
        console.error('Erro ao verificar a licença:', error);
        throw new Error('Erro ao verificar a licença');
    }
}

export default router;
