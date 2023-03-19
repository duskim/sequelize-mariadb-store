import SessionModel from "./models/Session.js";
import type { SessionRow, Options, Callback } from "./main.d.js";
//@ts-ignore
import { Sequelize } from "sequelize";
import session, { SessionData } from "express-session";

const MODEL_NAME = "Session";
const FIFTEEN_MINUTES = 1000 * 60 * 15;
const ONE_DAY = 1000 * 60 * 60 * 24;

const defaultOption = {
  ttl: ONE_DAY,
  ttc: FIFTEEN_MINUTES,
  disableTouch: false,
};

export default function (Store: typeof session.Store) {
  class ExpressSessionStore extends Store {
    private client: Sequelize;
    private ttl: number;
    private ttc: number;
    private disableTouch: boolean;

    constructor(options: Options) {
      //@ts-ignore
      super(options);

      if (!options.client) {
        throw new Error("Sequelize client required. ");
      }

      this.client = options.client;
      this.ttl = options.ttl || defaultOption.ttl;
      this.disableTouch = options.disableTouch || defaultOption.disableTouch;
      this.ttc = options.ttc || defaultOption.ttc;

      SessionModel(this.client);

      this._createTimerToClearExpiredSessions();
    }

    /**
     * This optional method is used to get all sessions in the store as an array. The callback should be called as callback(error, sessions).
     * @param cb - callback
     */
    async all(cb: Callback): Promise<void> {
      await this._wrapInTryCatchBlock(async () => {
        const sessions = await this._getModel(MODEL_NAME).findAll();
        cb(null, sessions as unknown as Array<SessionData>);
      }, cb);
    }

    /**
     * This required method is used to destroy/delete a session from the store given a session ID (sid). The callback should be called as callback(error) once the session is destroyed.
     * @param sid - sesssion id
     * @param cb  - callback
     */
    async destroy(sid: string, cb: Callback): Promise<void> {
      await this._wrapInTryCatchBlock(async () => {
        const session = await this._getModel(MODEL_NAME).destroy({
          where: {
            sid,
          },
        });
        cb(null, session);
      }, cb);
    }
    /**
     * This optional method is used to delete all sessions from the store. The callback should be called as callback(error) once the store is cleared.
     * @param cb - callback
     */
    async clear(cb: Callback): Promise<void> {
      await this._wrapInTryCatchBlock(async () => {
        await this._getModel(MODEL_NAME).destroy({
          where: {},
          truncate: true,
        });
        cb(null);
      }, cb);
    }

    /**
     * This optional method is used to get the count of all sessions in the store. The callback should be called as callback(error, len).
     * @param cb
     */
    async length(cb: Callback): Promise<void> {
      await this._wrapInTryCatchBlock(async () => {
        const count = await this._getModel(MODEL_NAME).count();
        cb(null, count);
      }, cb);
    }
    /**
     * This required method is used to get a session from the store given a session ID (sid). The callback should be called as callback(error, session).
     * If Session is not found, always
     * @param sid
     * @param cb
     */
    async get(sid: string, cb: Callback): Promise<void> {
      this._wrapInTryCatchBlock(async () => {
        const session = await this._getModel(MODEL_NAME).findOne({
          where: {
            sid,
          },
        });

        if (!session) {
          return cb(new Error("Session not found"), undefined);
        }

        const data: SessionData = JSON.parse(
          (session as unknown as SessionRow).sess
        );

        cb(null, data);
      }, cb);
    }
    /**
     *
     * This required method is used to upsert a session into the store given a session ID (sid) and session (session) object. The callback should be called as callback(error) once the session has been set in the store.
     * @param sid
     * @param sess
     * @param cb
     */
    async set(sid: string, sess: SessionData, cb: Callback): Promise<void> {
      await this._wrapInTryCatchBlock(async () => {
        const ttl = this._getTTLInMilli(sess);

        if (!this._hasExpiration(sess)) {
          sess.cookie.expires = new Date(Date.now() + ttl);
        }

        if (ttl > 0) {
          const [session, created] = await this._getModel(MODEL_NAME).upsert(
            {
              sid,
              sess: JSON.stringify(sess),
            },
            { returning: true }
          );

          const data: SessionData = JSON.parse(
            (session as unknown as SessionRow).sess
          );

          cb(null, data);
        } else {
          await this.destroy(sid, cb);
        }
      }, cb);
    }
    /**
     * This recommended method is used to "touch" a given session given a session ID (sid) and session (session) object. The callback should be called as callback(error) once the session has been touched.
     * @param sid
     * @param sess
     * @param cb
     * @returns
     */
    async touch(sid: string, sess: SessionData, cb: () => void): Promise<void> {
      if (this.disableTouch) {
        return;
      }

      await this._wrapInTryCatchBlock(async () => {
        await this.client.models[MODEL_NAME].update(
          {
            sess: JSON.stringify(sess),
          },
          {
            where: {
              sid,
            },
          }
        );

        cb();
      }, cb);
    }

    private _getModel(name: string) {
      return this.client.models[name];
    }

    private async _wrapInTryCatchBlock(
      cb: () => Promise<void>,
      cbError: Callback
    ) {
      try {
        await cb();
      } catch (err) {
        cbError(err as Error);
      }
    }

    private _hasExpiration(sess: SessionData) {
      return (
        sess && sess.cookie && sess?.cookie?.expires && !!sess?.cookie?.expires
      );
    }

    private _getTTLInMilli(sess: SessionData): number {
      let ttl = this.ttl;
      if (this._hasExpiration(sess)) {
        const ms = new Date(String(sess.cookie.expires)).getTime() - Date.now();
        ttl = ms;
      }
      return ttl;
    }

    private _createTimerToClearExpiredSessions(): void {
      setInterval(async () => {
        const sessions = await this.client.models[MODEL_NAME].findAll();

        for (const session of sessions) {
          const { sid, sess } = session as unknown as SessionRow;
          const sessionData: SessionData = JSON.parse(sess);

          if (this._getTTLInMilli(sessionData) <= 0) {
            this.destroy(sid, function (err: any) {
              if (err) {
                throw new Error(err.message);
              }
            });
          }
        }
      }, this.ttc);
    }
  }
  return ExpressSessionStore;
}
