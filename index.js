var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

function checkTime(t) {
    if (t < 10) {
        t = "0" + t;
    }
    return t;
}
var users = ["Online"];
var messages = [];

io.on('connection', function(socket) {
    console.log('a user connected');
    socket.emit('cookiestart');

    for (var m in messages) {
        socket.emit('chat message', messages[m]);
    }
    for (var u in users) {
        io.emit('add online', users[u]);
    }

    socket.on('chat message', function(msg) {
        time = new Date();
        timestamp = checkTime(time.getHours()) + ":" + checkTime(time.getMinutes()) + ":" + checkTime(time.getSeconds());
        msg += "<p></p>" + timestamp;
        messages.push(msg);
        io.emit('chat message', msg);
        console.log('message: ' + msg + " time: " + timestamp);
    });
    socket.on('nick', function(n) {
        if (users.includes(n)) {
            socket.emit('refuse');
        } else {
            var index = users.indexOf(socket.id);
            if (index !== -1) users.splice(index, 1);
            socket.id = n;
            socket.emit('newcookie', socket.id);
            users.push(n);
            io.emit('clear user');
            for (var u in users) {
                io.emit('add online', users[u]);
            }
        }

    });

    socket.on('disconnect', function() {
        var index = users.indexOf(socket.id);
        if (index !== -1) users.splice(index, 1);
        io.emit('clear user');
        console.log('user disconnected');
        for (var u in users) {
            io.emit('add online', users[u]);
        }
    });

    socket.on('checkcookie', function(cookie) {
        if (cookie != "") {
            var temp = cookie.split(",")[0].split("=")[1];
            if (users.includes(temp)) {
                socket.id = Math.floor((Math.random() * 100000) + 1);
                socket.emit('nickstole', socket.id);
            } else {
                socket.id = temp;
            }
            io.emit('clear user');
            socket.emit('changeid', socket.id);
            socket.emit('identify');
            users.push(socket.id);
        } else {
            socket.emit('newcookie', socket.id);
            io.emit('clear user');
            socket.emit('identify');
            users.push(socket.id);
        }
        for (var m in messages) {
            socket.emit('chat message', messages[m]);
        }
        for (var u in users) {
            io.emit('add online', users[u]);
        }
    });

});

http.listen(3366, function() {
    console.log('listening on *:3366');
});
