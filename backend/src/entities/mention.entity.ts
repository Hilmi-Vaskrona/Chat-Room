import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Message } from './message.entity';
import { User } from './user.entity';

@Entity('mentions')
@Unique(['message_id', 'mentioned_user_id'])
export class Mention {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  message_id: string;

  @Column({ type: 'uuid' })
  mentioned_user_id: string;

  @Column({ type: 'boolean', default: false })
  is_read: boolean;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  created_at: Date;

  @ManyToOne(() => Message, (message) => message.mentions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'message_id' })
  message: Message;

  @ManyToOne(() => User, (user) => user.mentions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mentioned_user_id' })
  mentioned_user: User;
}
