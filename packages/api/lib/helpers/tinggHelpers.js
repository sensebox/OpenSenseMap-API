'use strict';
const fetch = require('node-fetch')
const app = {
    TINGG_URL: 'https://api.stage01a.tingg.io/v1/',
    email:"e_thie10@uni-muenster.de",
    password:"senseboxRocks"
}
let access_token;
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
    .then(json=>{access_token = json.token})
    .catch(err=>console.error(err))
}
/**
 * gets new token based on old one
 * @param token: String
 */
const refreshToken = function refreshToken(token){
    return fetch(app.TINGG_URL+'auth/token-refresh',{
        method:'POST',
        headers:{"Authorization":"Bearer "+access_token}
    })
    .then(res=>res.json())
    .catch(err=>console.error(err));
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
        headers:{"Authorization":"Bearer " + access_token}
    })
    .then(res=>res.json())
    .catch(err=>handleError(err,verifyModem,data))
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
        headers:{"Authorization":"Bearer "+access_token}
    })
    .then(res=>res.json())
    .catch(err=>handleError(err,createThing,data))
}

/*
    calls POST https://api.tingg.io/v1/thing-types to create thing types 
    should be called right after verifyModem()
    input: sensors, box , name (look pdf for body example)
    output: thing_type_id
*/

const createThingType = function createThingType(data){
    return fetch(app.TINGG_URL+'/thing-types',{
        method:'POST',
        body:JSON.stringify(data),
        headers:{"Authorization":"Bearer "+access_token}
    })
    .then(res=>res.json())
    .catch(err=>handleError(err,createThingType,data))
}

/*
    calls POST https://api.tingg.io/v1/modems/:imsi/link to verify modem and thing id 
    input: imsi and thing_id 
    output:200/400 status code 
*/
const linkModem = function linkModem(data){
    return fetch(app.TINGG_URL+'/modems/'+data.imsi+'/link',{
        method:'POST',
        body:data.thing_id,
        headers:{"Authorization":"Bearer "+access_token}
    })
    .then(res=>res.json())
    .catch(err=>handleError(err,linkModem,data))

}

/**
 * 
 */
const handleError = function handleError(err,func,data){
    /*
        pulls new access token if old one is not accepted anymore
        TODO: pulls infinitely till new access token is returned => server error ? 
    */
    if(err.name === 'Unauthorized'){
        console.log("authorization failed at tingg; requesting new token")
        refreshToken(access_token)
        .then(res=>res.json())
        .then(json => access_token = json.token)
        .then(()=>
        {   
            console.log("retrying function")
           func(data)
        })
    }
    if(err.name=== 'internal server error'){
        console.log("internal server error at tingg")
        return err;
    }

    return err;
}


module.exports = {
    login,
    refreshToken,
    verifyModem,
    createThingType,
    createThing,
    linkModem,
    access_token
}