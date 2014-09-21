/* Account TSV Entries:
 * 0     1       2     3        4          5
 * id datetime debit credit reference description
 */

function total(entries) {
    var debits = entries.reduce(function(sum, n) {
        return sum + (parseFloat(n[2]) || 0);
    }, 0);
    var credits = entries.reduce(function(sum, n) {
        return sum + (parseFloat(n[3]) || 0);
    }, 0);

    return [debits, credits];
}

module.exports = {
    total: total,
    sum: total
};
