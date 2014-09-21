
module.exports = {

    books: {
        extension: '.tsv',
        delimiter: '\t',
        comment: '#',

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
