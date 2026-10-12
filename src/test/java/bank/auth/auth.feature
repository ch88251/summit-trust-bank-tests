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

  Scenario: login with empty fields is 422
    Given path 'auth/login'
    And request { username: '', password: '' }
    When method post
    Then status 422

  Scenario: me returns the current user
    * def login = call read('classpath:bank/common/login.feature') users.demo
    Given path 'auth/me'
    And header Authorization = login.auth
    When method get
    Then status 200
    And match response.username == 'demo'

  Scenario: logout returns 204
    * def login = call read('classpath:bank/common/login.feature') users.demo
    Given path 'auth/logout'
    And header Authorization = login.auth
    When method post
    Then status 204

  Scenario: a tampered token is rejected
    Given path 'auth/me'
    And header Authorization = 'Bearer abc.def.ghi'
    When method get
    Then status 401

  Scenario Outline: GET <endpoint> without a token is 40
    Given path '<endpoint>'
    When method get
    Then status 401

    Examples:
      | endpoint     |
      | auth/me      |
      | accounts     |
      | payees       |
      | transfers    |
      | payments     |
      | trade/quotes |

