import React from "react";
import Modal from "@material-ui/core/Modal";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  modalContent: {
    position: "absolute",
    width: "90%",
    maxWidth: 600,
    backgroundColor: theme.palette.background.paper,
    border: "2px solid #000",
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2),
    top: "50%",           // Centraliza verticalmente
    left: "50%",
    transform: "translate(-50%, -50%)",
    margin: "10px",
    borderRadius: 8,
    fontFamily: "Arial, sans-serif", // Define a fonte
    fontSize: "16px", // Define o tamanho da fonte
    lineHeight: "1.6", // Define o espaçamento entre linhas
    overflowY: "auto", // Adiciona barra de rolagem vertical
    maxHeight: "80vh", // Define a altura máxima
    "&::-webkit-scrollbar": {
      width: "6px", // Largura da barra de rolagem
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "#086E54", // Cor verde semelhante ao botão
      borderRadius: "8px",
    },
  },
  closeButtonContainer: {
    display: "flex",
    justifyContent: "center", // Centraliza horizontalmente
    marginTop: theme.spacing(2),
  },
  closeButton: {
    backgroundColor: "#086E54",
    color: "#fff",
    borderRadius: 8,
    "&:hover": {
      backgroundColor: "#065944",
    },
  },
}));

const TermosModal = ({ open, onClose }) => {
  const classes = useStyles();

  const termsContent = `
    <div class="box">
      Ao se cadastrar na MultiChat, você concorda com os seguintes termos de uso:</br>
      <ol>
        <li><strong>Uso dos Serviços</strong><br/>
          Ao utilizar nossos serviços de chatbot para Facebook, WhatsApp e Instagram, você concorda em obedecer a todas as leis e regulamentações aplicáveis. O uso para atividades ilegais, fraudulentas, abusivas ou prejudiciais não é permitido.</li>
        <li><strong>Propriedade Intelectual</strong><br/>
          Todos os direitos de propriedade intelectual relacionados aos nossos serviços são de propriedade da MultiChat ou estão licenciados para nós. Qualquer uso não autorizado é estritamente proibido.</li>
        <li><strong>Privacidade e Segurança</strong><br/>
          Estamos comprometidos em proteger sua privacidade. Nossa Política de Privacidade detalha como coletamos, usamos e protegemos seus dados pessoais.</li>
        <li><strong>Responsabilidade</strong><br/>
          A MultiChat não se responsabiliza por quaisquer danos diretos, indiretos, incidentais ou consequenciais decorrentes do uso ou incapacidade de uso de nossos serviços.</li>
        <li><strong>Alterações nos Termos</strong><br/>
          Reservamos o direito de modificar estes termos a qualquer momento. Alterações significativas serão notificadas. O uso contínuo de nossos serviços após as alterações constitui aceitação dos novos termos.</li>
      </ol>
      <strong>Política de Privacidade</strong><br/>
      Nossa Política de Privacidade explica como coletamos, usamos e protegemos seus dados pessoais.</br>
      <strong>Política de Cookies</strong><br/>
      Nossa Política de Cookies descreve como usamos cookies e tecnologias similares para melhorar a experiência do usuário.</br>
      Ao utilizar nossos serviços, você concorda com os Termos de Uso, Política de Privacidade e Política de Cookies da MultiChat. Para dúvidas, entre em contato conosco em <a href="mailto:contato@multichat.com">contato@multichat.com</a>.</br>
      Data da última atualização: 22/06/2023</br>
      Atenciosamente,</br>
      Equipe MultiChat</br>
    </div>
  `;

  return (
    <Modal open={open} onClose={onClose}>
      <div className={classes.modalContent}>
        <Typography variant="h6" align="center">Termos de Uso</Typography>
        <Typography variant="body1" dangerouslySetInnerHTML={{ __html: termsContent }} />
        <div className={classes.closeButtonContainer}>
          <Button
            variant="contained"
            className={classes.closeButton}
            onClick={onClose}
          >
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TermosModal;
