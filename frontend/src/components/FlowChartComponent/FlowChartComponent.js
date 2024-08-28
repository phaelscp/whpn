import React, { useState, useEffect } from 'react';
import { Modal, Box, TextField, Button } from '@mui/material';

const MyComponent = ({ iframeSrc }) => {
  return (
    <div style={{ position: 'relative' }}>
      <iframe
        title="Flowise Editor"
        src={iframeSrc}
        style={{ width: '100%', height: '800px', border: 'none' }}
      />
      <style>
        {`
          /* Esconda o botão de voltar */
          .MuiButtonBase-root.MuiFab-root.MuiFab-circular.MuiFab-sizeSmall.MuiFab-primary.css-1rhbf4w {
            display: none;
          }

          /* Desative o botão de chat */
          .MuiFab-root {
            pointer-events: none;
            opacity: 0.5;
          }
        `}
      </style>
    </div>
  );
};

const App = () => {
  const [iframeSrc, setIframeSrc] = useState('');

  useEffect(() => {
    // Carrega o iframeSrc do localStorage quando o componente monta
    const storedIframeSrc = localStorage.getItem('iframeSrc');
    if (storedIframeSrc) {
      setIframeSrc(storedIframeSrc);
    } else {
      setIframeSrc('http://localhost:3000/canvas/be41c696-757f-4a20-a767-d71f869a07dc');
    }
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSrcChange = (event) => {
    setIframeSrc(event.target.value);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    // Armazena o iframeSrc no localStorage quando o modal fecha
    localStorage.setItem('iframeSrc', iframeSrc);
    setIsModalOpen(false);
  };

  return (
    <div>
      <Button variant="contained" color="primary" onClick={handleOpenModal}>
        Setar URL
      </Button>
      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
          }}
        >
          <h2 id="modal-modal-title">Configurações</h2>
          <TextField
            fullWidth
            id="iframeSrcInput"
            label="URL CANVAS FLOWISE"
            variant="outlined"
            value={iframeSrc}
            onChange={handleSrcChange}
            margin="normal"
          />
          <Button variant="contained" color="primary" onClick={handleCloseModal} style={{ marginTop: '20px' }}>
            Salvar
          </Button>
        </Box>
      </Modal>
      <MyComponent iframeSrc={iframeSrc} />
    </div>
  );
};

export default App;
