import React, { useState } from "react";
import {
    makeStyles,
    Paper,
    Grid,
    Button,
    CircularProgress
} from "@material-ui/core";
import { toast } from "react-toastify";

const useStyles = makeStyles(theme => ({
    root: {
        width: '100%'
    },
    mainPaper: {
        width: '100%',
        flex: 1,
        padding: theme.spacing(2)
    },
    buttonContainer: {
        textAlign: 'right',
        padding: theme.spacing(1)
    },
    button: {
        margin: theme.spacing(1)
    }
}));
export default function OutrosAjustes() {
    const classes = useStyles();
    const [loading, setLoading] = useState(false);

    const handleBackupDatabase = async () => {
        setLoading(true);
        try {
            const response = await fetch('/backup-database', {
                method: 'GET',
            });
            setLoading(false);
            if (response.ok) {
                toast.success('Backup realizado com sucesso!');
            } else {
                toast.error('Falha ao realizar o backup.');
            }
        } catch (error) {
            setLoading(false);
            console.error('Erro ao fazer o backup:', error);
            toast.error('Erro ao fazer o backup.');
        }
    };

    return (
        <Paper className={classes.mainPaper} elevation={0}>
            <Grid container spacing={2}>
                <Grid item xs={12} className={classes.buttonContainer}>
                    <Button
                        variant="contained"
                        color="primary"
                        className={classes.button}
                        onClick={handleBackupDatabase}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Fazer Backup'}
                    </Button>
                </Grid>
            </Grid>
        </Paper>
    );
}
