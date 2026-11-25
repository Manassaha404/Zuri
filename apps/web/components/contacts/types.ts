// Contacts Types and Interfaces

export interface ContactItem {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  company?: string;
  notes?: string;
  avatarColor: string;
  createdAt: string;
  updatedAt: string;
}
