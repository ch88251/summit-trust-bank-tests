Feature: Auth API

  Background:
    * url baseUrl + '/api'

  Scenario: health checks
    Given path '/health'
    When method get
    Then status 200
    And match response == {status: 'ok'}

