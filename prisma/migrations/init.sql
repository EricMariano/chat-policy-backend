-- Criação das sequences para IDs autoincrementais
CREATE SEQUENCE IF NOT EXISTS tb_user_user_id_seq;
CREATE SEQUENCE IF NOT EXISTS tb_type_user_type_user_id_seq;
CREATE SEQUENCE IF NOT EXISTS tb_department_department_id_seq;
CREATE SEQUENCE IF NOT EXISTS tb_system_system_id_seq;
CREATE SEQUENCE IF NOT EXISTS tb_chat_chat_id_seq;
CREATE SEQUENCE IF NOT EXISTS tb_model_ia_model_ia_id_seq;
CREATE SEQUENCE IF NOT EXISTS tb_permission_group_permission_group_id_seq;

-- Tabela de tipos de usuário
CREATE TABLE IF NOT EXISTS "tb_type_user" (
  "type_user_id" int PRIMARY KEY DEFAULT nextval('tb_type_user_type_user_id_seq'),
  "name" varchar(80) NOT NULL,
  "active" boolean NOT NULL DEFAULT true
);

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS "tb_user" (
  "user_id" int PRIMARY KEY DEFAULT nextval('tb_user_user_id_seq'),
  "email" varchar(250) NOT NULL,
  "name" varchar(150) NOT NULL,
  "password" varchar(80) NOT NULL,
  "registered_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "type_user_id" int NOT NULL,
  "active" boolean NOT NULL DEFAULT true,
  FOREIGN KEY ("type_user_id") REFERENCES "tb_type_user" ("type_user_id")
);

-- Tabela de departamentos
CREATE TABLE IF NOT EXISTS "tb_department" (
  "department_id" int PRIMARY KEY DEFAULT nextval('tb_department_department_id_seq'),
  "department_nm" varchar(100) NOT NULL,
  "acronym" varchar(5) NOT NULL,
  "active" boolean NOT NULL DEFAULT true
);

-- Tabela de sistemas
CREATE TABLE IF NOT EXISTS "tb_system" (
  "system_id" int PRIMARY KEY DEFAULT nextval('tb_system_system_id_seq'),
  "system_nm" varchar(80) NOT NULL,
  "active" boolean NOT NULL DEFAULT true
);

-- Tabela de arquivos
CREATE TABLE IF NOT EXISTS "tb_file" (
  "file_id" uuid PRIMARY KEY,
  "hash" varchar(80) NOT NULL,
  "file_path" varchar(255) NOT NULL,
  "autor_id" int NOT NULL,
  FOREIGN KEY ("autor_id") REFERENCES "tb_user" ("user_id")
);

-- Tabela de relacionamento arquivo-sistema
CREATE TABLE IF NOT EXISTS "tb_file_system" (
  "system_id" int,
  "file_id" uuid,
  PRIMARY KEY ("system_id", "file_id"),
  FOREIGN KEY ("system_id") REFERENCES "tb_system" ("system_id"),
  FOREIGN KEY ("file_id") REFERENCES "tb_file" ("file_id")
);

-- Tabela de relacionamento arquivo-departamento
CREATE TABLE IF NOT EXISTS "tb_file_department" (
  "file_id" uuid,
  "department_id" int,
  PRIMARY KEY ("file_id", "department_id"),
  FOREIGN KEY ("department_id") REFERENCES "tb_department" ("department_id"),
  FOREIGN KEY ("file_id") REFERENCES "tb_file" ("file_id")
);

-- Tabela de auditoria
CREATE TABLE IF NOT EXISTS "tb_audit" (
  "audit_id" uuid PRIMARY KEY,
  "old_file_id" uuid NOT NULL,
  "new_file_id" uuid NOT NULL,
  "autor_id" int NOT NULL,
  FOREIGN KEY ("autor_id") REFERENCES "tb_user" ("user_id"),
  FOREIGN KEY ("new_file_id") REFERENCES "tb_file" ("file_id"),
  FOREIGN KEY ("old_file_id") REFERENCES "tb_file" ("file_id")
);

-- Tabela de chats
CREATE TABLE IF NOT EXISTS "tb_chat" (
  "chat_id" int PRIMARY KEY DEFAULT nextval('tb_chat_chat_id_seq'),
  "title" varchar(100) NOT NULL,
  "user_id" int NOT NULL,
  FOREIGN KEY ("user_id") REFERENCES "tb_user" ("user_id")
);

-- Tabela de mensagens
CREATE TABLE IF NOT EXISTS "tb_message" (
  "message_id" uuid PRIMARY KEY,
  "chat_id" int NOT NULL,
  "message_text" text NOT NULL,
  "send_dt" timestamp NOT NULL,
  FOREIGN KEY ("chat_id") REFERENCES "tb_chat" ("chat_id")
);

-- Tabela de arquivos de mensagem
CREATE TABLE IF NOT EXISTS "tb_file_message" (
  "file_id" uuid PRIMARY KEY,
  "file_path" varchar(255) NOT NULL,
  "message_id" uuid NOT NULL,
  "send_dt" timestamp NOT NULL,
  FOREIGN KEY ("message_id") REFERENCES "tb_message" ("message_id")
);

-- Tabela de modelos de IA
CREATE TABLE IF NOT EXISTS "tb_model_ia" (
  "model_ia_id" int PRIMARY KEY DEFAULT nextval('tb_model_ia_model_ia_id_seq'),
  "model_nm" varchar(100) NOT NULL,
  "active" boolean NOT NULL DEFAULT true
);

-- Tabela de chaves de modelo de IA
CREATE TABLE IF NOT EXISTS "tb_model_ia_key" (
  "model_id_id" int,
  "model_key" uuid NOT NULL,
  "active" boolean NOT NULL DEFAULT true,
  PRIMARY KEY ("model_id_id", "model_key"),
  FOREIGN KEY ("model_id_id") REFERENCES "tb_model_ia" ("model_ia_id")
);

-- Tabela de grupos de permissão
CREATE TABLE IF NOT EXISTS "tb_permission_group" (
  "permission_group_id" int PRIMARY KEY DEFAULT nextval('tb_permission_group_permission_group_id_seq'),
  "permission_group_nm" varchar(100) NOT NULL,
  "active" boolean NOT NULL DEFAULT true
);

-- Tabela de relacionamento grupo de permissão-departamento
CREATE TABLE IF NOT EXISTS "tb_permission_group_department" (
  "permission_group_id" int,
  "department_id" int,
  PRIMARY KEY ("permission_group_id", "department_id"),
  FOREIGN KEY ("permission_group_id") REFERENCES "tb_permission_group" ("permission_group_id"),
  FOREIGN KEY ("department_id") REFERENCES "tb_department" ("department_id")
);

-- Tabela de relacionamento grupo de permissão-sistema
CREATE TABLE IF NOT EXISTS "tb_permission_group_system" (
  "permission_group_id" int,
  "system_id" int,
  PRIMARY KEY ("permission_group_id", "system_id"),
  FOREIGN KEY ("permission_group_id") REFERENCES "tb_permission_group" ("permission_group_id"),
  FOREIGN KEY ("system_id") REFERENCES "tb_system" ("system_id")
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_message_chat_id ON "tb_message" ("chat_id");
CREATE INDEX IF NOT EXISTS idx_message_text ON "tb_message" ("message_text");
CREATE INDEX IF NOT EXISTS idx_file_message_message_id ON "tb_file_message" ("message_id");
