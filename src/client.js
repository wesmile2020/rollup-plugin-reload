!function() {
  let protocol = 'ws';
  if (/https/.test(location.protocol)) {
    protocol = 'wss';
  }

  var socket = new WebSocket(`${protocol}://${location.host}`);
  socket.addEventListener('message', (e) => {
    if (e.data === 'reload') {
      location.reload();
    }
  });
}();
