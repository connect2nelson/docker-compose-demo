var express = require('express'),
    async = require('async'),
    mysql = require('mysql'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    app = express(),
    server = require('http').Server(app),
    io = require('socket.io')(server);

io.set('transports', ['polling']);

var port = process.env.PORT || 4000;

io.sockets.on('connection', function(socket) {

    socket.emit('message', {
        text: 'Welcome!'
    });

    socket.on('subscribe', function(data) {
        socket.join(data.channel);
    });
});

async.retry({
        times: 1000,
        interval: 1000
    },
    function(callback) {

        var client = mysql.createConnection({
            host: "account-database",
            user: "michaelbolton",
            password: "password",
            database: "dockercon2017"
        });

        console.log('Connecting')
        client.connect(function(err) {
            if (err) {
                console.error("Waiting for db");
            }
            callback(err, client);
        });

    },
    function(err, client) {
        if (err) {
            return console.err("Giving up");
        }
        console.log("Connected to db");
        getAccount(client);
    }
);

function getAccount(client) {

    console.log('Querying')
    var queryText = 'SELECT * FROM account WHERE id=12345'

    client.query(queryText, function(error, result) {
        if (error) {
            console.log(error)
        } else {
            io.sockets.emit("account", JSON.stringify(result[0]))
        }

    setTimeout(function() {getAccount(client) }, 1000);
    });

}

app.use(cookieParser());
app.use(bodyParser());
app.use(methodOverride('X-HTTP-Method-Override'));
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
    next();
});

app.use(express.static(__dirname + '/views'));

app.get('/', function(req, res) {
    res.sendFile(path.resolve(__dirname + '/views/index.html'));
});

server.listen(port, function() {
    var port = server.address().port;
    console.log('App running on port ' + port);
});