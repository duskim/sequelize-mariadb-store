module.exports = async function (sequelize) {
  const { DataTypes } = require("@sequelize/core");

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
};
