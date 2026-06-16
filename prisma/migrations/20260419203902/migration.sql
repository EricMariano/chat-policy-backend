-- CreateTable
CREATE TABLE "tb_permission_group_user" (
    "permission_group_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "tb_permission_group_user_pkey" PRIMARY KEY ("permission_group_id","user_id")
);

-- AddForeignKey
ALTER TABLE "tb_permission_group_user" ADD CONSTRAINT "tb_permission_group_user_permission_group_id_fkey" FOREIGN KEY ("permission_group_id") REFERENCES "tb_permission_group"("permission_group_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_permission_group_user" ADD CONSTRAINT "tb_permission_group_user_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "tb_user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
