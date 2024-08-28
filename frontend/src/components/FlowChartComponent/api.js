import axios from 'axios';

const getFlowData = async () => {
  try {
    const response = await axios.get('http://seu-backend.com/api/fluxograma');
    return response.data;
  } catch (error) {
    console.error('Erro ao obter os dados do fluxograma:', error);
    throw error;
  }
};

export default getFlowData;
