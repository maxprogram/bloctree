/* Account TSV Entries:
 * 0     1       2        3          4
 * id datetime amount reference description
 */

function total(entries) {
	return entries.reduce(function(sum, n) {
		return sum + parseFloat(n[2]);
	}, 0);
}

module.exports = {
	total: total,
	sum: total
};
