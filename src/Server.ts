import express from 'express';
import http from 'http';
import https from 'https';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import chokidar from 'chokidar';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';

export type ProxyConfig = {
  [key in string]: Options;
}

interface ServerConfig {
  port: number;
  root: string;
  proxy?: ProxyConfig;
  https?: {
    key: string;
    cert: string;
  }
}

type Listen = (port: number, cb: (e?: Error) => void) => http.Server;

class Server {
  private _app: express.Application = express();
  private _server?: http.Server | https.Server;
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

  private _registerProxy(config: ServerConfig) {
    const { proxy } = config;
    if (!proxy) return;
    for (const key in proxy) {
      const middleware = createProxyMiddleware(proxy[key]);
      this._app.use(key, middleware);
    }
  }

  async start(config: ServerConfig) {
    const watcher = chokidar.watch(config.root);
    watcher.on('all', this._handleChange);
    this._registerProxy(config);

    return new Promise((resolve, reject) => {
      this._app.use(express.static(config.root));

      if (config.https) {
        const key = fs.readFileSync(config.https.key, 'utf-8');
        const cert = fs.readFileSync(config.https.cert, 'utf-8');
        this._server = https.createServer({ key, cert }, this._app);
      } else {
        this._server = http.createServer(this._app);
      }
      (this._server.listen as Listen)(config.port, (err) => {
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
