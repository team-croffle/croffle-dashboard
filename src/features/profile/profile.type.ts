export type TagValue =
  | 'fe-dev'
  | 'be-dev'
  | 'fs-dev'
  | 'architect'
  | 'da'
  | 'dba'
  | 'se'
  | 'ne'
  | 'devops'
  | 'pm'
  | 'qa'
  | 'ui-ux';

export interface TagValueLabel {
  label: string;
  value: TagValue;
}

export const TagValues: TagValueLabel[] = [
  { label: 'Frontend', value: 'fe-dev' },
  { label: 'Backend', value: 'be-dev' },
  { label: 'Fullstack', value: 'fs-dev' },
  { label: 'Architect', value: 'architect' },
  { label: 'Data Analyst', value: 'da' },
  { label: 'DB Admin', value: 'dba' },
  { label: 'Security Engineer', value: 'se' },
  { label: 'Network Engineer', value: 'ne' },
  { label: 'DevOps', value: 'devops' },
  { label: 'Project Manager', value: 'pm' },
  { label: 'Quality Assurance', value: 'qa' },
  { label: 'UI/UX', value: 'ui-ux' },
];

export interface Profile {
  id?: string;
  user_id: string;
  status: 'published' | 'draft';
  sort?: number;
  name: string;
  nickname: string;
  github_username: string;
  email: string;
  tags?: TagValue[];
  linkedin?: string;
  homepage?: string;
  blog?: string;
}

export type SaveProfileRequest = Omit<Profile, 'id' | 'user_id' | 'status' | 'sort'>;
