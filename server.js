// Include modules
var config = require('./lib/get-config'),
    nus = require('./lib/nus'),
    connect = require('connect'),
    express = require('express'),
/*    
    assetManager = require('connect-assetmanager'),
    assetHandler = require('connect-assetmanager-handlers'),
*/    
    app = express.createServer(),
	sys = require('util');

function NotFound(msg) {
    this.name = 'NotFound';
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
}

// Gotta Catch 'Em All
process.addListener('uncaughtException', function (err, stack) {
    console.log('Caught exception: ' + err + '\n' + err.stack);
    console.log('\u0007'); // Terminal bell
});

/*
// Session store
var RedisStore = require('connect-redis')(express),
    sessionStore = new RedisStore(nus.getConfig());

// Setup groups for CSS / JS assets
var assetsSettings = {
    'js': {
        'route': /\/static\/js\/[a-z0-9]+\/.*\.js/,
        'path': './public/js/',
        'dataType': 'javascript',
        'files': [
            'jquery.min.js',
            'bootstrap.min.js',
            'nus.js'
        ],
        'debug': true,
        'postManipulate': {
            '^': [
                assetHandler.uglifyJsOptimize
            ]
        }
    },
    'css': {
        'route': /\/static\/css\/[a-z0-9]+\/.*\.css/,
        'path': './public/css/',
        'dataType': 'css',
        'files': [
            'bootstrap.min.css',
            'bootstrap-responsive.min.css',
            'nus.css'
        ],
        'debug': true,
        'postManipulate': {
            '^': [
                assetHandler.fixVendorPrefixes,
                assetHandler.fixGradients,
                assetHandler.replaceImageRefToBase64(__dirname + '/public'),
                assetHandler.yuiCssOptimize
            ]
        }
    }
};

var assetsMiddleware = assetManager(assetsSettings);
*/
// Settings
app.configure(function () {
    app.set('view engine', 'ejs');
    app.set('views', __dirname + '/views');
});

// Middleware
app.configure(function () {
    app.use(express.bodyParser());
    app.use(express.cookieParser());
/*    
    app.use(assetsMiddleware);
    app.use(express.session({
        'store': sessionStore,
        'secret': config.sessionSecret
    }));
*/    
    app.use(express.logger({
        format: ':response-time ms - :date - :req[x-real-ip] - :method :url :user-agent / :referrer'
    }));
    app.use(express['static'](__dirname + '/public', {
        maxAge: 86400000
    }));
});

// ENV based configuration
app.configure('development', function () {
    app.use(express.errorHandler({
        'dumpExceptions': true,
        'showStack': true
    }));
});

/*
// Template helpers
app.dynamicHelpers({
    'assetsCacheHashes': function (req, res) {
        return assetsMiddleware.cacheHashes;
    },
    'session': function (req, res) {
        return req.session;
    }
});

// Error handling
app.error(function (err, req, res, next) {
    res.contentType('html');

    if (err instanceof NotFound) {
        res.render('errors/404');
    } else {
        res.render('errors/500');
    }
});
*/

// Routing
app.all('/', function (req, res) {
    res.redirect(config['url-web'], 301);
});

app.all('/api/v1/:link', function (req, res) {
    var response = {},
        status_codes = {
            200 : 'OK',
            300 : 'Incorrect Link',
            400 : 'Bad Request',
            404 : 'Not Found',
            500 : 'Internal Server Error',
            503 : 'Unknown Server Error'
        };

    res.contentType('application/json');

    switch (req.params.link) {
    case 'shorten':
        nus.shorten(req.param('long_url')+'/'+req.param("referrer_id")+'/'+req.param("provider_id"), function (err, reply) {
            if (err) {
                response = {
                    'status_code' : (status_codes[err]) ? err : 503,
                    'status_txt'  : status_codes[err] || status_codes[503]
                };
            } else {
                response = {
                    'status_code' : 200,
                    'status_txt'  : status_codes[200],
                    'hash'        : reply.hash,
                    'url'         : config.url + '/' + reply.hash,
                    'long_url'    : reply.long_url
                };
            }

            res.send(response, response.status_code);
        });
        break;

    case 'expand':
        nus.expand(req.param('short_url'), function (err, reply) {
            if (err) {
                response = {
                    'status_code' : (status_codes[err]) ? err : 503,
                    'status_txt'  : status_codes[err] || status_codes[503]
                };
            } else {
					//
					//
					//	we need to deconstruct the resulting URL here to remove referrer_id and provider_id and create a click transaction 
					//  with them. Basically probably send them to the Redis QUEUE database for completion and processing. 
					//
					// 	So we only send reply.url minus the last two elements
					//
					//
					var temp_url_elements = reply.long_url.split('/');
					var temp_url = "";
					var i;

					for (i = 0; i < temp_url_elements.length - 2; i++)
						temp_url = temp_url + temp_url_elements[i] + '/';


					temp_url = temp_url.slice(0, -1);

					var referrer_id = temp_url_elements[temp_url_elements.length - 2];
					var provider_id = temp_url_elements[temp_url_elements.length - 1];
					
//					sys.puts(sys.inspect(referrer_id));
//					sys.puts(sys.inspect(provider_id));
					
					
                response = {
                    'status_code' : 200,
                    'status_txt'  : status_codes[200],
                    'hash'        : reply.hash,
                    'url'         : config.url + '/' + reply.hash,
                    'long_url'    : temp_url,
                    'clicks'      : reply.clicks,
					'referrer_id' : referrer_id,
					'provider_id' : provider_id
				};
            }

            res.send(response, response.status_code);
        });
        break;

    default:
        response = {
            'status_code' : 404,
            'status_txt'  : status_codes[404]
        };

        res.send(response, response.status_code);
    }
});

app.all(/^\/(\w+)\+/, function (req, res){
    nus.statistic(req.params[0], function (err, reply) {
        if (err) {
            res.send(404);
        } else {
            reply.url = config.url + '/' + reply.hash;

            res.render('statistic', {
                statistic: reply
            });
        }
    });
});

app.all(/^\/(\w+)$/, function (req, res){
    nus.expand(req.params[0], function (err, reply) {
        if (err) {
            res.send(404);
        } else {
  					var temp_url_elements = reply.long_url.split('/');
  					var temp_url = "";
  					var i;

  					for (i = 0; i < temp_url_elements.length - 2; i++)
  						temp_url = temp_url + temp_url_elements[i] + '/';


  					temp_url = temp_url.slice(0, -1);

  					var referrer_id = temp_url_elements[temp_url_elements.length - 2];
  					var provider_id = temp_url_elements[temp_url_elements.length - 1];
            res.redirect(temp_url, 301);
        }
    }, true);
});

// If all fails, hit em with the 404
app.all('*', function (req, res) {
    res.render('errors/404');
});



//if(config.dotcloud) {
//    app.listen(8080);
//} else {
    app.listen(config.port, config.host);
    console.log('Running in ' + (process.env.NODE_ENV || 'development') + ' mode @ ' + config.url);
//}
