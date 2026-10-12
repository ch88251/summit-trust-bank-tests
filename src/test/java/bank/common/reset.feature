@ignore
Feature: Restore the seeded demo data

  Scenario:
    Given url baseUrl + '/api'
    And path 'test/reset'
    When method post
    Then status 200
