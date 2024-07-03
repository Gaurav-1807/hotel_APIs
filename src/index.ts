import router from './routes';
import { Application } from "express"
const bodyParser = require('body-parser');
const express = require("express");
import cors from "cors";
const morgan = require('morgan');
var path = require('path');
const rfs = require("rotating-file-stream");
require("dotenv").config();


export default class Server{

    public app: Application;

    constructor() {
        this.app = express();
        const allowedOrigins = process.env.ALLOWEDORIGINS;
        const options: cors.CorsOptions = {
            origin: allowedOrigins,
            credentials: true
        }
        this.app.use(cors(options));
        this.config();
        this.routes();
    }

    config(): void {
        this.app.set('port', process.env.PORT || 5000);
        var accessLogStream = rfs.createStream('access.log', {
            interval: '1d', // rotate daily
            path: path.join(__dirname, 'log')
        })    
        this.app.use(morgan('combined', { stream: accessLogStream }));
        this.app.use(bodyParser.json());
    }

    routes(): void {
        this.app.use('/', router)
        this.app.all('*', function(req, res){
            res.status(404).send({message: '404! Page not found'});
        });
    }

    start(): void {
        this.app.listen(this.app.get('port'), () => {
            console.log('Server is running on :- ' + "localhost" + ':' + this.app.get('port'))
        });

        process.on('uncaughtException', (error)  => {
            console.log('Oh my god, something terrible happened: ',  error);
            process.exit(1); // exit application 
        })

        process.on('unhandledRejection', (error, promise) => {
            console.log(' Oh Lord! We forgot to handle a promise rejection here: ', promise);
            console.log(' The error was: ', error );
        });
    }
}
const server = new Server();
server.start();