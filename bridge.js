var osc = require('node-osc'),
    io = require('socket.io').listen(8081);

var oscServer, oscClient;

io.on('connection', function (socket) {
  socket.on('config', function (obj) {
    console.log('config', obj);
    oscServer = new osc.Server(obj.server.port, obj.server.host);
    console.log(socket.id + " connected");

    oscServer.on('message', function(msg, rinfo) {
      socket.emit('message', msg);
      console.log(msg);
      //console.log('sent OSC message to WS', msg, rinfo);
    });
  });
  socket.on("disconnect", function () {
    oscServer.close();
  })
});