'use strict';
const fetch = require('node-fetch')
const app = {
    TINGG_URL: 'https://api.stage01a.tingg.io/v1/',
    email: "e_thie10@uni-muenster.de",
    password: "senseboxRocks"
}
let access_token;

/**
 * inits tingg registration process 
 * 0. login (name,password)
 * 1. createThingType (name,sensors, )
 * 2. createThing ( name, thingtypeid)
 * 3. linkModem (imsi,thingid)
 */
const initTingg = async function newbox(box) {
    if (!access_token) {
       await login({ "email": app.email, "password": app.password })
    }
    createThingType(box)
        .then(data=>{
            console.log("thingtype creation",data);
            createThing(box.name,data.id)})
        // .then(data=>linkModem(box.imsi,data.id))
    
    // start tingg initialization
    // createThingType(box)
    //     .then(data => data.json())
    //     .then(json => createThing(box.name, json.thingtypeid))
    //     .then(data => data.json())
    //     .then(json => json.thing_id)
    //     .then(response=>response.json())
    //     .then(json => console.log(json))

    // createThingType(box)
    //     .then(res => console())
    //     .then(json => console.log(json))
    // .then((thing_id) => linkModem(box.imsi, thing_id))
}


/**
 * logs into tingg developer account
 * @param {"email":"email","password":"password"} data 
 */
const login = function login(data) {
    console.log("logging in",data);
    return fetch(app.TINGG_URL + 'auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" }
    })
        .then(response => {
            if (response.status === 401) {
                console.log("Unauthorized");
            }
            return response.json();
        })
        .then(json => { access_token = json.token })
        .catch(err => console.error(err))
}
/**
 * gets new token based on old one
 * @param token: String
 */
const refreshToken = function refreshToken() {
    return fetch(app.TINGG_URL + 'auth/token-refresh', {
        method: 'POST',
        headers: { "Authorization": "Bearer " + access_token }
    })
        .then(res => res.json())
        .catch(err => console.error(err));
}
/*
    calls POST https://api.tingg.io/v1/thing-types to create thing types 
    should be called right after verifyModem()
    input: sensors, box , name (look pdf for body example)
    output: thing_type_id
*/
const createThingType = async function createThingType(data) {
    const thingtypebody = buildBody(data);
    return fetch(app.TINGG_URL + '/thing-types', {
        method: 'POST',
        body: JSON.stringify(thingtypebody),
        headers: { "Authorization": "Bearer " + access_token,"Content-Type": "application/json" }
    })
        .then(res => {
            console.log(res);
            if (res.status === 401) {
                console.log("Unauthorized");
                handleAuthError()
                createThingType(data);
            }
            if(res.status === 201) {
                console.log("thing type created successfully")
                return res.json()
            }
            if(res.status === 400){
                throw new Error("Invalid Input")
            }
        })
        .catch(err => console.log("error", err))
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

const createThing = async function createThing(name,thingid) {
    const body = { "name": name, "thing_type_id": thingid }
    return fetch(app.TINGG_URL + '/things', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { "Authorization": "Bearer " + access_token, "Content-Type": "application/json" }
    })
        .then(res => {
            if (res.status === 401){
                console.log("Unauthorized");
                throw new Error('Unauthorized');
            }
            if(res.status === 201 ) {
                console.log("thing created successuly")
                return res.json()
            }
            if(res.status === 400) {
                console.log("invalid input")
                throw new Error("Invalid Input");
            }
        })
        .catch(err => handleError(err, createThing, data))
}
/**Helper function to build the data accordingly from the sensor array
 *  needs name and box id
 * @param {sensor array from registration} data 
 */
const buildBody = function buildBody(data) {
    let resources = []
    if (data.sensors) {
        data.sensors.map((sensor) => {
            let toAdd = {
                "topic": `/osm/${data._id}/${sensor._id}`,
                "method": "pub",
                "type": "number"
            }
            resources.push(toAdd);
        })
    }
    let body = {
        "name": data._id,
        "description":"Some basic description",
        "resources": resources
    }
    return body;
}

/*
    calls POST https://api.tingg.io/v1/modems/:imsi/link to verify modem and thing id 
    input: imsi and thing_id 
    output:200/400 status code 
*/
const linkModem = function linkModem(data) {
    return fetch(app.TINGG_URL + '/modems/' + data.imsi + '/link', {
        method: 'POST',
        body: data.thing_id,
        headers: { "Authorization": "Bearer " + access_token }
    })
        .then(res => res.json())
        .catch(err => handleError(err, linkModem, data))

}
const handleAuthError = function handleAuthError(func, data) {
    /*
        pulls new access token if old one is not accepted anymore
        TODO: pulls infinitely till new access token is returned => server error ? 
    */
    console.log("authorization failed at tingg; requesting new token")
    refreshToken(access_token)
        .then(res => res.json())
        .then(json => access_token = json.token)
}



module.exports = {
    login,
    refreshToken,
    createThingType,
    createThing,
    linkModem,
    access_token,
    initTingg
}