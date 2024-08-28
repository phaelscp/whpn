import {
    AllowNull,
    AutoIncrement,
    BelongsTo,
    Column,
    CreatedAt,
    DataType,
    ForeignKey,
    Model,
    PrimaryKey,
    Table,
    UpdatedAt
  } from "sequelize-typescript";
  import Prompt from "./Prompt";
  
  @Table
  class PromptFunction extends Model<PromptFunction> {
    @PrimaryKey
    @AutoIncrement
    @Column
    id: number;
  
    @AllowNull(false)
    @ForeignKey(() => Prompt)
    @Column
    promptId: number;
  
    @BelongsTo(() => Prompt)
    prompt: Prompt;
  
    @AllowNull(false)
    @Column(DataType.TEXT)
    descritivo: string;
  
    @AllowNull(true)
    @Column(DataType.JSON)
    json: object;
  
    @Column(DataType.STRING(60))
    name: string;
  
    @CreatedAt
    createdAt: Date;
  
    @UpdatedAt
    updatedAt: Date;
  }
  
  export default PromptFunction;  