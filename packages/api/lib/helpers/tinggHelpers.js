'use strict';
const fetch = require('node-fetch')
const app = {
    TINGG_URL: 'https://api.stage01a.tingg.io/v1/'
}
/**
 * logs into tingg developer account
 * @param {"email":"email","password":"password"} data 
 */

const login = function login(data){
    return fetch(app.TINGG_URL+'auth/login',{
        method:'POST',
        body:JSON.stringify(data),
        headers:{"Content-Type":"application/json"}
    })
    .then(res => res.json())
    .catch(err=>console.error(err))
}
/**
 * gets new token based on old one
 * @param {"token":token} data 
 */
const refreshToken = function refreshToken(data){
    return fetch(app.TINGG_URL+'auth/token-refresh',{
        method:'POST',
        headers:{"Authorization":"Bearer "+data.token}
    })
    .then(res=>res.json())
}

/**  calls   GET https://api.tingg.io/v1/modems/:imsi/verify?code=:code to verify imsi and secret code
 *  
 *  input: imsi and secret code from register ui
 *    output:200/400 status code
 * 
 * @param {*} data {"imsi":imsi,"secret_code":secret_code}
 */
const verifyModem = function verifyModem(data){
    return fetch(app.TINGG_URL+'/modems'+data.imsi+'verify?code='+data.secret_code,{
        method:'GET',
        headers:{"Authorization":"Bearer " + token}
    })
    .then(res=>res.json())
    .catch(err=>console.error(err))
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
    return fetch(app.TINGG_URL+'/things',{
        method:'POST',
        body:JSON.stringify(data),
        headers:{"Authorization":"Bearer "+token}
    })
    .then(res=>res.json())
    .catch(err=>console.error(err))
}

/*
    calls POST https://api.tingg.io/v1/thing-types to create thing types 
    should be called right after verifyModem()
    input: sensors, box , name (look pdf for body example)
    output: thing_type_id
*/

const createThingType = function createThingType(data){
    return fetch(app.TINGG_URL+'/thing-types'{
        method:'POST',
        body:JSON.stringify(data),
        headers:{"Authorization":"Bearer "+token}
    })
    .then(res=>res.json())
    .catch(err=>console.error(err))
}

/*
    calls POST https://api.tingg.io/v1/modems/:imsi/link to verify modem and thing id 
    input: imsi and thing_id 
    output:200/400 status code 
*/
const linkModem = function linkModem(data){
    return fetch(app.TINGG_URL+'/modems/'+data.imsi+'/link'{
        method:'POST',
        body:data.thing_id,
        headers:{"Authorization":"Bearer "+token}
    })
    .then(res=>res.json())
}


module.exports = {
    login,
    refreshToken,
    verifyModem,
    createThingType,
    createThing,
    linkModem
}