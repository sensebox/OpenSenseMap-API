'use strict';
const fetch = require('node-fetch');
const handleError = require('./errorHandler');

const app = {
    TINGG_URL: 'https://api.stage01a.tingg.io/v1/',
    email: 'e.thieme@reedu.de',
    password: 'senseboxRocks'
},
    TinggError = require('./tinggError');
let access_token = '572390572385';

/**
 * inits tingg registration process 
 * 0. login (name,password)
 * 1. createThingType (name,sensors, )
 * 2. createThing ( name, thingtypeid)
 * 3. linkModem (imsi,thingid)
 */
const initTingg = async function initTingg(box) {
    let thing_id, thing_type_id, link_id;
    for (let index = 0; index < 2; index++) {
        try {
            thing_type_id = await createThingType(box);
            thing_id = await createThing(box.name, thing_type_id);
            link_id = await linkModem(box.integrations.gsm.imsi, thing_id);
            break;
        } catch (e) {
            if (e.message !== '401') {
                throw e
            }
            await handleAuthError(e);
        }
    }
    return { thing_id, thing_type_id };
}


/**
 * logs into tingg developer account
 * @param {"email":"email","password":"password"} data 
 */
const login = async function login(data) {
    let response = await fetch(app.TINGG_URL + 'auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" }
    })
    response = await response.json();
    return response.token;

}
/**
 * gets new token based on old one
 * @param token: String
 */
const refreshToken = async function refreshToken() {
    let response = await fetch(app.TINGG_URL + 'auth/token-refresh', {
        method: 'POST',
        headers: { "Authorization": "Bearer " + access_token, "Content-Type": "application/json" }
    })
    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Unauthorized Refresh');
        }
        else {
            throw new TinggError(`Internal Server or unkown error ${response.status} `, { type: 'InternalServerError' })
        }
    }
    response = await response.json();
    return response.token;


}
/*
    calls POST https://api.tingg.io/v1/thing-types to create thing types 
    should be called right after verifyModem()
    input: sensors, box , name (look pdf for body example)
    output: thing_type_id
*/
const createThingType = async function createThingType(data) {
    const thingtypebody = buildBody(data);
    let response = await fetch(app.TINGG_URL + '/thing-types', {
        method: 'POST',
        body: JSON.stringify(thingtypebody),
        headers: { "Authorization": "Bearer " + access_token, "Content-Type": "application/json" }

    })
    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('401')
        }
        if (response.status === 400) {
            throw new TinggError('Invalid Input at createThingType', { type: 'BadRequestError' })
        }
        else {
            throw new TinggError(`Internal Server or unkown error ${response.status} `, { type: 'InternalServerError' })
        }
    }
    response = await response.json();
    let thing_type_id = response.id;
    return thing_type_id;



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

const createThing = async function createThing(name, thingid) {
    const body = { "name": name, "thing_type_id": thingid }
    let response = await fetch(app.TINGG_URL + '/things', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { "Authorization": "Bearer " + access_token, "Content-Type": "application/json" }
    })
    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('401')
        }
        if (response.status === 400) {
            throw new TinggError('Invalid Input at createThing', { type: 'BadRequestError' })
        }
        throw new Error('Internal Server or unkown error', { type: 'InternalServerError' })

    }
    response = await response.json();
    response = response.id;
    return response;

}

/*
    calls POST https://api.tingg.io/v1/modems/:imsi/link to verify modem and thing id 
    input: imsi and thing_id 
    output:200/400 status code 
*/
const linkModem = async function linkModem(imsi, thing_id) {
    let response = await fetch(app.TINGG_URL + '/modems/' + imsi + '/link', {
        method: 'POST',
        body: JSON.stringify({ thing_id }),
        headers: { "Authorization": "Bearer " + access_token,"Content-Type": "application/json" }
    })
    if (!response.ok) {
        console.log(response)
        if (response.status === 401) {
            throw new Error('401')
        }
        if (response.status === 400) {
            console.log("error????")
            throw new TinggError('Invalid Input at linkModem', { type: 'BadRequestError' })
        }
        if (response.status === 404) {
            throw new TinggError('Modem not found or thing not found', { type: 'NotFoundError' })
        }
        if (response.status === 412) {
            throw new TinggError('Modem is already active', { type: 'PreconditionFailedError' })
        }
        throw new TinggError('Internal Server or unkown error', { type: 'InternalServerError' })

    }
    response = await response.json();
    console.log("link modem response", response)
    return response;


}
// needs new sensors array 
const updateThingType = async function updateThingType(box) {
    const thingtypebody = buildBody(box)
    let response = await fetch(app.TINGG_URL + '/thing-types/' + box.integrations.gsm.thing_type_id, {
        method: 'PATCH',
        body: JSON.stringify(thingtypebody),
        headers: { "Authorization": "Bearer " + access_token, "Content-Type": "application/json" }
    })
    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('401')
        }
        if (response.status === 400) {
            throw new TinggError('Invalid Input at updateThing', { type: 'BadRequestError' })
        }
        throw new TinggError('Internal Server or unkown error', { type: 'InternalServerError' })
    }
    response = await response.json();
    return response;
}



// needs imsi 
const deactivateModem = async function deactivateModem(imsi) {
    let response = await fetch(app.TINGG_URL + '/modems/' + imsi + '/link', {
        method: 'DELETE',
        headers: { "Authorization": "Bearer " + access_token }
    })
    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('401')
        }
        if (response.status === 400) {
            throw new Error('Invalid Input');
        }
        throw new TinggError('Internal Server or unkown error', { type: 'InternalServerError' })
    }
    response = await response.json();
    return response

}

const verifyModem = async function verifyModem(data) {
    let response = await fetch(app.TINGG_URL + '/modems/' + data.imsi + '/verify?code=' + data.secret_code, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + access_token }
    })
    if (!response.ok) {
        if (response.status === 403) {
            throw new TinggError('IMSI and Code do not match', { type: 'ForbiddenError' });
        }
        throw new TinggError('Internal Server or unkown error', { type: 'InternalServerError' })
    }
    response = await response.json();
    return response;
}

const handleAuthError = async function handleAuthError() {
    if (!access_token) {
        access_token = await login({ "email": app.email, "password": app.password })
    }
    else {
        try {
            access_token = await refreshToken();
        } catch (e) {
            access_token = await login({ "email": app.email, "password": app.password })
        }
    }
}


/**Helper function to build the data accordingly from the sensor array
 *  needs name and box id
 * @param {data} box  
 */
const buildBody = function buildBody(data) {
    let resources = []
    if (data.sensors) {
        data.sensors.map((sensor) => {
            let toAdd = {
                "topic": `/osm/${data._id}/${sensor._id}`,
                "method": "pub",
                "type": "object"
            }
            resources.push(toAdd);
        })
    }
    let body = {
        "name": data._id,
        "description": "Some basic description",
        "resources": resources
    }
    return body;
}


module.exports = {
    login,
    refreshToken,
    createThingType,
    createThing,
    linkModem,
    access_token,
    initTingg,
    updateThingType,
    deactivateModem,
    verifyModem
}