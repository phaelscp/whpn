import React, { useEffect, useState, useContext } from 'react';
import { useHistory } from "react-router-dom";
import toastError from "../../errors/toastError";
import api from "../../services/api";

import Avatar from "@material-ui/core/Avatar";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";

import { AuthContext } from "../../context/Auth/AuthContext";

import { Button, Divider, } from "@material-ui/core";

// Importa componente para pesquisar se o contato existe na lista de contatos
import useContacts from "../../hooks/useContacts";

const VcardPreview = ({ contact, numbers }) => {
    
    const history = useHistory();
    const { user } = useContext(AuthContext);
    const companyId = localStorage.getItem("companyId");
    const [selectedQueue, setSelectedQueue] = useState("1");
    const [selectedWhatsapp, setSelectedWhatsapp] = useState("");
    const [selectedContact, setContact] = useState({
        name: "",
        number: "",
        profilePicUrl: ""
    });
    // Passa como parametro o numero do contato que foi recebido
    const { contacts } = useContacts({
        searchParam: numbers,
        pageNumber: 1,
        date: "",
        dateStart: "",
        dateEnd: ""
    });

    // Faz a verificação se o numero recebido ja está na lista de contatos
    const contactWithPhoneNumber = contacts.find(contact => contact.number === numbers);

    // Salva o contato na lista de contatos e recarrega a pagina ao salvar.
    const SaveContact = async (contatos,numberos) => {
        try {
            let contactObj = {
                name: contatos,
                number: numberos.replace(/\D/g, ""),
                email: "",
                companyId
            }
            const { data } = await api.post("/criar", contactObj);
            setContact(data);
            window.location.reload();
        } catch (err) {
            console.log(err);
            toastError(err);
        }
    };

    // Cria um novo chat com esse contato recebido 
    const handleNewChat = async () => {
        try {
            if (contactWithPhoneNumber) {
                const queueId = selectedQueue || null;
                console.log("Queue ID:", queueId);
                console.log("Contact ID:", contactWithPhoneNumber.id);
                console.log("User ID:", user.id);
                console.log("Company ID:", companyId);
                const { data: ticket } = await api.post("/tickets", {
                    contactId: contactWithPhoneNumber.id,
                    userId: user.id,
                    status: "pending",
                    companyId,
                    queueId
                });
                history.push(`/tickets/${ticket.uuid}`);
            } else {
                const contactObj = {
                    name: contact,
                    number: numbers.replace(/\D/g, ""),
                    email: ""
                };
                await SaveContact(contactObj);
            }
        } catch (err) {
            console.log("Error creating new chat:", err);
            toastError(err);
        }
    };

    return (
		<>
			<div style={{
				minWidth: "250px",
			}}>
				<Grid container spacing={1}>
					<Grid item xs={2}>
						<Avatar src={contactWithPhoneNumber ? contactWithPhoneNumber.profilePicUrl : ''} />
					</Grid>
					<Grid item xs={9}>
						<Typography style={{ marginTop: "12px", marginLeft: "10px" }} variant="subtitle1" color="primary" gutterBottom>
							{contactWithPhoneNumber ? contactWithPhoneNumber.name : contact}
						</Typography>
					</Grid>
					
			
			                <Grid item xs={12}>
			                    <Button fullWidth color="primary" onClick={() => SaveContact(contact,numbers)} disabled={contactWithPhoneNumber?.number}>
			                        Salvar
			                    </Button>
			                </Grid>
				</Grid>
			</div>
		</>
	);

};

export default VcardPreview;
