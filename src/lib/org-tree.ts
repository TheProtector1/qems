export type ManagementMemberFlat = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  roleTitle: string;
  department: string | null;
  qualifications: string | null;
  bio: string | null;
  photo: string | null;
  joinDate: string | null;
  sortOrder: number;
  isActive: boolean;
  reportsToId: string | null;
};

export type ManagementTreeNode = ManagementMemberFlat & {
  children: ManagementTreeNode[];
};

export function buildManagementTree(members: ManagementMemberFlat[]): ManagementTreeNode[] {
  const sorted = [...members].sort((a, b) => a.sortOrder - b.sortOrder || a.fullName.localeCompare(b.fullName));
  const map = new Map<string, ManagementTreeNode>();

  for (const member of sorted) {
    map.set(member.id, { ...member, children: [] });
  }

  const roots: ManagementTreeNode[] = [];
  for (const member of sorted) {
    const node = map.get(member.id)!;
    if (member.reportsToId && map.has(member.reportsToId)) {
      map.get(member.reportsToId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortChildren = (nodes: ManagementTreeNode[]) => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder || a.fullName.localeCompare(b.fullName));
    for (const node of nodes) sortChildren(node.children);
  };
  sortChildren(roots);

  return roots;
}

export const MANAGEMENT_DEPARTMENTS = [
  "Leadership",
  "Academics",
  "Administration",
  "Finance",
  "Operations",
  "Student Affairs",
  "Islamic Affairs",
] as const;

export const MANAGEMENT_ROLE_SUGGESTIONS = [
  "Chairman",
  "Director",
  "Principal",
  "Vice Principal",
  "Head of Academics",
  "Mufti / Scholar",
  "Registrar",
  "Accountant",
  "Coordinator",
  "Administrator",
] as const;
