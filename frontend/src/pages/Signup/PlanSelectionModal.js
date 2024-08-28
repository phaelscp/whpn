import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@material-ui/core";

const PlanSelectionModal = ({ plans, open, onClose, onPlanSelect }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Selecione um Plano</DialogTitle>
      <DialogContent>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Plano</TableCell>
              <TableCell>Atendentes</TableCell>
              <TableCell>Conexões</TableCell>
              <TableCell>Filas</TableCell>
              <TableCell>Preço</TableCell>
              <TableCell>Selecione</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {plans.map((plan, key) => (
              <TableRow key={key}>
                <TableCell>{plan.name}</TableCell>
                <TableCell>{plan.users}</TableCell>
                <TableCell>{plan.connections}</TableCell>
                <TableCell>{plan.queues}</TableCell>
                <TableCell>
                {plan.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => onPlanSelect(plan)}
                    style={{ backgroundColor: "#086E54", color: "#fff" }}
                  >
                    Selecionar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PlanSelectionModal;
