// Use este bloco para entender a estrutura de tabelas e tipos
Table tb_user {
  user_id int [pk]
  email varchar(250) [not null]
  name varchar(150) [not null]
  password varchar(80) [not null]
  registered_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  type_user_id int [not null] 
  active boolean [not null, default: true]
}

Table tb_type_user {
  type_user_id int [pk]
  name varchar(80) [not null]
  active boolean [not null, default: true]
}

Table tb_department {
  department_id int [pk]
  department_nm varchar(100) [not null]
  acronym varchar(5) [not null]
  active boolean [not null, default: true]
}

Table tb_system {
  system_id int [pk]
  system_nm varchar(80) [not null]
  active boolean [not null, default: true]
}

Table tb_file {
  file_id uuid [pk]
  hash varchar(80) [not null]
  file_path varchar(255) [not null]
  autor_id int [not null]
}

Table tb_audit {
  audit_id uuid [pk]
  old_file_id uuid [not null]
  new_file_id uuid [not null]
  autor_id int [not null]
}

Table tb_chat {
  chat_id int [pk]
  title varchar(100) [not null]
  user_id int [not null]
}

Table tb_message {
  message_id uuid [pk]
  chat_id int [not null]
  message_text text [not null]
  send_dt timestamp [not null]
}

Table tb_file_message {
  file_id uuid [pk]
  file_path varchar(255) [not null]
  message_id uuid [not null]
  send_dt timestamp [not null] 
}

Table tb_model_ia {
  model_ia_id int [pk]
  model_nm varchar(100) [not null]
  active boolean [not null, default: true]
}

Table tb_model_ia_key {
  model_id_id int
  model_key uuid [not null]
  active boolean [not null, default: true]
}

// Relacionamentos N:N e Permissões
Table tb_file_system {
  system_id int [pk]
  file_id uuid [pk]
}

Table tb_file_department {
  file_id uuid [pk]
  department_id int [pk]
}

Table tb_permission_group {
  permission_group_id int [pk]
  permission_group_nm varchar(100) [not null]
  active boolean [not null, default: true]
}

Table tb_permission_group_department {
  permission_group_id int [pk]
  department_id int [pk]
}

Table tb_permission_group_system {
  file_id uuid [pk]
  system_id int [pk]
}

// Foreign Keys e Relacionamentos
Ref: tb_user.type_user_id > tb_type_user.type_user_id
Ref: tb_file_system.system_id > tb_system.system_id
Ref: tb_file_system.file_id > tb_file.file_id
Ref: tb_file_department.department_id > tb_department.department_id
Ref: tb_file_department.file_id > tb_file.file_id
Ref: tb_audit.autor_id > tb_user.user_id
Ref: tb_audit.new_file_id > tb_file.file_id
Ref: tb_audit.old_file_id > tb_file.file_id
Ref: tb_file.autor_id > tb_user.user_id
Ref: tb_chat.user_id > tb_user.user_id
Ref: tb_message.chat_id > tb_chat.chat_id
Ref: tb_file_message.message_id > tb_message.message_id
Ref: tb_model_ia_key.model_id_id > tb_model_ia.model_ia_id