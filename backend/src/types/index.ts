export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  status: UserStatus;
  created_at: Date;
  updated_at: Date;
}

export interface Domain {
  id: number;
  user_id: number;
  domain: string;
  verified: boolean;
  is_verified?: boolean;
  verification_token: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Mailbox {
  id: number;
  domain_id: number;
  email: string;
  password_hash: string | null;
  quota: number;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

export interface MessageHeader {
  [key: string]: string | string[] | undefined;
}

export interface Message {
  id: number;
  mailbox_id: number;
  message_id: string | null;
  sender: string;
  recipient: string;
  subject: string | null;
  text_body: string | null;
  html_body: string | null;
  raw_message: string | null;
  headers: MessageHeader | null;
  mime_type: string;
  size: number;
  is_read: boolean;
  created_at: Date;
  expires_at: Date | null;
}

export interface Attachment {
  id: number;
  message_id: number;
  filename: string;
  mime_type: string;
  size: number;
  storage_path: string;
  created_at: Date;
}

export interface ApiKey {
  id: number;
  user_id: number;
  name: string;
  key_hash: string;
  last_used_at: Date | null;
  created_at: Date;
  expires_at: Date | null;
}

export interface Alias {
  id: number;
  domain_id: number;
  alias: string;
  destination: string;
  created_at: Date;
}

export interface Webhook {
  id: number;
  user_id: number;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface WebhookDelivery {
  id: number;
  webhook_id: number;
  event: string;
  payload: Record<string, unknown>;
  status_code: number | null;
  attempts: number;
  created_at: Date;
}

export interface Session {
  id: number;
  user_id: number;
  refresh_token_hash: string;
  expires_at: Date;
  created_at: Date;
}

export interface AuditLog {
  id: number;
  user_id: number | null;
  action: string;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  created_at: Date;
}

export interface JwtPayload {
  userId: number;
  email: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
