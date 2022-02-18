export type AccountData = {
  accountId: string;
  name: string;
  ownerId: string;
  isActive?: boolean;
  created?: Date | string;
  lastActivity?: Date | string;
};
