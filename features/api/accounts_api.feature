Feature: Accounts API

  The REST API only exposes accounts to the customer who owns them.

  Scenario: Listing accounts requires a token
    When Alex requests their accounts from the API
    Then they should receive a 401 response

  Scenario: A signed-in customer lists their accounts
    Given Jane has signed in to the API
    When they request their accounts from the API
    Then they should receive a 200 response
    And the API should list these accounts:
      | account           | type     | balance |
      | Primary Checking  | CHECKING | 1200    |
      | Rainy Day Savings | SAVINGS  | 3000    |
