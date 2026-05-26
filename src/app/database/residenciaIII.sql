CREATE TABLE "tb_user" (
  "user_id" int PRIMARY KEY,
  "email" varchar(250) NOT NULL,
  "name" varchar(150) NOT NULL,
  "password" varchar(80) NOT NULL,
  "registered_at" timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  "type_user_id" int NOT NULL,
  "active" boolean NOT NULL DEFAULT true
);

CREATE TABLE "tb_department" (
  "department_id" int PRIMARY KEY,
  "department_nm" varchar(100) NOT NULL,
  "acronym" varchar(5) NOT NULL,
  "active" boolean NOT NULL DEFAULT true
);

CREATE TABLE "tb_system" (
  "system_id" int PRIMARY KEY,
  "system_nm" varchar(80) NOT NULL,
  "active" boolean NOT NULL DEFAULT true
);

CREATE TABLE "tb_file_system" (
  "system_id" int,
  "file_id" uuid,
  PRIMARY KEY ("system_id", "file_id")
);

CREATE TABLE "tb_file_department" (
  "file_id" uuid,
  "department_id" int,
  PRIMARY KEY ("file_id", "department_id")
);

CREATE TABLE "tb_type_user" (
  "type_user_id" int PRIMARY KEY,
  "name" varchar(80) NOT NULL,
  "active" boolean NOT NULL DEFAULT true
);

CREATE TABLE "tb_change_file" (
  "audit_id" uuid PRIMARY KEY,
  "old_file_id" uuid NOT NULL,
  "new_file_id" uuid NOT NULL,
  "autor_id" int NOT NULL
);

CREATE TABLE "tb_file" (
  "file_id" uuid PRIMARY KEY,
  "version" varchar(10),
  "prev_file_id" uuid,
  "hash" varchar(80) NOT NULL,
  "file_path" text NOT NULL,
  "autor_id" int NOT NULL
);

CREATE TABLE "tb_chat" (
  "chat_id" uuid PRIMARY KEY,
  "title" varchar(100) NOT NULL,
  "user_id" int NOT NULL
);

CREATE TABLE "tb_shared_chat" (
  "chat_id" uuid,
  "user_id" int,
  "role_chat_id" int NOT NULL,
  PRIMARY KEY ("chat_id", "user_id")
);

CREATE TABLE "tb_role_chat" (
  "role_chat_id" int PRIMARY KEY,
  "role_chat_nm" varchar(80) NOT NULL,
  "active" boolean NOT NULL DEFAULT true
);

CREATE TABLE "tb_message" (
  "message_id" uuid PRIMARY KEY,
  "chat_id" uuid NOT NULL,
  "message_text" text NOT NULL,
  "send_dt" timestamp NOT NULL
);

CREATE TABLE "tb_file_message" (
  "file_id" uuid PRIMARY KEY,
  "file_path" varchar(255) NOT NULL,
  "message_id" uuid NOT NULL,
  "send_dt" timestamp NOT NULL
);

CREATE TABLE "tb_model_ia" (
  "model_ia_id" int PRIMARY KEY,
  "model_nm" varchar(100) NOT NULL,
  "active" boolean NOT NULL DEFAULT true
);

CREATE TABLE "tb_model_ia_key" (
  "model_ia_id" int,
  "model_key" uuid NOT NULL,
  "qtn_token" decimal(16,2) NOT NULL,
  "active" boolean NOT NULL DEFAULT true,
  PRIMARY KEY ("model_ia_id", "model_key")
);

CREATE TABLE "tb_token_history" (
  "message_id" uuid PRIMARY KEY,
  "amount_token_spent" decimal(8,2) NOT NULL,
  "register_dt" timestamp NOT NULL
);

CREATE TABLE "tb_permission_group" (
  "permission_group_id" int PRIMARY KEY,
  "permission_group_nm" varchar(100) NOT NULL,
  "active" boolean NOT NULL DEFAULT true
);

CREATE TABLE "tb_permission_group_user" (
  "permission_group_id" int,
  "user_id" int,
  PRIMARY KEY ("permission_group_id", "user_id")
);

CREATE TABLE "tb_permission_group_department" (
  "permission_group_id" int,
  "department_id" int,
  PRIMARY KEY ("permission_group_id", "department_id")
);

CREATE TABLE "tb_permission_group_system" (
  "permission_group_id" int,
  "system_id" int,
  PRIMARY KEY ("permission_group_id", "system_id")
);

CREATE INDEX ON "tb_message" ("chat_id");

CREATE INDEX ON "tb_message" ("message_text");

CREATE INDEX ON "tb_file_message" ("message_id");

ALTER TABLE "tb_user" ADD FOREIGN KEY ("type_user_id") REFERENCES "tb_type_user" ("type_user_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "tb_file_system" ADD FOREIGN KEY ("system_id") REFERENCES "tb_system" ("system_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "tb_file_system" ADD FOREIGN KEY ("file_id") REFERENCES "tb_file" ("file_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "tb_file_department" ADD FOREIGN KEY ("department_id") REFERENCES "tb_department" ("department_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "tb_file_department" ADD FOREIGN KEY ("file_id") REFERENCES "tb_file" ("file_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "tb_change_file" ADD FOREIGN KEY ("autor_id") REFERENCES "tb_user" ("user_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "tb_change_file" ADD FOREIGN KEY ("new_file_id") REFERENCES "tb_file" ("file_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "tb_change_file" ADD FOREIGN KEY ("old_file_id") REFERENCES "tb_file" ("file_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "tb_file" ADD FOREIGN KEY ("autor_id") REFERENCES "tb_user" ("user_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "tb_chat" ADD FOREIGN KEY ("user_id") REFERENCES "tb_user" ("user_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "tb_shared_chat" ADD FOREIGN KEY ("chat_id") REFERENCES "tb_chat" ("chat_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "tb_shared_chat" ADD FOREIGN KEY ("user_id") REFERENCES "tb_user" ("user_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "tb_shared_chat" ADD FOREIGN KEY ("role_chat_id") REFERENCES "tb_role_chat" ("role_chat_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "tb_message" ADD FOREIGN KEY ("chat_id") REFERENCES "tb_chat" ("chat_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "tb_file_message" ADD FOREIGN KEY ("message_id") REFERENCES "tb_message" ("message_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "tb_token_history" ADD FOREIGN KEY ("message_id") REFERENCES "tb_message" ("message_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "tb_model_ia_key" ADD FOREIGN KEY ("model_ia_id") REFERENCES "tb_model_ia" ("model_ia_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "tb_permission_group_user" ADD FOREIGN KEY ("permission_group_id") REFERENCES "tb_permission_group" ("permission_group_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "tb_permission_group_user" ADD FOREIGN KEY ("user_id") REFERENCES "tb_user" ("user_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "tb_permission_group_department" ADD FOREIGN KEY ("permission_group_id") REFERENCES "tb_permission_group" ("permission_group_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "tb_permission_group_department" ADD FOREIGN KEY ("department_id") REFERENCES "tb_department" ("department_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "tb_permission_group_system" ADD FOREIGN KEY ("permission_group_id") REFERENCES "tb_permission_group" ("permission_group_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "tb_permission_group_system" ADD FOREIGN KEY ("system_id") REFERENCES "tb_system" ("system_id") DEFERRABLE INITIALLY IMMEDIATE;
