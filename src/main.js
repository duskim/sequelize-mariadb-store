var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
//@ts-ignore
import SessionModel from "./models/Session.js";
const MODEL_NAME = "Session";
const FIFTEEN_MINUTES = 1000 * 60 * 15;
const ONE_DAY = 1000 * 60 * 60 * 24;
const defaultOption = {
  ttl: ONE_DAY,
  ttc: FIFTEEN_MINUTES,
  disableTouch: false,
};
export default function (Store) {
  class ExpressSessionStore extends Store {
    constructor(options) {
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
    all(cb) {
      return __awaiter(this, void 0, void 0, function* () {
        yield this._wrapInTryCatchBlock(
          () =>
            __awaiter(this, void 0, void 0, function* () {
              const sessions = yield this._getModel(MODEL_NAME).findAll();
              cb(null, sessions);
            }),
          cb
        );
      });
    }
    /**
     * This required method is used to destroy/delete a session from the store given a session ID (sid). The callback should be called as callback(error) once the session is destroyed.
     * @param sid - sesssion id
     * @param cb  - callback
     */
    destroy(sid, cb) {
      return __awaiter(this, void 0, void 0, function* () {
        yield this._wrapInTryCatchBlock(
          () =>
            __awaiter(this, void 0, void 0, function* () {
              const session = yield this._getModel(MODEL_NAME).destroy({
                where: {
                  sid,
                },
              });
              cb(null, session);
            }),
          cb
        );
      });
    }
    /**
     * This optional method is used to delete all sessions from the store. The callback should be called as callback(error) once the store is cleared.
     * @param cb - callback
     */
    clear(cb) {
      return __awaiter(this, void 0, void 0, function* () {
        yield this._wrapInTryCatchBlock(
          () =>
            __awaiter(this, void 0, void 0, function* () {
              yield this._getModel(MODEL_NAME).destroy({
                where: {},
                truncate: true,
              });
              cb(null);
            }),
          cb
        );
      });
    }
    /**
     * This optional method is used to get the count of all sessions in the store. The callback should be called as callback(error, len).
     * @param cb
     */
    length(cb) {
      return __awaiter(this, void 0, void 0, function* () {
        yield this._wrapInTryCatchBlock(
          () =>
            __awaiter(this, void 0, void 0, function* () {
              const count = yield this._getModel(MODEL_NAME).count();
              cb(null, count);
            }),
          cb
        );
      });
    }
    /**
     * This required method is used to get a session from the store given a session ID (sid). The callback should be called as callback(error, session).
     * If Session is not found, always
     * @param sid
     * @param cb
     */
    get(sid, cb) {
      return __awaiter(this, void 0, void 0, function* () {
        this._wrapInTryCatchBlock(
          () =>
            __awaiter(this, void 0, void 0, function* () {
              const session = yield this._getModel(MODEL_NAME).findOne({
                where: {
                  sid,
                },
              });
              if (!session) {
                return cb(new Error("Session not found"), undefined);
              }
              const data = JSON.parse(session.sess);
              cb(null, data);
            }),
          cb
        );
      });
    }
    /**
     *
     * This required method is used to upsert a session into the store given a session ID (sid) and session (session) object. The callback should be called as callback(error) once the session has been set in the store.
     * @param sid
     * @param sess
     * @param cb
     */
    set(sid, sess, cb) {
      return __awaiter(this, void 0, void 0, function* () {
        yield this._wrapInTryCatchBlock(
          () =>
            __awaiter(this, void 0, void 0, function* () {
              const ttl = this._getTTLInMilli(sess);
              if (!this._hasExpiration(sess)) {
                sess.cookie.expires = new Date(Date.now() + ttl);
              }
              if (ttl > 0) {
                const [session, created] = yield this._getModel(
                  MODEL_NAME
                ).upsert(
                  {
                    sid,
                    sess: JSON.stringify(sess),
                  },
                  { returning: true }
                );
                const data = JSON.parse(session.sess);
                cb(null, data);
              } else {
                yield this.destroy(sid, cb);
              }
            }),
          cb
        );
      });
    }
    /**
     * This recommended method is used to "touch" a given session given a session ID (sid) and session (session) object. The callback should be called as callback(error) once the session has been touched.
     * @param sid
     * @param sess
     * @param cb
     * @returns
     */
    touch(sid, sess, cb) {
      return __awaiter(this, void 0, void 0, function* () {
        if (this.disableTouch) {
          return;
        }
        yield this._wrapInTryCatchBlock(
          () =>
            __awaiter(this, void 0, void 0, function* () {
              yield this.client.models[MODEL_NAME].update(
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
            }),
          cb
        );
      });
    }
    _getModel(name) {
      return this.client.models[name];
    }
    _wrapInTryCatchBlock(cb, cbError) {
      return __awaiter(this, void 0, void 0, function* () {
        try {
          yield cb();
        } catch (err) {
          cbError(err);
        }
      });
    }
    _hasExpiration(sess) {
      var _a, _b;
      return (
        sess &&
        sess.cookie &&
        ((_a = sess === null || sess === void 0 ? void 0 : sess.cookie) ===
          null || _a === void 0
          ? void 0
          : _a.expires) &&
        !!((_b = sess === null || sess === void 0 ? void 0 : sess.cookie) ===
          null || _b === void 0
          ? void 0
          : _b.expires)
      );
    }
    _getTTLInMilli(sess) {
      let ttl = this.ttl;
      if (this._hasExpiration(sess)) {
        const ms = new Date(String(sess.cookie.expires)).getTime() - Date.now();
        ttl = ms;
      }
      return ttl;
    }
    _createTimerToClearExpiredSessions() {
      setInterval(
        () =>
          __awaiter(this, void 0, void 0, function* () {
            const sessions = yield this.client.models[MODEL_NAME].findAll();
            for (const session of sessions) {
              const { sid, sess } = session;
              const sessionData = JSON.parse(sess);
              if (this._getTTLInMilli(sessionData) <= 0) {
                this.destroy(sid, function (err) {
                  if (err) {
                    throw new Error(err.message);
                  }
                });
              }
            }
          }),
        this.ttc
      );
    }
  }
  return ExpressSessionStore;
}
