import React from "react";
import {useParams} from "react-router-dom";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import {makeStyles, useTheme} from "@material-ui/core/styles"; // Importe useTheme aqui

import TicketsManager from "../../components/TicketsManagerTabs/";
import Ticket from "../../components/Ticket/";

import { QueueSelectedProvider } from "../../context/QueuesSelected/QueuesSelectedContext";

import {i18n} from "../../translate/i18n";
import useSettings from "../../hooks/useSettings";

const logo = "assets/vector/logo.svg";
const logoDark = "assets/vector/logo-dark.svg";


const useStyles = makeStyles((theme) => ({
    chatContainer: {
        flex: 1,
        padding: theme.spacing(1),
        height: `calc(100% - 48px)`,
        overflowY: "hidden",
    },

    chatPapper: {
        display: "flex",
        height: "100%",
    },

    contactsWrapper: {
        display: "flex",
        height: "100%",
        flexDirection: "column",
        overflowY: "hidden",
    },
    messagesWrapper: {
        display: "flex",
        height: "100%",
        flexDirection: "column",
    },
    welcomeMsg: {
        backgroundColor: theme.palette.boxticket,
        display: "flex",
        justifyContent: "space-evenly",
        alignItems: "center",
        height: "100%",
        textAlign: "center",
    },

    logoImg: {
        margin: "0 auto",
        width: "80%",
        content: "url(" + ((theme.appLogoLight || theme.appLogoDark) ? process.env.REACT_APP_BACKEND_URL+"/public/"+  (theme.mode === "light" ? theme.appLogoLight || theme.appLogoDark : theme.appLogoDark || theme.appLogoLight  )   : (theme.mode === "light" ? theme.appLogoLight : theme.appLogoDark)) + ")"
      },
}));

const TicketsCustom = () => {
    const classes = useStyles();
    const {ticketId} = useParams();
    const { getPublicSetting } = useSettings();
    const theme = useTheme(); // Obtenha o objeto theme usando useTheme

    return (
        <QueueSelectedProvider>
            <div className={classes.chatContainer}>
                <div className={classes.chatPapper}>
                    <Grid container spacing={0}>
                        <Grid item xs={4} className={classes.contactsWrapper}>
                            <TicketsManager/>
                        </Grid>
                        <Grid item xs={8} className={classes.messagesWrapper}>
                            {ticketId ? (
                                <>
                                    <Ticket/>
                                </>
                            ) : (
                                <Paper square variant="outlined" className={classes.welcomeMsg}>
                                    <div>
                                        <center>
                                            <div className={"container-img"}>
                                                <img className={classes.logoImg} />
                                            </div>
                                        </center>
                                    </div>
                                </Paper>
                            )}
                        </Grid>
                    </Grid>
                </div>
            </div>
        </QueueSelectedProvider>
    );
};

export default TicketsCustom;
