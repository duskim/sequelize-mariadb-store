import { Sequelize, DataTypes } from "@sequelize/core";

export default async function (sequelize: Sequelize) {
  const Session = sequelize.define(
    "Session",
    {
      sid: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
      },
      sess: {
        type: DataTypes.JSON,
        allowNull: false,
      },
    },
    {
      freezeTableName: true,
      createdAt: true,
      updatedAt: true,
    }
  );

  await Session.sync({ alter: true });
  return Session;
}
