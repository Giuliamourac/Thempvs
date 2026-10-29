function padraoTables (nmTables) {
    return {
        timestamps: false, // Define que não serão geradas colunas adicionais
        freezeTableName: true, // Define que o nome da tabela fornecido não deve ser alterado pelo ORM
        tableName: nmTables // Define o nome da tabela como argumento
    }
}

module.exports = {
    padraoTables
}