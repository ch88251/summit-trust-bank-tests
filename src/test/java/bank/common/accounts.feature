@ignore
Feature: Look up the current user's account by type

  Scenario:
    Given url baseUrl + '/api'
    And path 'accounts'
    When method get
    Then status 200
    * def byType =
      """
      function (type) {
        var found = karate.jsonPath(response, "$[?(@.account_type=='" + type + "')]");
        return karate.sizeOf(found) > 0 ? found[0] : null;
      }
      """
    * def checking = byType('CHECKING')
    * def savings = byType('SAVINGS')
    * def brokerage = byType('BROKERAGE')
