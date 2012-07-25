var url = require('url');
var redisURL;
var redisApiURL;
if (process.env.REDISTOGO_SHORT_URL) {
	redisURL = url.parse(process.env.REDISTOGO_URL);
} else {
	redisURL = url.parse('http://user:pass@localhost:6379');
}
if (process.env.REDISTOGO_API_URL) {
	redisApiURL = url.parse(process.env.REDISTOGO_API_URL);
} else {
	redisApiURL = url.parse('http://user:pass@localhost:6379');
}
		
var settings = {
  development: {
    'host' : 'localhost',
    'port': 8080,
    'sessionSecret': 'sessionSecret', // Session salt
    'url': 'http://localhost:8080', // Without trailing slash /
    'url-web': 'http://localhost:3000',
    'dotcloud' : false, // Use dotcloud environment
    'redis': {
      'host' : 'localhost',
      'port' : 6379,
      'pass' : false
    },
    'redis-api': {
      'host' : 'localhost',
      'port' : 6379,
      'pass' : false
    }
  },
  test: {
    'host' : 'localhost',
    'port': 8080,
    'sessionSecret': 'sessionSecret', // Session salt
    'url': 'http://localhost:8080', // Without trailing slash /
    'url-web': 'http://localhost:3000',
    'dotcloud' : false, // Use dotcloud environment
    'redis': {
      'host' : 'localhost',
      'port' : 6379,
      'pass' : false
    },
    'redis-api': {
      'host' : 'localhost',
      'port' : 6379,
      'pass' : false
    }
  },
  production: {
    'host' : 'plus25c.com',
    'port': 80,
    'sessionSecret': 'sessionSecret', // Session salt
    'url': 'http://plus25c.com', // Without trailing slash /
    'url-web': 'https://www.plus25c.com',
    'dotcloud' : false, // Use dotcloud environment
    'redis': {
      'host' : redisURL.hostname,
      'port' : redisURL.port,
      'pass' : redisURL.auth.split(":")[1]
    },
    'redis-api': {
      'host' : redisApiURL.hostname,
      'port' : redisApiURL.port,
      'pass' : redisApiURL.auth.split(":")[1]
    }
  },
};

module.exports = settings[process.env.NODE_ENV || 'development'];
