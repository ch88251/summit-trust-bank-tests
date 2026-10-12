@ignore
Feature: Login and return a bearer token

  Scenario:
    Given url baseUrl + '/api'
    And path 'auth/login'
    And request { username: '#(username)', password: '#(password)' }
    When method post
    Then status 200
    * def token = response.access_token
    * def auth = 'Bearer ' + token
