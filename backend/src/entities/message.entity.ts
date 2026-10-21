import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Group } from './group.entity';
import { User } from './user.entity';
import { Mention } from './mention.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  group_id: string;

  @Column({ type: 'uuid' })
  sender_id: string;

  @Column({ type: 'varchar', length: 2000 })
  content: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  created_at: Date;

  @ManyToOne(() => Group, (group) => group.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @ManyToOne(() => User, (user) => user.messages, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @OneToMany(() => Mention, (mention) => mention.message)
  mentions: Mention[];
}
