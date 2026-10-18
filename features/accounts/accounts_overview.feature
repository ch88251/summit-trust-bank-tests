Feature: Accounts overview

  Customers see all of their accounts, with masked account numbers, on one page.

  Scenario: Alex sees each account with its balance
    Given Alex is logged in
    When they view the accounts overview
    Then they should see the following accounts:
      | account                 | number   | balance    |
      | Everyday Checking       | ••••4567 | $8,992.97  |
      | High-Yield Savings      | ••••8812 | $18,044.42 |
      | Self-Directed Brokerage | ••••1190 | $10,000.00 |
    And their total balance should be "$37,037.39"
