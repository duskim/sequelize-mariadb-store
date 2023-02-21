## express-session-store-mariadb

### Description

Session store for express-session and sequelize.js. Only tested on maria-db.

### Usage

    const session = require("express-session");
    const SessionStore = require("express-session-store-mariadb")(session);

    //initialize new store with sequelize
    const sessionStore = new SessionStore({
      client: sequelize
    });

    router.use(
      session({
        // session options
        store: sessionStore,

        secret: "keyboard cat",
        resave: false, //
        saveUninitialized: false,
        cookie: {
          secure: false,
          httpOnly: true,
          sameSite: "strict",
          // expires: new Date(Date.now() + hour),
          maxAge: 60 * 1000,
        },
        rolling: true,
      })
    );

### Implemented Methods

- req.session.touch(). you can set resave to false.
- sessionStore.length()
- sessionStore.clear()
- sessionStore.set()
- sessionStore.get()
- sessionStore.destroy()
- sessionStore.clear()
