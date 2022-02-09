/**
 *                          Blockchain Class
 *  The Blockchain class contain the basics functions to create your own private blockchain
 *  It uses libraries like `crypto-js` to create the hashes for each block and `bitcoinjs-message` 
 *  to verify a message signature. The chain is stored in the array
 *  `this.chain = [];`. Of course each time you run the application the chain will be empty because and array
 *  isn't a persisten storage method.
 *  
 */

const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./block.js');
const bitcoinMessage = require('bitcoinjs-message');




class Blockchain {

    /**
     * Constructor of the class, you will need to setup your chain array and the height
     * of your chain (the length of your chain array).
     * Also everytime you create a Blockchain class you will need to initialized the chain creating
     * the Genesis Block.
     * The methods in this class will always return a Promise to allow client applications or
     * other backends to call asynchronous functions.
     */
    constructor() {
        this.chain = [];
        this.height = -1;
        this.initializeChain();
    }

    /**
     * This method will check for the height of the chain and if there isn't a Genesis Block it will create it.
     * You should use the `addBlock(block)` to create the Genesis Block
     * Passing as a data `{data: 'Genesis Block'}`
     */
    async initializeChain() {
        if( this.height === -1){
            let block = new BlockClass.Block({data: 'Genesis Block'});
            await this._addBlock(block);
        }
    }

    /**
     * Utility method that return a Promise that will resolve with the height of the chain
     */
    getChainHeight() {
        return new Promise((resolve, reject) => {
            resolve(this.height);
        });
    }

    /**
     * Utility method that will add a block to the blockchain chain and update its height
     * @param {*} block the block to be added
     */
    updateChain(block) {
        return new Promise((resolve, reject) => {
            this.chain.push(block);
            this.height += 1; 

            resolve();
        });
    }

    /**
     * _addBlock(block) will store a block in the chain
     * @param {*} block 
     * The method will return a Promise that will resolve with the block added
     * or reject if an error happen during the execution.
     * You will need to check for the height to assign the `previousBlockHash`,
     * assign the `timestamp` and the correct `height`...At the end you need to 
     * create the `block hash` and push the block into the chain array. Don't for get 
     * to update the `this.height`
     * Note: the symbol `_` in the method name indicates in the javascript convention 
     * that this method is a private method. 
     */
    _addBlock(block) {
        let self = this;
        return new Promise(async (resolve, reject) => {
            //Getting the height of the previous block
            self.getChainHeight().then(function(result){
                //Getting block's height
                var blockheight = result + 1;
                //Getting Previous block's previous Block Hash
                if(result != -1){ 
                    var previousBlockHash = self.chain[result].hash;
                }
                else{
                    var previousBlockHash = null;
                }
                //Getting block's timestamp
                var currentTime = new Date().getTime().toString().slice(0, -3)
                //Updating block height, previousBlockHash, and time
                block.updateBlock(blockheight, currentTime, previousBlockHash) ;

            })
            .catch(error =>{
                console.log(error)
            })
            .then(function(){
                //Calculating and adding to block its hash
                var blockHash = SHA256(JSON.stringify(block));
                
                //Setting block hash
                block.addHash(blockHash);
                //console.log(block);

            }).then( ()=>{
            
                //Adding the block to the chain
                self.updateChain(block).then(function(){
                    //Using 'validateChain' method to validate the chain after adding 'block' to it
                    self.validateChain().then(function(res){
                        //console.log(res);
                    });
                    //resolving
                    if(self.height == block.height){
                        resolve(block); 
                    }
                    else{
                        reject("error, the block was not added")
                    }
                }) 

            })
            
            


        });
        
    }

    /**
     * The requestMessageOwnershipVerification(address) method
     * will allow you  to request a message that you will use to
     * sign it with your Bitcoin Wallet (Electrum or Bitcoin Core)
     * This is the first step before submit your Block.
     * The method return a Promise that will resolve with the message to be signed
     * @param {*} address 
     */
    requestMessageOwnershipVerification(address) {
        return new Promise((resolve) => {
            //Getting the right time
            var date = new Date().getTime().toString().slice(0, -3);
            //Setting the message
            var message = address+":"+date+":starRegistry"; 
            resolve(message);
        });
    }

