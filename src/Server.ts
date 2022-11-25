import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import chokidar from 'chokidar';

interface ServerConfig {
  port: number;
  root: string;
}

type Listen = (port: number, cb: (e?: Error) => void) => http.Server;

class Server {
  private _app: express.Application = express();
  private _server?: http.Server;
  private _connections: WebSocket[] = [];

  constructor() {
    this._onConnection = this._onConnection.bind(this);
    this._handleChange = this._handleChange.bind(this);
  }

  private _onConnection(ws: WebSocket) {
    this._connections.push(ws);
    ws.on('close', () => {
      const index = this._connections.indexOf(ws);
      if (index !== -1) {
        this._connections.splice(index, 1);
      }
    });
  }

  broadcast(data: unknown) {
    for (let i = 0; i <  this._connections.length; i += 1) {
      this._connections[i].send(data);
    }
  }

  private _handleChange(eventName: string, url: string) {
    this.broadcast('reload');
  }

  async start(config: ServerConfig) {
    const watcher = chokidar.watch(config.root);
    watcher.on('all', this._handleChange);

    return new Promise((resolve, reject) => {
      this._app.use(express.static(config.root));
      this._server = (this._app.listen as unknown as Listen)(config.port, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve('success');
        }
      });

      const socket = new WebSocketServer({
        server: this._server,
      });
      socket.on('connection', this._onConnection);
    });
  }

  stop() {
    this._server?.close();
    this._connections.length = 0;
  }
}

export { Server };
