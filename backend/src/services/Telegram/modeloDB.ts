// models/Message.ts

import { Table, Column, Model, DataType } from 'sequelize-typescript';

import { Sequelize } from 'sequelize-typescript';
import dotenv from 'dotenv';

dotenv.config();

@Table
export class MsgTelegram extends Model {
    @Column
    chatId!: string;

    @Column
    message!: string;

    @Column
    messageType!: string;

    @Column
    createdAt!: Date;

    @Column
    updatedAt!: Date;
}
const sequelize = new Sequelize({
    dialect: process.env.DB_DIALECT as any || 'postgres',
    database: process.env.DB_NAME || 'seu_banco_de_dados',
    username: process.env.DB_USER || 'seu_usuario',
    password: process.env.DB_PASS || 'sua_senha',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    models: [MsgTelegram], 

});
// Exporte o modelo
export default MsgTelegram;
