const {Sequelize} = require('sequelize');

// colocar acessos do banco dps
const usuario = '';
const senha = '';
const nmBanco = 'thempvs';

const conexaoSequelize = new Sequelize(
    `mssql://${usuario}:${senha}@localhost:1433/${nmBanco}`
);

module.exports = conexaoSequelize;