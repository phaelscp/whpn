import * as Yup from "yup";
import AppError from "../../errors/AppError";
import Prompt from "../../models/Prompt";
import PromptFunction from "../../models/PromptFunction";

interface FunctionData {
    descritivo?: string;  // Tornando opcional
    json?: object;        // Tornando opcional
    name?: string;
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
    maxMessages?: number;
    companyId: string | number;
    voice?: string;
    voiceKey?: string;
    voiceRegion?: string;
    functions?: FunctionData[];
    queueIntegrationId?: number // Array opcional de PromptFunctions
}

const CreatePromptService = async (promptData: PromptData): Promise<Prompt> => {
    const { name, apiKey, prompt, maxMessages, companyId, functions, queueIntegrationId } = promptData;
    const promptSchema = Yup.object().shape({
        name: Yup.string().required("ERR_PROMPT_NAME_INVALID"),
        prompt: Yup.string().required("ERR_PROMPT_INTELLIGENCE_INVALID"),
        apiKey: Yup.string().required("ERR_PROMPT_APIKEY_INVALID"),
        maxMessages: Yup.number().required("ERR_PROMPT_MAX_MESSAGES_INVALID"),
        companyId: Yup.number().required("ERR_PROMPT_COMPANY_ID_INVALID"),
        queueIntegrationId: Yup.number().nullable(true).notRequired(),
        functions: Yup.array().of(
            Yup.object().shape({
                descritivo: Yup.string(), // Opcional
                json: Yup.lazy(value => 
                    Object.keys(value || {}).length ? Yup.object().required() : Yup.mixed().notRequired()
                ), // Opcional, mas se fornecido, deve ser um objeto
                name: Yup.string()
            })
        ).notRequired() // Toda a seção de functions é opcional
    });

    try {
        // Filtragem dos dados de functions
        const filteredFunctions = promptData.functions?.map(({ name, descritivo }) => ({
                name,
                descritivo
        })) || [];

        promptData.functions = filteredFunctions;

        await promptSchema.validate(promptData);
    } catch (err) {
        throw new AppError(`${JSON.stringify(err, undefined, 2)}`);
    }

    let promptTable = await Prompt.create(promptData, {
        include: functions && functions.length > 0 ? [PromptFunction] : []
    });

    return promptTable;
};

export default CreatePromptService;