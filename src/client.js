!function() {
  var socket = new WebSocket(`ws://${location.host}`);
  socket.addEventListener('message', (e) => {
    if (e.data === 'reload') {
      location.reload();
    }
  });
}()
