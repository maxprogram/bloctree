module.exports = {

    // ACCOUNTING BOOKS SETTINGS
    books: {
        extension: '.tsv',
        delimiter: '\t',
        comment: '#',

        // Columns for accounts + default values
        // Must contain id, debit, credit, reference
        account: {
            id:          null,
            datetime:    new Date().toISOString(),
            debit:       0,
            credit:      0,
            reference:   '',
            description: ''
        },

        // Account types/groups:
        // 1. Whether debits increase or decrease the account
        // 2. Account number start
        groups: {
            assets:      [ 1, 100],
            liabilities: [-1, 200],
            equity:      [-1, 300],
            revenue:     [-1, 400],
            cogs:        [ 1, 500],
            expenses:    [ 1, 600]
        }
    },

    // Bash/terminal formatting
    bash: {
        width: 50,
        capitalize: true,
        colors: {
            heading: 'cyan',
            account: 'green',
            number: 'magenta',
            sum: 'inverse'
        }
    },

};
