import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Contact } from './contact.entity';
import { GroupMember } from './group-member.entity';
import { Message } from './message.entity';
import { Mention } from './mention.entity';
import { Group } from './group.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 30, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 80 })
  display_name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'text', select: false })
  password_hash: string;

  @Column({ type: 'text', default: '' })
  bio: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  updated_at: Date;

  @OneToMany(() => Contact, (contact) => contact.owner)
  contacts: Contact[];

  @OneToMany(() => Group, (group) => group.creator)
  created_groups: Group[];

  @OneToMany(() => GroupMember, (member) => member.user)
  group_memberships: GroupMember[];

  @OneToMany(() => Message, (message) => message.sender)
  messages: Message[];

  @OneToMany(() => Mention, (mention) => mention.mentioned_user)
  mentions: Mention[];
}
