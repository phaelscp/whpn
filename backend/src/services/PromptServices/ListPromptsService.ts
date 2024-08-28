import { Op } from "sequelize";
import Prompt from "../../models/Prompt";
import PromptFunction from "../../models/PromptFunction";

interface Request {
  searchParam?: string;
  pageNumber?: string | number;
  companyId: string | number;
}

interface Response {
  prompts: Prompt[];
  count: number;
  hasMore: boolean;
}

const ListPromptsService = async ({
  searchParam = "",
  pageNumber = "1",
  companyId
}: Request): Promise<Response> => {
  let whereCondition = {};
  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  if (searchParam) {
    whereCondition = {
      [Op.or]: [
        { name: { [Op.like]: `%${searchParam}%` } }
      ]
    }
  }

  const { count, rows: prompts } = await Prompt.findAndCountAll({
    where: { ...whereCondition, companyId },
    include: [
      {
        model: PromptFunction, // Adicione esta linha para incluir o modelo PromptFunction
        as: "functions", // Use o alias apropriado
        attributes: ["id", "descritivo", "json", "name"] // Lista de atributos que você deseja incluir na consulta
      }
    ],
    limit,
    offset,
    order: [["name", "ASC"]],
});
  const hasMore = count > offset + prompts.length;

  return {
    prompts,
    count,
    hasMore
  };
};

export default ListPromptsService;
