table tb_user { // usuario
  user_id int [pk]
  email varchar(250) [not null]
  name varchar(150) [not null]
  password varchar(80) [not null]
  registered_at timestamp [not null, default:`CURRENT_TIMESTAMP`]
  type_user_id int [not null] 
  active boolean [not null, default:true]
}

ref: tb_user.type_user_id > tb_type_user.type_user_id

table tb_department { // departamento
  department_id int [pk]
  department_nm varchar(100) [not null]
  acronym varchar(5) [not null]
  active boolean [not null, default:true]
}

table tb_system { // sistemas
  system_id int [pk]
  system_nm varchar(80) [not null]
  acronym varchar(5) [not null, unique]
  active boolean [not null, default:true]
}

table tb_document_system { // relação N para N entre arquivo e sistema
  system_id int
  document_id uuid

  indexes {
    (system_id, document_id) [pk]
  }
}

ref: tb_document_system.system_id > tb_system.system_id
ref: tb_document_system.document_id > tb_document.document_id

table tb_document_department { // relação N para N entre arquivo e departamento
  document_id uuid
  department_id int
  indexes {
    (document_id, department_id) [pk]
  }
}

ref: tb_document_department.department_id > tb_department.department_id
ref: tb_document_department.document_id > tb_document.document_id

table tb_type_user { // tipos de usuarios
  type_user_id int [pk]
  name varchar(80) [not null]
  active boolean [not null, default:true]
}



table tb_document { // arquivos da empresa
  document_id uuid [pk]
  title varchar(150) [not null]
  autor_id int [not null]
  active boolean [not null] // caso esteja desativo ele vai desativar todos os outros
  last_version_id uuid 
}

ref: tb_document.last_version_id > tb_document_version.document_version_id
ref: tb_document.autor_id > tb_user.user_id

enum document_status {
  PROCESSING
  DONE
  ERROR
}

table tb_document_version {
  document_version_id uuid [pk]
  document_id uuid [not null]
  version varchar(10) [not null]
  hash varchar(80) [not null]
  document_path text [not null]
  autor_id int [not null]
  created_at timestamp [default: `now()`]
  active boolean [not null, default:true]
  status document_status

  indexes {
    (document_id, version) [unique]
  }
}

ref: tb_document_version.document_id > tb_document.document_id
ref: tb_document_version.autor_id > tb_user.user_id

table tb_chat { // historico de chat
  chat_id uuid [pk]
  title varchar(100) [not null]
  user_id int [not null]
  created_at timestamp [not null]
  last_update_at timestamp [not null]
}

ref: tb_chat.user_id > tb_user.user_id

table tb_shared_chat {
  chat_id uuid 
  user_id int 
  role_chat_id int [not null]

  indexes {
    (chat_id, user_id) [pk]
  }

}

ref: tb_shared_chat.chat_id > tb_chat.chat_id
ref: tb_shared_chat.user_id > tb_user.user_id
ref: tb_shared_chat.role_chat_id > tb_role_chat.role_chat_id

table tb_role_chat {
  role_chat_id int [pk]
  role_chat_nm varchar(80) [not null]
  active boolean [not null, default:true]
}

enum message_status {
  PROCESSING
  DONE
  ERROR
}

table tb_message { // menssagens do chat
  message_id uuid [pk]
  chat_id uuid [not null]
  message_text text [not null]
  send_at timestamp [not null]
  user_id int
  model_ia_id int
  status message_status

  indexes {
    (chat_id, send_at)
    (message_text)
  }
}

ref: tb_message.model_ia_id > tb_model_ia.model_ia_id
ref: tb_message.user_id > tb_user.user_id
ref: tb_message.chat_id > tb_chat.chat_id

table tb_file_message { // arquivos da menssagens
  file_id uuid [pk]
  file_path varchar(255) [not null]
  message_id uuid [not null]
  send_dt timestamp [not null] 

  indexes {
    (message_id)
  }
}

ref: tb_file_message.message_id > tb_message.message_id

table tb_model_ia { // modelos de IA
  model_ia_id int [pk]
  model_nm varchar(100) [not null]
  active boolean [not null, default:true]
}

table tb_model_ia_key { // chaves de IA
  model_ia_id int
  model_key uuid [not null]
  qtn_token decimal(16,2) [not null]
  active boolean [not null, default:true]

  indexes {
    (model_ia_id, model_key) [pk]
  }
}

table tb_token_history {
  message_id uuid [pk]
  amount_token_spent decimal(8,2) [not null]
  register_dt timestamp [not null]
}

ref:tb_token_history.message_id > tb_message.message_id

ref:tb_model_ia_key.model_ia_id > tb_model_ia.model_ia_id

table tb_permission_group {
  permission_group_id int [pk]
  permission_group_nm varchar(100) [not null]
  active boolean [not null, default:true]
}

table tb_permission_group_user {
  permission_group_id int
  user_id int 

  indexes {
    (permission_group_id, user_id) [pk]
  }
}

ref: tb_permission_group_user.permission_group_id > tb_permission_group.permission_group_id
ref: tb_permission_group_user.user_id > tb_user.user_id

table tb_permission_group_department {
  permission_group_id int
  department_id int

  indexes {
    (permission_group_id, department_id) [pk]
  }
}

ref: tb_permission_group_department.permission_group_id > tb_permission_group.permission_group_id
ref: tb_permission_group_department.department_id > tb_department.department_id

table tb_permission_group_system {
  permission_group_id int
  system_id int

  indexes {
    (permission_group_id, system_id) [pk]
  }
}

ref: tb_permission_group_system.permission_group_id > tb_permission_group.permission_group_id
ref: tb_permission_group_system.system_id > tb_system.system_id