/**
 *                 ApplicationServer
 *             (Do not change this code)
 * Require Modules to setup the REST Api
 * - `express` Express.js is a Web Framework
 * - `morgan` Isn't required but help with debugging and logging
 * - `body-parser` This module allows to parse the body of the post request into a JSON
 */
const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const winston = require('winston');
//const debug = require('debug')('http');
const logger = winston.createLogger({
	level: 'info',
	format: winston.format.json(),
	defaultMeta: { service: 'user-service' },
	transports: [
	  //
	  // - Write all logs with importance level of `error` or less to `error.log`
	  // - Write all logs with importance level of `info` or less to `combined.log`
	  //
	  new winston.transports.File({ filename: 'error.log', level: 'error' }),
	  new winston.transports.File({ filename: 'combined.log' }),
	],
  });

  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));




/**
 * Require the Blockchain class. This allow us to have only one instance of the class.
 */
const BlockChain = require('./src/blockchain.js');



class ApplicationServer {


	
	constructor() {
		//Express application object
		this.app = express();
		//Blockchain class object
		this.blockchain = new BlockChain.Blockchain();
		//Method that initialized the express framework.
		this.initExpress();
		//Method that initialized middleware modules
		this.initExpressMiddleWare();
		//Method that initialized the controllers where you defined the endpoints
		this.initControllers();
		//Method that run the express application.
		this.start();
	}

	initExpress() {
		this.app.set("port", 8000);
	}

	initExpressMiddleWare() {
		this.app.use(morgan("dev"));
		this.app.use(bodyParser.urlencoded({extended:true}));
		this.app.use(bodyParser.json());
	}

	initControllers() {
        require("./BlockchainController.js")(this.app, this.blockchain);
	}

	start() {

		let self = this;
		this.app.listen(this.app.get("port"), () => {
			//console.log(`Server Listening for port: ${self.app.get("port")}`);
			//first usage of the winston package
			logger.info(`Server Listening for port: ${self.app.get("port")}`);
		});
	}



}

new ApplicationServer();