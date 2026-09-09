export type RoleCode = 'EMPLOYEE' | 'MANAGER' | 'ADMIN';

export interface DepartmentSummaryDto {
  readonly id: number;
  readonly code: string;
  readonly label: string;
}

export interface LoginResponseDto {
  readonly token: string;
}

export interface AuthMeDto {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly roleCode: string;
  readonly allowedDepartments: readonly DepartmentSummaryDto[];
}

export interface CurrentUser {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly roleCode: RoleCode;
  readonly allowedDepartments: readonly DepartmentSummaryDto[];
}

export function toCurrentUser(dto: AuthMeDto): CurrentUser {
  return {
    id: dto.id,
    email: dto.email,
    fullName: dto.fullName,
    roleCode: dto.roleCode as RoleCode,
    allowedDepartments: dto.allowedDepartments,
  };
}
