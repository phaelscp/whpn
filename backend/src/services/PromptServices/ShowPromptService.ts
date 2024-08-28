import AppError from "../../errors/AppError";
import Prompt from "../../models/Prompt";
import PromptFunction from "../../models/PromptFunction";

interface Data {
  promptId: string | number;
  companyId: string | number;
}

const ShowPromptService = async ({ promptId, companyId }) => {
  const prompt = await Prompt.findOne({
    where: { id: promptId, companyId },
    include: [{ model: PromptFunction, as: 'functions' }]
  });

  if (!prompt)
    throw new AppError("ERR_NO_PROMPT_FOUND", 404);

  return prompt;
};
export default ShowPromptService;
