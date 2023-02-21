module.exports = function (session) {
  const Store = session.Store;
  const SessionModel = require("./models/Session");
  class ExpressSessionStore extends Store {
    constructor(options = {}) {
      super(options);
      if (!options.client) {
        throw new Error(
          "A client must be directly provided to the Sequelize Store"
        );
      }

      this.client = options.client;
      this.ttl = options.ttl || 86400; // One day in seconds.
      this.disableTTL = options.disableTTL || false;
      this.disableTouch = options.disableTouch || false;
      this.ttc = options.ttc || 1000 * 60 * 5; // 5 minutes

      // initialize model
      SessionModel(this.client);

      this._clearExpiredSessions();
    }
    destroy(sid, cb) {
      const { client } = this;

      return client.models["Session"]
        .destroy({
          where: {
            sid,
          },
        })
        .then((e) => {
          return cb();
        })
        .catch((err) => {
          cb(err);
        });
    }
    clear(cb) {
      const { client } = this;
      return client.models["Session"]
        .destroy({
          where: {},
          truncate: true,
        })
        .then((e) => {
          return cb();
        })
        .catch((err) => {
          return cb(err);
        });
    }
    length(cb) {
      const { client } = this;
      return client.models["Session"]
        .findAll()
        .then((e) => {
          return cb(null, e.length);
        })
        .catch((err) => {
          return cb(err);
        });
    }
    get(sid, cb) {
      const { client } = this;
      return client.models["Session"]
        .findOne({
          where: {
            sid,
          },
        })
        .then((data) => {
          if (!data) {
            return cb();
          }

          return cb(null, JSON.parse(data.sess));
        })
        .catch((err) => {
          return cb(err);
        });
    }
    set(sid, sess, cb) {
      const { client } = this;
      let ttl = 1;
      if (!this.disableTTL) {
        ttl = this._getTTL(sess);
      }

      if (ttl > 0) {
        client.models["Session"]
          .upsert(
            {
              sid: sess.id,
              sess: JSON.stringify(sess),
            },
            { returning: true }
          )
          .then((e) => {
            return cb();
          })
          .catch((err) => {
            console.log(err);
            return cb(err);
          });
      } else {
        // If the resulting TTL is negative we can delete / destroy the key
        this.destroy(sid, cb);
      }
    }
    touch(sid, sess, cb) {
      const { client } = this;
      if (this.disableTouch || this.disableTTL) return cb();
      return client.models["Session"]
        .update(
          {
            sess: JSON.stringify(sess),
          },
          {
            where: {
              sid,
            },
          }
        )
        .then((e) => {
          return cb();
        })
        .catch((err) => {
          return cb(err);
        });
    }
    _getTTL(sess) {
      let ttl;
      if (sess && sess.cookie && sess?.cookie?.expires) {
        let ms = Number(new Date(sess.cookie.expires)) - Date.now();
        ttl = Math.ceil(ms / 1000);
      } else {
        ttl = this.ttl;
      }
      return ttl;
    }
    _clearExpiredSessions() {
      const { client } = this;
      setInterval(() => {
        client.models["Session"]
          .findAll()
          .then((e) => {
            const currentDate = new Date().getTime();

            for (const o of e) {
              const { sid, sess } = o;
              const session = JSON.parse(sess);
              const sessDate = new Date(session.cookie.expires);

              if (currentDate > sessDate.getTime()) {
                this.destroy(sid, function (err) {});
              }
            }
          })
          .catch((err) => {
            console.log(err);
          });
      }, this.ttc);
    }
  }
  return ExpressSessionStore;
};
