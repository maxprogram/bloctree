# Bloctree

```sh
$ npm install -g bloctree
$ bloctree new newBlock
$ cd newBlock
$ bloctree about
```

(Bloctree : org administration) AS (Docker : app environment)

Bloctree = containerization of project administration. Just like you would run `git init` or `rails new` when starting a new codebase, you can run `bloctree new` to create a project administration folder.

The folder represents the (project|company|organization|division) and contains all of its administrative data (books, accounts, legal documents, ideology, processes, etc.). The Bloctree software is your interface between the data.

All files are human-readable. This is for both transparency and to make it easier to track changes over time.

## Accounting books

```sh
# New account:
$ bloctree new:account [name] [category]
$ bloctree new:account receivables assets/current

# Record a transaction:
$ bloctree record [transaction] [amount]
$ bloctree record expense 155.12 -m "Wireless keyboard"
$ bloctree record sale 120 -m "2 billable hours"

# Record separate entries:
$ bloctree new:entry [account] [--debit <amt>] [--credit <amt>]
$ bloctree new:entry receivable -d 800 -m "Rent payment"
$ bloctree new:entry sales -c 800 -m "Rent payment"

# Build a balance sheet:
$ bloctree get:balance
```

### Double-entry bookkeeping

Each transaction must debit an account and credit another account in an equal amount.

|             | **Debit** | **Credit** |
|-------------|-----------|------------|
| Asset       | Increase  | Decrease   |
| Liability   | Decrease  | Increase   |
| Revenue     | Decrease  | Increase   |
| Expense     | Increase  | Decrease   |
| Equity      | Decrease  | Increase   |

### Folder structure
```
books
├── assets
│   ├── 100-cash.tsv
│   └── 101-accounts_receivable.tsv
├── liabilities
│   ├── 200-accounts_payable.tsv
│   └── 201-credit.tsv
├── equity
│   ├── 300-contributed_capital.tsv
│   ├── revenues
│   │   └── 400-revenues.tsv
│   └── expenses
│       └── 600-expenses.tsv
└── config.json
```

#### Account numbers
| Range   | Type of Account     |
|---------|---------------------|
| 100-199 | Assets              |
| 200-299 | Liabilities         |
| 300-399 | Owner's Equity      |
| 400-499 | Revenues            |
| 500-599 | Costs of Goods Sold |
| 600-699 | Expenses            |