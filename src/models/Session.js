var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { DataTypes } from "@sequelize/core";
export default function (sequelize) {
    return __awaiter(this, void 0, void 0, function* () {
        const Session = sequelize.define("Session", {
            sid: {
                type: DataTypes.STRING,
                allowNull: false,
                primaryKey: true,
            },
            sess: {
                type: DataTypes.JSON,
                allowNull: false,
            },
        }, {
            freezeTableName: true,
            createdAt: true,
            updatedAt: true,
        });
        yield Session.sync({ alter: true });
        return Session;
    });
}
