import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from "sequelize-typescript";
import Queue from "./Queue";
import Company from "./Company";
import PromptFunction from "./PromptFunction"; // Certifique-se de que o caminho está correto
import QueueIntegrations from "./QueueIntegrations"; 

@Table
class Prompt extends Model<Prompt> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @AllowNull(false)
  @Column
  name: string;

  @AllowNull(false)
  @Column
  prompt: string;

  @AllowNull(false)
  @Column
  apiKey: string;

  @Column({ defaultValue: 10 })
  maxMessages: number;

  @Column({ defaultValue: 100 })
  maxTokens: number;

  @Column({ defaultValue: 1 })
  temperature: number;

  @Column({ defaultValue: 0 })
  promptTokens: number;

  @Column({ defaultValue: 0 })
  completionTokens: number;

  @Column({ defaultValue: 0 })
  totalTokens: number;

  @AllowNull(false)
  @Column({defaultValue: 'Texto'})
  voice: string;

  @AllowNull(true)
  @Column
  voiceKey: string;

  @AllowNull(true)
  @Column
  voiceRegion: string;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  // Relação um-para-muitos com PromptFunction
  @HasMany(() => PromptFunction, {
    onDelete: 'CASCADE',
    hooks: true // Se necessário, para disparar hooks no PromptFunction
  })
  functions: PromptFunction[];

    // Adicionar a chave estrangeira para QueueIntegrations
    @AllowNull(true)
    @ForeignKey(() => QueueIntegrations)
    @Column
    queueIntegrationId: number;
  
    // Relacionamento BelongsTo com QueueIntegrations
    @BelongsTo(() => QueueIntegrations)
    queueIntegration: QueueIntegrations;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default Prompt;
