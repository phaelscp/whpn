import React from 'react';
import {
    makeStyles,
    Paper,
    Button
} from "@material-ui/core";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles(theme => ({
    mainPaper: {
        width: '100%',
        minHeight: '200px',
        overflowY: "scroll",
        ...theme.scrollbarStyles,
    },
    button: {
        margin: theme.spacing(1),
    },
}));

const OutrosAjustes = () => {
    const classes = useStyles();

    const handleBackupDatabase = async () => {
        try {
            const response = await fetch('/backup-database', {
                method: 'GET',
            });
            if (response.ok) {
                alert('Backup realizado com sucesso!');
            } else {
                alert('Falha ao realizar o backup.');
            }
        } catch (error) {
            console.error('Erro ao fazer o backup:', error);
            alert('Erro ao fazer o backup.');
        }
    };

    return (
        <MainContainer>
            <MainHeader>
                <Title>{i18n.t("outrosAjustes.title")}</Title>
                <MainHeaderButtonsWrapper>
                </MainHeaderButtonsWrapper>
            </MainHeader>
            <Paper className={classes.mainPaper} variant="outlined">
                <Button
                    variant="contained"
                    color="primary"
                    className={classes.button}
                    onClick={handleBackupDatabase}
                >
                    Fazer Backup
                </Button>
            </Paper>
        </MainContainer>
    );
};

export default OutrosAjustes;
