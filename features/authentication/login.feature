Feature: Logging in

  In order to manage their money
  Summit Trust Bank customers want to sign in to online banking

  Scenario Outline: <customer> lands on their accounts after logging in
    When <customer> logs in with valid credentials
    Then <customer> should be on the accounts page
    And they should be welcomed with "Welcome back, <customer>"

    Examples:
      | customer |
      | Alex     |
      | Jane     |

  Scenario: An incorrect password is rejected
    When Alex logs in with the password "wrong-password"
    Then they should see the login error "Invalid username or password"
    And they should still be on the login page
