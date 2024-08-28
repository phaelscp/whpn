import * as Yup from "yup";
import AppError from "../../errors/AppError";
import Prompt from "../../models/Prompt";
import PromptFunction from "../../models/PromptFunction";
import ShowPromptService from "./ShowPromptService";

interface FunctionData {
    id?: number;
    descritivo: string;
    json?: object;
    name: string;
}

interface PromptData {
    name: string;
    apiKey: string;
    prompt: string;
    maxTokens?: number;
    temperature?: number;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    queueId?: number;
    maxMessages?: number;
    companyId: string | number;
    voice?: string;
    voiceKey?: string;
    voiceRegion?: string;
    functions?: FunctionData[];
    queueIntegrationId?: number;
}

interface Request {
    promptData: PromptData;
    promptId: string | number;
    companyId: string | number;
}

const UpdatePromptService = async ({ promptId, promptData, companyId }: Request): Promise<Prompt> => {
    console.log("UpdatePromptService", promptData);
    const promptTable = await ShowPromptService({ promptId: promptId, companyId});
    const promptSchema = Yup.object().shape({
        name: Yup.string().required("ERR_PROMPT_NAME_INVALID"),
        prompt: Yup.string().required("ERR_PROMPT_PROMPT_INVALID"),
        apiKey: Yup.string().required("ERR_PROMPT_APIKEY_INVALID"),
        maxMessages: Yup.number().required("ERR_PROMPT_MAX_MESSAGES_INVALID"),
        queueIntegrationId: Yup.number().nullable(true).notRequired(),
        functions: Yup.array().of(
            Yup.object().shape({
                descritivo: Yup.string().required(),
                name: Yup.string()
            })
        )
    });
 
    try {
        await promptSchema.validate({ ...promptData });
    } catch (err) {
        throw new AppError(`${JSON.stringify(err, undefined, 2)}`);
    }
    await Prompt.update(
        { ...promptData }, // Aqui você poderia especificar apenas os campos que são permitidos ser atualizados.
        { where: { id: promptTable.id } }
    );

    await PromptFunction.destroy({ where: { promptId: promptTable.id } });

    // Criar ou atualizar funções com o método .map() e Promise.all()
    const functionPromises = promptData.functions.map(functionData => 
        PromptFunction.create({
            ...functionData,
            json: {}, // Esvaziando o campo json
            promptId: promptTable.id
        })
    );

    // Executar todas as promessas geradas pelo .map()
    await Promise.all(functionPromises);
        
    // Finaliza recarregando o prompt para refletir as mudanças
    return await promptTable.reload({ include: [PromptFunction] });
};

export default UpdatePromptService;