    /**
     * The submitStar(address, message, signature, star) method
     * will allow users to register a new Block with the star object
     * into the chain. This method will resolve with the Block added or
     * reject with an error.
     * Algorithm steps:
     * 1. Get the time from the message sent as a parameter example: `parseInt(message.split(':')[1])`
     * 2. Get the current time: `let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));`
     * 3. Check if the time elapsed is less than 5 minutes
     * 4. Veify the message with wallet addreess and signature: `bitcoinMessage.verify(message, address, signature)`
     * 5. Create the block and add it to the chain
     * 6. Resolve with the block added.
     * @param {*} address 
     * @param {*} message 
     * @param {*} signature 
     * @param {*} star 
     */
    submitStar(address, message, signature, star) {
        let self = this;
        return new Promise(async (resolve, reject) => {
            //Getting the time from the message
            var time = parseInt(message.split(':')[1]);
            //Getting the current time
            let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));
            //Checking if the time elapsed is less than 5 minutes
            var timeElapsedUnderFiveMin = ((currentTime - time) < 500*60);
            //Verification of the message
            var messageVerification = bitcoinMessage.verify(message, address, signature,null,true);
            //Creation and adding the block to the chain
            if(timeElapsedUnderFiveMin && messageVerification){
                //Creating the new block
                let block = new BlockClass.Block({"owner": address, "star": star});
                //Adding the new block to the chain
                self._addBlock(block).then(function(blockAdded){
                    resolve(blockAdded);
                });
            }
            //if the time Elapsed is more than 5 minutes or the message is unverifyed
            else(
                reject("error, something went wrong")
            )
            
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block
     *  with the hash passed as a parameter.
     * Search on the chain array for the block that has the hash.
     * @param {*} hash 
     */
    getBlockByHash(hash) {
        let self = this;
        //Function for filtering the chain with the right hash
        function isRightHash(value) {
            return value === hash;
          }
        return new Promise((resolve, reject) => {
            //Filtering the chain
            var blockFound = self.chain.filter(isRightHash);
            //The block with the right hash was found
            if(blockFound.length != 0){
                resolve(blockFound[0]);
            }
            //No block with the given hash was found
            else{
                reject("No block with that hash was found");
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block object 
     * with the height equal to the parameter `height`
     * @param {*} height 
     */
    getBlockByHeight(height) {
        let self = this;
        
        return new Promise((resolve, reject) => {
            let block = self.chain.filter(p => p.height == height);
            
            if(block){  
                resolve(block);
            } else {
                resolve(block);
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with an array of Stars objects existing in the chain 
     * and are belongs to the owner with the wallet address passed as parameter.
     * Remember the star should be returned decoded.
     * @param {*} address 
     */
    getStarsByWalletAddress (address) {
        let self = this;
        let stars = [];
        return new Promise((resolve, reject) => {
            //Going through all the blocks on the chain
            self.chain.forEach(element => { 
                //Avoinding the genesis block
                if(element.height != 0){
                    //Getting the data of each block of the chain
                    element.getBData().then(data =>{
                        //Filtering with the by checking the submitting address

                        if(data["owner"] === address){
                            //Filling the array 'stars'
                            stars.push(data);
                        }
                    });


                    //Filling the array 'stars' with stars posted by the given address

                }

            });
            resolve(stars);
        });
    }

    /**
     * This method will return a Promise that will resolve with the list of errors when validating the chain.
     * Steps to validate:
     * 1. You should validate each block using `validateBlock`
     * 2. Each Block should check the with the previousBlockHash
     */
    validateChain() {
        let self = this;
        let errorLog = [];
        return new Promise( async (resolve, reject) => {

            //Setting the previous block hash variable
            var previousBlockHash = null;
            
            //going trough each block of the chain
            self.chain.forEach( element => {
                //Getting the validation of the current block
                element.validate().then(   
                    (res) => { //Method triggered if the element.validate() method resolves
                        if (previousBlockHash != element.previousBlockHash) {
                            var error_message = "ERROR! Chain Brocken at Block n°" + element.height;
                            errorLog.push(error_message);  
                            //Setting the previous block hash with the current block hash for its use in the next iteration
                            previousBlockHash = element.hash;
                            //console.log("hash :", previousBlockHash);
                            
                        }
                    },
                    (rej) => { //Method for error handling if the element.validate() method rejects

                        //adding the error to errorLog
                        errorLog.push(rej);
                        
                        //Setting the previous block hash with the current block hash for its use in the next iteration
                        previousBlockHash = element.hash;

                    //console.log(res); 
                    //console.log(errorLog);
                    }
                ).then(()=>{
                    //Resolving only if it is the last block
                    if (element.height == self.height){
                        resolve(errorLog);
                    }
                });

                
            }); 
    
        });

    }

}

module.exports.Blockchain = Blockchain;   