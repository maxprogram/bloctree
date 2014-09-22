
module.exports = {

    books: {
        extension: '.tsv',
        delimiter: '\t',
        comment: '#',

        // Columns for accounts + default values
        // Must contain id, debit, credit, reference
        account: {
            id:          0,
            datetime:    new Date().toISOString(),
            debit:       0,
            credit:      0,
            reference:   '',
            description: ''
        },

        // Account types/groups & whether debits
        // increase or decrease the account
        groups: {
            assets: 1,
            liabilities: -1,
            equity: -1,
            revenue: -1,
            expense: 1
        }
    }

};
