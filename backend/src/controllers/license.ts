import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const phpValidationUrl = 'https://evolvecenter.online/license/index.php';
const purchaseKey = process.env.PURCHASE_KEY;

if (!purchaseKey) {
    console.error('Chave de compra não encontrada no .env');
    process.exit(1);
}

interface LicenseInfo {
    valid: boolean;
    msg: string;
}

class LicenseValidator {
    private readonly phpValidationUrl: string;

    constructor(phpValidationUrl: string) {
        this.phpValidationUrl = phpValidationUrl;
    }

    public async validateLicense(key: string): Promise<LicenseInfo | null> {
        try {
            const response = await axios.post(this.phpValidationUrl, { purchase_key: key });
            if (response.data && response.data.success !== undefined) {
                return {
                    valid: response.data.success,
                    msg: response.data.error_message || 'Erro desconhecido'
                };
            } else {
                console.error('Resposta inesperada da API:', response.data);
                return null;
            }
        } catch (error) {
            console.error('Erro ao validar a licença:', error);
            return null;
        }
    }

    public async removeLicenseKey(): Promise<boolean> {
        try {
            const response = await axios.post(this.phpValidationUrl, { type: 'remove_license' });
            return response.data.success;
        } catch (error) {
            console.error('Erro ao remover a chave de licença:', error);
            return false;
        }
    }
}

export default LicenseValidator;
