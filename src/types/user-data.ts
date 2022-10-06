export type UserData = {
  userId: string | number;
  accountId: string | undefined;
  email: string;
  friendlyName: string;
  password: string;
  isActive?: boolean;
  activationCode?: string | null;
  created?: Date | string;
  lastActivity?: Date | string;
};
