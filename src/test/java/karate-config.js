function fn() {
  var config = {
    baseUrl: karate.properties['baseUrl'] || 'https://bank.cfhayes.com',
    users: {
      demo: { username: 'demo', password: 'Demo@123' },
      jane: { username: 'jane', password: 'Jane@123' }
    }
  };
  karate.configure('connectTimeout', 10000);
  karate.configure('readTimeout', 10000);
  return config;
}
