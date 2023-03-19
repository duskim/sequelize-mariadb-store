import { Sequelize } from "sequelize";

export type SessionRow = {
  sid: string;
  sess: string;
  createdAt?: string;
  updatedAt?: string;
};

export interface Options {
  client: Sequelize;
  ttl?: number;
  ttc?: number;
  disableTouch?: boolean;
}

export type Callback = (_err: any, _payload?: any) => void;
