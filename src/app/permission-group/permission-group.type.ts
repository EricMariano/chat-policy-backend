export interface PermissionGroupFilter {
  permissionGroupNm?: string | null;
  departmentsIds?: number[];
  systemsIds?: number[];
}

export interface PermissionGroupPaginationFilter extends PermissionGroupFilter {
  limit: number;
  offset: number;
}

export interface PermissionGroupListResponse {
  permissionGroupId: number;
  permissionGroupNm: string;
  active: boolean;
}

export interface PermissionGroupUserResponse {
  userId: number;
  name: string;
  email: string;
  active: boolean;
}

export interface PermissionGroupDepartmentResponse {
  departmentId: number;
  departmentNm: string;
  acronym: string;
  active: boolean;
}

export interface PermissionGroupSystemResponse {
  systemId: number;
  systemNm: string;
  acronym: string;
  active: boolean;
}
