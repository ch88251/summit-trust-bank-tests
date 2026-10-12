Feature: Auth API

  Background:
    * url baseUrl + '/api'

  Scenario: health checks
    Given path '/health'
    When method get
    Then status 200
    And match response == {status: 'ok'}

  Scenario: login returns a bearer token and the user
    Given path 'auth/login'
    And request users.demo
    When method post
    Then status 200
    And match response.access_token == '#regex [A-Za-z0-9_-]+[.][A-Za-z0-9_-]+[.][A-Za-z0-9_-]+'
    And match response.user == { id: '#number', username: 'demo', full_name: 'Alex Morgan', email: 'alex.morgan@example.com' }

  Scenario: Login with the wrong password is 401
    Given path 'auth/login'
    And request { username: 'demo', password: 'nope' }
    When method post
    Then status 401
    And match response == { detail: 'Invalid username or password' }
