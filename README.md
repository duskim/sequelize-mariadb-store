# @duskim/express-store

## Description

ES6-module MariaDB session storage plugin for [express-session](https://www.npmjs.com/package/express-session). Written in TypeScript and transcompiled to .cjs.

## Vitest report

To reproduce these results, please install MariaDB, create a database called 'test' and run
```
npm run test
```

```
 ✓ src/main.vitest.js (10) 4564ms
   ✓ test store methods (10) 4564ms
     ✓ all
     ✓ destroy
     ✓ set with expiry
     ✓ set with no expiry
     ✓ get existing
     ✓ get non-existing
     ✓ clear
     ✓ length
     ✓ touch
     ✓ clears expired sessions 4031ms

 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  19:56:02
   Duration  5.43s (transform 100ms, setup 0ms, collect 223ms, tests 4.56s)
```

## Usage
Supports ES6-module or CJS modules
```
  import expressSession from "express-session"
  import MariaDBSessionStorage from "@duskim/express-store"

  const SessionStore = MariaDBSessionStorage(expressSession.Store)
  
  const sessStore = new SessionStore({
    client: sequelize
  });

  app.use(
    session({
      store: sessStore,
      ...
    })
  );
```

## Implemented Methods
Please see [express-session](https://www.npmjs.com/package/express-session) for a description of available store methods. 

- touch(sid, sess, cb)
- all(cb)
- length(cb)
- clear(cb)
- set(sid, sess, cb)
- get(sid, cb)
- destroy(sid, cb)
