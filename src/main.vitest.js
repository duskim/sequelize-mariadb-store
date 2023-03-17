import { describe, it, expect, vi, beforeEach } from "vitest";
import SessionStore from "./main.ts";
import ExpressSession from "express-session";
import { Sequelize } from "sequelize";

const MariaDBSessionStore = SessionStore(ExpressSession.Store);
let mockSessStore = null;
let sequelize = null;

// set queries to raw responses
const sequelizeConfig = {
  host: "localhost",
  dialect: "mariadb",
  query: { raw: true },
};

async function clearAllRows() {
  const { Session } = sequelize.models;
  await Session.destroy({
    truncate: true,
  });
}

async function connectToSql() {
  sequelize = new Sequelize("test", "root", "newpassword", sequelizeConfig);

  await sequelize.authenticate().then(() => {
    mockSessStore = new MariaDBSessionStore({
      client: sequelize,
      ttc: 1000 * 1,
    });

    sequelize.sync({ alter: true });
  });
}

async function insertSessionRow(data) {
  const { Session } = sequelize.models;
  await Session.create({
    sid: data.sid,
    sess: JSON.stringify(data.sess),
  });
}

function createSessionData(sid, cookieOptions = {}, data = { uid: "uid" }) {
  const cookie = {
    originalMaxAge: 1296999999,
    expires: "2023-03-17T05:48:48.362Z",
    secure: true,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    ...cookieOptions,
  };

  return {
    sid,
    sess: {
      cookie,
      data,
    },
  };
}

beforeEach(async () => {
  await connectToSql();
});

describe("test store methods", () => {
  const sessionWithExpiry = createSessionData("111111");
  const sessionWithNoExpiry = createSessionData("999999", {
    expires: "",
  });

  it("all", async () => {
    await clearAllRows();
    await insertSessionRow(sessionWithExpiry);
    await insertSessionRow(sessionWithNoExpiry);

    const mockFn = vi.fn(async (err, rows) => {
      if (err) {
        throw new Error();
      }

      expect(rows.length).toBe(2);
    });

    await mockSessStore.all(mockFn);
    expect(mockFn).toHaveBeenCalledOnce();
  });

  it("destroy", async () => {
    const { Session } = sequelize.models;

    await clearAllRows();
    await insertSessionRow(sessionWithExpiry);
    await insertSessionRow(sessionWithNoExpiry);

    const mockFn = vi.fn(async (err, rows) => {
      if (err) {
        throw new Error();
      }
    });

    await mockSessStore.destroy(sessionWithExpiry.sid, mockFn);
    expect(mockFn).toHaveBeenCalledOnce();
    expect(await Session.count()).toBe(1);
  });

  it("set with expiry", async () => {
    const { Session } = sequelize.models;

    await clearAllRows();
    await mockSessStore.set(
      sessionWithExpiry.sid,
      sessionWithExpiry.sess,
      async (err, row) => {
        if (err) {
          throw new Error(err);
        }

        expect(row).toBeTruthy();
        expect(row.cookie.expires).toBe(sessionWithExpiry.sess.cookie.expires);
      }
    );
    expect(await Session.count()).toBe(1);
  });

  it("set with no expiry", async () => {
    const { Session } = sequelize.models;

    await clearAllRows();
    await mockSessStore.set(
      sessionWithNoExpiry.sid,
      sessionWithNoExpiry.sess,
      async (err, row) => {
        if (err) {
          throw new Error(err);
        }

        expect(row).toBeTruthy();
        expect(new Date(row.cookie.expires).getTime()).toBeLessThanOrEqual(
          new Date(Date.now() + 1000 * 60 * 60 * 24).getTime()
        );
      }
    );
    expect(await Session.count()).toBe(1);
  });

  it("get existing", async () => {
    await clearAllRows();

    await insertSessionRow(sessionWithExpiry);

    await mockSessStore.get(sessionWithExpiry.sid, (err, row) => {
      if (err) {
        throw new Error(err);
      }

      expect(row).toBeTruthy();
      expect(row.cookie.expires).toBe(sessionWithExpiry.sess.cookie.expires);
    });
  });

  it("get non-existing", async () => {
    await clearAllRows();

    await mockSessStore.get(sessionWithExpiry.sid, (err, row) => {
      if (err) {
        expect(err).toBeTruthy();
      }

      expect(row).toBeFalsy();
    });
  });

  it("clear", async () => {
    const { Session } = sequelize.models;

    await clearAllRows();

    await insertSessionRow(sessionWithExpiry);

    await mockSessStore.clear((err) => {
      if (err) {
        throw new Error(err);
      }
    });

    expect(await Session.count()).toBe(0);
  });

  it("length", async () => {
    await clearAllRows();

    await insertSessionRow(createSessionData("12"));
    await insertSessionRow(createSessionData("23"));
    await insertSessionRow(createSessionData("34"));
    await insertSessionRow(createSessionData("56"));

    await mockSessStore.length(async (err, count) => {
      if (err) {
        throw new Error(err);
      }

      expect(count).toBe(4);
      await clearAllRows();
      await mockSessStore.length(async (err, count) => {
        if (err) {
          throw new Error(err);
        }

        expect(count).toBe(0);
      });
    });
  });

  it("touch", async () => {
    const { Session } = sequelize.models;

    await clearAllRows();

    await insertSessionRow(sessionWithExpiry);

    const date = new Date();
    const newSess = createSessionData(sessionWithExpiry.sid, {
      expires: date,
    }).sess;

    await mockSessStore.touch(sessionWithExpiry.sid, newSess, async () => {
      const modifiedSess = await Session.findOne({
        where: {
          sid: sessionWithExpiry.sid,
        },
      });

      const sess = JSON.parse(modifiedSess.sess);

      expect(new Date(sess.cookie.expires).getTime()).toEqual(date.getTime());
    });
  });

  it(
    "clears expired sessions",
    async () => {
      const { Session } = sequelize.models;

      await clearAllRows();

      const sessionWith3SecondExpiry = createSessionData("222222", {
        expires: new Date(Date.now() + 1000 * 3),
      });

      const sessionWith3SecondExpiry2 = createSessionData("333333", {
        expires: new Date(Date.now() + 1000 * 3),
      });

      await insertSessionRow(sessionWith3SecondExpiry);

      setTimeout(async () => {
        await insertSessionRow(sessionWith3SecondExpiry2);
      }, 1000);

      await new Promise((resolve) => {
        setInterval(async () => {
          const count = await Session.count();

          if (count === 0) {
            resolve();
          }
        }, 500);
      });
    },
    {
      timeout: 1000 * 30,
    }
  );
});
