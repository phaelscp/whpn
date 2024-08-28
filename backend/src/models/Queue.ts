import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Unique,
  BelongsToMany,
  BelongsTo,
  ForeignKey,
  HasMany,
  DataType,
  Default
} from "sequelize-typescript";
import User from "./User";
import UserQueue from "./UserQueue";
import Company from "./Company";
import Whatsapp from "./Whatsapp";
import WhatsappQueue from "./WhatsappQueue";
import Chatbot from "./Chatbot";

@Table
class Queue extends Model<Queue> {
  [x: string]: any;
  static map(arg0: (queue: any, index: any) => string) {
    throw new Error("Method not implemented.");
  }

  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @AllowNull(false)
  @Unique
  @Column
  name: string;

  @AllowNull(false)
  @Unique
  @Column
  color: string;

  @Default("")
  @Column
  greetingMessage: string;

  @Default("")
  @Column
  outOfHoursMessage: string;

  @Column({ type: DataType.JSONB })
  schedules: [];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @Column
  typebotToken: string;

  @Column
  typebotUrl: string;

  @Column
  urlFlow: string;

  @Column
  tokenFlow: string;

  @Column
  typebotName: string;

  @BelongsTo(() => Company)
  company: Company;

  @BelongsToMany(() => Whatsapp, () => WhatsappQueue)
  whatsapps: Array<Whatsapp & { WhatsappQueue: WhatsappQueue }>;

  @BelongsToMany(() => User, () => UserQueue)
  users: Array<User & { UserQueue: UserQueue }>;

  @HasMany(() => Chatbot, {
    onDelete: "DELETE",
    onUpdate: "DELETE",
    hooks: true
  })
  chatbots: Chatbot[];
}

export default Queue;
