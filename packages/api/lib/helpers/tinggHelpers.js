'use strict';
/**
 * logs into tingg developer account
 * @param {"email":"email","password":"password"} data 
 */

const login = function login(data){

}
/**
 * gets new token based on old one
 * @param {"token":token} data 
 */
const refreshToken = function refreshToken(data){

}

/**  calls   GET https://api.tingg.io/v1/modems/:imsi/verify?code=:code to verify imsi and secret code
 *  
 *  input: imsi and secret code from register ui
 *    output:200/400 status code
 * 
 * @param {*} data {"imsi":imsi,"secret_code":secret_code}
 */
const verifyModem = function verifyModem(data){

}
/*
    calls POST https://api.tingg.io/v1/things to create a thing
    input: thing_type_id from previous request
    output: thing_id

    data = {
    "name": "Some name, maybe senseBoxId",
    "thing_type_id": "80fe09c5-bd02-43b7-9947-ea6ad458181b"
    }

*/

const createThing = function createThing(data){

}

/*
    calls POST https://api.tingg.io/v1/thing-types to create thing types 
    should be called right after verifyModem()
    input: sensors, box , name (look pdf for body example)
    output: thing_type_id
*/

const createThingType = function createThingType(data){

}

/*
    calls POST https://api.tingg.io/v1/modems/:imsi/link to verify modem and thing id 
    input: imsi and thing_id 
    output:200/400 status code 
*/
const linkModem = function linkModem(data){

}


module.exports = {
    login,
    refreshToken,
    verifyModem,
    createThingType,
    createThing,
    linkModem
}