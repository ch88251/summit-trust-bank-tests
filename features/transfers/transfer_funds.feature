Feature: Transferring funds between accounts

  Background:
    Given Alex is logged in

  Scenario: Alex moves money from checking to savings
    When they transfer "250.75" from "Everyday Checking" to "High-Yield Savings"
    Then they should see the transfer confirmation "Transfer of $250.75 completed."
    And the balance of "Everyday Checking" should be "$8,742.22"
    And the balance of "High-Yield Savings" should be "$18,295.17"

  Scenario Outline: Invalid amounts are rejected (<reason>)
    When they transfer "<amount>" from "Everyday Checking" to "High-Yield Savings"
    Then they should see the transfer error "<message>"
    And the balance of "Everyday Checking" should be "$8,992.97"

    Examples:
      | reason               | amount | message                                        |
      | empty amount         |        | Please enter an amount.                        |
      | more than 2 decimals | 10.123 | Enter a valid amount (up to 2 decimal places). |
      | zero amount          | 0      | Amount must be greater than $0.00.             |
      | amount over balance  | 999999 | Amount exceeds the available balance.          |
