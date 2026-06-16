-- CreateTable
CREATE TABLE "tb_user" (
    "user_id" SERIAL NOT NULL,
    "email" VARCHAR(250) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "password" VARCHAR(80) NOT NULL,
    "registered_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type_user_id" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tb_user_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "tb_type_user" (
    "type_user_id" SERIAL NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tb_type_user_pkey" PRIMARY KEY ("type_user_id")
);

-- CreateTable
CREATE TABLE "tb_department" (
    "department_id" SERIAL NOT NULL,
    "department_nm" VARCHAR(100) NOT NULL,
    "acronym" VARCHAR(5) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tb_department_pkey" PRIMARY KEY ("department_id")
);

-- CreateTable
CREATE TABLE "tb_system" (
    "system_id" SERIAL NOT NULL,
    "system_nm" VARCHAR(80) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tb_system_pkey" PRIMARY KEY ("system_id")
);

-- CreateTable
CREATE TABLE "tb_file" (
    "file_id" UUID NOT NULL,
    "version" VARCHAR(10),
    "prev_file_id" UUID,
    "hash" VARCHAR(80) NOT NULL,
    "file_path" TEXT NOT NULL,
    "autor_id" INTEGER NOT NULL,

    CONSTRAINT "tb_file_pkey" PRIMARY KEY ("file_id")
);

-- CreateTable
CREATE TABLE "tb_file_system" (
    "system_id" INTEGER NOT NULL,
    "file_id" UUID NOT NULL,

    CONSTRAINT "tb_file_system_pkey" PRIMARY KEY ("system_id","file_id")
);

-- CreateTable
CREATE TABLE "tb_file_department" (
    "file_id" UUID NOT NULL,
    "department_id" INTEGER NOT NULL,

    CONSTRAINT "tb_file_department_pkey" PRIMARY KEY ("file_id","department_id")
);

-- CreateTable
CREATE TABLE "tb_change_file" (
    "audit_id" UUID NOT NULL,
    "old_file_id" UUID NOT NULL,
    "new_file_id" UUID NOT NULL,
    "autor_id" INTEGER NOT NULL,

    CONSTRAINT "tb_change_file_pkey" PRIMARY KEY ("audit_id")
);

-- CreateTable
CREATE TABLE "tb_chat" (
    "chat_id" UUID NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "tb_chat_pkey" PRIMARY KEY ("chat_id")
);

-- CreateTable
CREATE TABLE "tb_message" (
    "message_id" UUID NOT NULL,
    "chat_id" UUID NOT NULL,
    "message_text" TEXT NOT NULL,
    "send_dt" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "tb_message_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "tb_file_message" (
    "file_id" UUID NOT NULL,
    "file_path" VARCHAR(255) NOT NULL,
    "message_id" UUID NOT NULL,
    "send_dt" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "tb_file_message_pkey" PRIMARY KEY ("file_id")
);

-- CreateTable
CREATE TABLE "tb_model_ia" (
    "model_ia_id" SERIAL NOT NULL,
    "model_nm" VARCHAR(100) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tb_model_ia_pkey" PRIMARY KEY ("model_ia_id")
);

-- CreateTable
CREATE TABLE "tb_model_ia_key" (
    "model_ia_id" INTEGER NOT NULL,
    "model_key" UUID NOT NULL,
    "qtn_token" DECIMAL(16,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tb_model_ia_key_pkey" PRIMARY KEY ("model_ia_id","model_key")
);

-- CreateTable
CREATE TABLE "tb_permission_group" (
    "permission_group_id" SERIAL NOT NULL,
    "permission_group_nm" VARCHAR(100) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tb_permission_group_pkey" PRIMARY KEY ("permission_group_id")
);

-- CreateTable
CREATE TABLE "tb_permission_group_department" (
    "permission_group_id" INTEGER NOT NULL,
    "department_id" INTEGER NOT NULL,

    CONSTRAINT "tb_permission_group_department_pkey" PRIMARY KEY ("permission_group_id","department_id")
);

-- CreateTable
CREATE TABLE "tb_permission_group_system" (
    "permission_group_id" INTEGER NOT NULL,
    "system_id" INTEGER NOT NULL,

    CONSTRAINT "tb_permission_group_system_pkey" PRIMARY KEY ("permission_group_id","system_id")
);

-- CreateTable
CREATE TABLE "tb_role_chat" (
    "role_chat_id" INTEGER NOT NULL,
    "role_chat_nm" VARCHAR(80) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tb_role_chat_pkey" PRIMARY KEY ("role_chat_id")
);

-- CreateTable
CREATE TABLE "tb_shared_chat" (
    "chat_id" UUID NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role_chat_id" INTEGER NOT NULL,

    CONSTRAINT "tb_shared_chat_pkey" PRIMARY KEY ("chat_id","user_id")
);

-- CreateTable
CREATE TABLE "tb_token_history" (
    "message_id" UUID NOT NULL,
    "amount_token_spent" DECIMAL(8,2) NOT NULL,
    "register_dt" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "tb_token_history_pkey" PRIMARY KEY ("message_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tb_user_email_key" ON "tb_user"("email");

-- CreateIndex
CREATE INDEX "tb_user_email_idx" ON "tb_user"("email");

-- CreateIndex
CREATE INDEX "tb_user_type_user_id_idx" ON "tb_user"("type_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tb_department_acronym_key" ON "tb_department"("acronym");

-- CreateIndex
CREATE INDEX "tb_file_autor_id_idx" ON "tb_file"("autor_id");

-- CreateIndex
CREATE INDEX "tb_message_chat_id_idx" ON "tb_message"("chat_id");

-- CreateIndex
CREATE INDEX "tb_message_message_text_idx" ON "tb_message"("message_text");

-- CreateIndex
CREATE INDEX "tb_file_message_message_id_idx" ON "tb_file_message"("message_id");

-- AddForeignKey
ALTER TABLE "tb_user" ADD CONSTRAINT "tb_user_type_user_id_fkey" FOREIGN KEY ("type_user_id") REFERENCES "tb_type_user"("type_user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_file" ADD CONSTRAINT "tb_file_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "tb_user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_file" ADD CONSTRAINT "tb_file_prev_file_id_fkey" FOREIGN KEY ("prev_file_id") REFERENCES "tb_file"("file_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_file_system" ADD CONSTRAINT "tb_file_system_system_id_fkey" FOREIGN KEY ("system_id") REFERENCES "tb_system"("system_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_file_system" ADD CONSTRAINT "tb_file_system_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "tb_file"("file_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_file_department" ADD CONSTRAINT "tb_file_department_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "tb_file"("file_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_file_department" ADD CONSTRAINT "tb_file_department_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "tb_department"("department_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_change_file" ADD CONSTRAINT "tb_change_file_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "tb_user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_change_file" ADD CONSTRAINT "tb_change_file_old_file_id_fkey" FOREIGN KEY ("old_file_id") REFERENCES "tb_file"("file_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_change_file" ADD CONSTRAINT "tb_change_file_new_file_id_fkey" FOREIGN KEY ("new_file_id") REFERENCES "tb_file"("file_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_chat" ADD CONSTRAINT "tb_chat_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "tb_user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_message" ADD CONSTRAINT "tb_message_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "tb_chat"("chat_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_file_message" ADD CONSTRAINT "tb_file_message_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "tb_message"("message_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_model_ia_key" ADD CONSTRAINT "tb_model_ia_key_model_ia_id_fkey" FOREIGN KEY ("model_ia_id") REFERENCES "tb_model_ia"("model_ia_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_permission_group_department" ADD CONSTRAINT "tb_permission_group_department_permission_group_id_fkey" FOREIGN KEY ("permission_group_id") REFERENCES "tb_permission_group"("permission_group_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_permission_group_department" ADD CONSTRAINT "tb_permission_group_department_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "tb_department"("department_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_permission_group_system" ADD CONSTRAINT "tb_permission_group_system_permission_group_id_fkey" FOREIGN KEY ("permission_group_id") REFERENCES "tb_permission_group"("permission_group_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_permission_group_system" ADD CONSTRAINT "tb_permission_group_system_system_id_fkey" FOREIGN KEY ("system_id") REFERENCES "tb_system"("system_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_shared_chat" ADD CONSTRAINT "tb_shared_chat_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "tb_chat"("chat_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_shared_chat" ADD CONSTRAINT "tb_shared_chat_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "tb_user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_shared_chat" ADD CONSTRAINT "tb_shared_chat_role_chat_id_fkey" FOREIGN KEY ("role_chat_id") REFERENCES "tb_role_chat"("role_chat_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_token_history" ADD CONSTRAINT "tb_token_history_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "tb_message"("message_id") ON DELETE RESTRICT ON UPDATE CASCADE;
