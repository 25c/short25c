var settings = {
    'host' : 'localhost',
    'port': 8080,
    'sessionSecret': 'sessionSecret', // Session salt
    'url': 'http://25c.com', // Without trailing slash /
    'dotcloud' : false // Use dotcloud environment
};

// Redis config
settings.redis = {
    'host' : 'localhost',
    'port' : 6379,
    'pass' : false
};

module.exports = settings;
