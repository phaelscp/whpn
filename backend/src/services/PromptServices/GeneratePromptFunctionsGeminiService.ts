import Prompt from "../../models/Prompt";
import PromptFunction from "../../models/PromptFunction";
import ShowPromptService from "./ShowPromptService";
//import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";
import AppError from "../../errors/AppError";
import axios, { AxiosResponse } from 'axios';


interface ComplexApiResponse {
  tools: Tool[];
  contents: Content[];
}

interface Tool {
  functionDeclarations: FunctionDeclaration[];
}

interface FunctionDeclaration {
  name: string;
  description: string;
  parameters: Parameters;
}

interface Parameters {
  type: string;
  properties: {
    [key: string]: {
      type: string;
      // Aqui você pode adicionar mais campos opcionais, se necessário
    };
  };
  required: string[];
}

interface Content {
  role: string;
  parts: Part[];
}

interface Part {
  text?: string;
  functionCall?: FunctionCall;
  functionResponse?: FunctionResponse;
}

interface FunctionCall {
  name: string;
  args: {
    [key: string]: string;
  };
}

interface FunctionResponse {
  name: string;
  response: {
    name: string;
    content: {
      [key: string]: string;
    };
  };
}

const GeneratePromptFunctionService = async (promptId: number | string, companyId: number | string): Promise<any[]> => {
    const prompt = await ShowPromptService({ promptId, companyId });
    // Usar Promise.all para aguardar todas as promessas dentro do map
    const functions = await Promise.all(
      prompt.functions.map(async (func) => {
        // Checar se ela tem um description e se o objeto json é nulo
        if (func.descritivo.length > 50 && (!func.json || Object.keys(func.json).length === 0)) {
          return await createFunctionJson(prompt, func);
        } else if (func.json){
          return func.json;
        }
        return null;
      })
    );
  
    // Filtrar os valores nulos
    const validFunctions = functions.filter(func => func !== null);
  
    // Agora você pode usar validFunctions para o que for necessário
    return functions;
  };


async function createFunctionJson(prompt: Prompt, func: PromptFunction){
   /* const configuration = new configuration({
        apiKey: prompt.apiKey
      });*/

      const generationConfig = {
        temperature: 0.7,
        topK: 1,
        topP: 1,
        maxOutputTokens: 512,
      };

      let instructions = "Você deve gerar um json a partir do prompt que eu irei te enviar logo mais abaixo. Esse json será usado para integrar com outros sistemas e por esta razão você deve responder apenas com o json e nada a mais.\n\nSegue aqui alguns exemplos pra você usar como referencia:\n\nEXEMPLO 1:\n{\n \"name\": \"getInfos\",\n \"description\": \"Esta função deve ser chamada sempre a pessoa que esta enviando a mensagem se identifica como cliente (pede desbloqueio, pergunta sobre renovação, dúvidas técnicas e etc) e as informações sobre este cliente ainda não estão disponíveis na conversa. Por exemplo (vencimento, plano contratato, link de pagamento e etc)\",\n \"parameters\": {\n  \"type\": \"object\",\n  \"properties\": {\n   \"email\": {\n    \"type\": \"string\",\n    \"description\": \"E-mail de cadastro do usuário. A informação do e-mail deve estar explícita na conversa, se não tiver precisa pedir. Um e-mail deve ter o padrão como por exemplo usuario@provedor.com, davigle@hotmail.com e etc\"\n   }\n  },\n  \"required\": [\n   \"email\"\n  ]\n }\n}\n\nExemplo 2:\n{\n \"name\": \"postToHuman\",\n \"description\": \"Esta função deve ser chamada quando o atendimento tiver a necessidade de ser escalonado para o nível 2 de atendimento ou informar equipe de vendas que tem um lead interessado em assinar. Os motivos para escalonar podem ser porque você não esta conseguindo resolver a demanda do cliente, porque ele ja estava falando com alguém ou porque esta interessado em assinar\",\n \"parameters\": {\n  \"type\": \"object\",\n  \"properties\": {\n   \"email\": {\n    \"type\": \"string\",\n    \"description\": \"Pedir o e-mal de cadastro do cliente. A informação do e-mail deve estar explícita na conversa, se não tiver precisa pedir. Um e-mail deve ter o padrão como por exemplo usuario@provedor.com, davigle@hotmail.com e etca\"\n   },\n   \"resumo\": {\n    \"type\": \"string\",\n    \"description\": \"Um resumo da da conversa e da demanda que deverá ser analisada pelo analista humano que irá ler o ticket de atendimento, incluindo o motivo pelo qual você não pode fazer o atendimento e teve que subir para o N2.\"\n   },\n   \"categoria\": {\n    \"type\": \"string\",\n    \"enum\": [\n     \"comercial\",\n     \"suporte\"\n    ],\n    \"description\": \"Função para transferir o atendimento para um segundo nível de atendimento (N2) os casos em que você não consiga resolver a demanda do cliente por aqui. Também transfira atendimentos de clientes que já demonstraram interesse em assinar um plano. Não peça para o cliente entrar em contato com nosso atendimento, transfira o atendimento usando essa função\"\n   }\n  },\n  \"required\": [\n   \"categoria\"\n  ]\n }\n}\n\n";
      instructions += "IMPORTANTE: parameters não pode ser vazio, se estiver vazio adicionar o campo date com a data de hoje, não incluir ```json ou ``` ou qualquer outro elemento que não o objeto json, as properties devem ter type e description, não inventar elementos que não existem nos exemplos, o json deve usar os exemplos informados sem inventar características não descrita em exemplo\n\nCriar uma função chamada "+ func.name+" com as seguintes instruções: "+func.descritivo;
      const req = {
        contents: [{role: 'user', parts: [{text: instructions}]}],
        generationConfig
      };

    const config = {
        headers: {
            'Content-Type': 'application/json'
        }
    };
    //console.log(JSON.stringify(req));

    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro-001:generateContent?key=';
    const key = prompt.apiKey;

    const chat: AxiosResponse<any> = await axios.post<ComplexApiResponse>(`${url}${key}`, req, config);

    let response = chat.data.candidates[0].content.parts[0].text;
    let formattedResponse = response.replace(/```json/g, '').replace(/```/g, '');
    console.log("RESPONSE", formattedResponse);
    if (response) {
        try {
            const jsonObject = JSON.parse(formattedResponse);
            await PromptFunction.update({ json: jsonObject }, {
                where: { id: func.id }
            });
            return jsonObject;
        } catch(e){
            throw new AppError(e.message);
        }
    }

}

export default GeneratePromptFunctionService;
