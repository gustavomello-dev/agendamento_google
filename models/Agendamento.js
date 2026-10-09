const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Agendamento = sequelize.define(
  'Agendamento',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nome: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    telefone: {
      // Armazenado apenas com dígitos (sem formatação), ex: "11999999999"
      type: DataTypes.STRING(11),
      allowNull: false,
    },
    servico: {
      type: DataTypes.STRING(60),
      allowNull: false,
    },
    dia: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    horario: {
      // formato "HH:mm", ex: "14:30"
      type: DataTypes.STRING(5),
      allowNull: false,
    },
    googleEventId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: 'agendamentos',
    timestamps: true,
    indexes: [
      // Garante, a nível de banco, que dois clientes não reservem o mesmo dia+horário
      { unique: true, fields: ['dia', 'horario'] },
    ],
  }
);

module.exports = Agendamento;
