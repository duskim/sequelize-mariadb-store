"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
function default_1(sequelize) {
    return __awaiter(this, void 0, void 0, function* () {
        const Session = sequelize.define("Session", {
            sid: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
                primaryKey: true,
            },
            sess: {
                type: sequelize_1.DataTypes.JSON,
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
exports.default = default_1;
