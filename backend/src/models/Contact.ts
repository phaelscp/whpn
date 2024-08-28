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
  Default,
  HasMany,
  ForeignKey,
  BelongsTo
} from "sequelize-typescript";
import ContactCustomField from "./ContactCustomField";
import Ticket from "./Ticket";
import Company from "./Company";
import Schedule from "./Schedule";
@Table
class Contact extends Model<Contact> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;
  @Column
  name: string;
  @AllowNull(false)
  @Unique
  @Column
  number: string;
  @AllowNull(false)
  @Default("")
  @Column
  email: string;
  @Default("")
  @Column
  profilePicUrl: string;
  @Default(false)
  @Column
  isGroup: boolean;
  @Default(false)
  @Column
  disableBot: boolean;
  @Default(true)
  @Column
  acceptAudioMessage: boolean;
  @Default(true)
  @Column
  active: boolean;
  @Default("whatsapp")
  @Column
  channel: string;
  @Column
  chatId: string;
  @CreatedAt
  createdAt: Date;
  @UpdatedAt
  updatedAt: Date;
  @HasMany(() => Ticket)
  tickets: Ticket[];
  @HasMany(() => ContactCustomField)
  extraInfo: ContactCustomField[];
  @ForeignKey(() => Company)
  @Column
  companyId: number;
  @Column
  typebotToken: string;
  @BelongsTo(() => Company)
  company: Company;
  @HasMany(() => Schedule, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true
  })
  schedules: Schedule[];
  public async updateTypebotToken(sessionId: string): Promise<void> {
    this.typebotToken = sessionId;
    await this.save();
  }
}

export default Contact;
