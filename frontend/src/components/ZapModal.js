import React, { useState } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
} from "@material-ui/core";

const ZapModal = ({ open, onClose, onSave }) => {
  const [idZap, setIdZap] = useState("");
  const [tokenZap, setTokenZap] = useState("");

  const handleSave = () => {
    onSave({ idZap, tokenZap });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Insira as informações do WhatsApp Oficial</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="ID Zap"
          type="text"
          fullWidth
          value={idZap}
          onChange={(e) => setIdZap(e.target.value)}
        />
        <TextField
          margin="dense"
          label="Token Zap"
          type="text"
          fullWidth
          value={tokenZap}
          onChange={(e) => setTokenZap(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancelar
        </Button>
        <Button onClick={handleSave} color="primary">
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ZapModal;
