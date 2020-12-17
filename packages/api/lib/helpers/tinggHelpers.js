'use strict';
const fetch = require('node-fetch');
const config = require('config');
const app = {
    TINGG_URL: 'https://api.stage01a.tingg.io/v1'
},
TinggError = require('./tinggError');
let access_token;

/**
 * inits tingg registration process 
 * 0. login (name,password)
 * 1. createThingType (name,sensors, )
 * 2. createThing ( name, thingtypeid)
 * 3. linkModem (imsi,thingid)
 */
const initTingg = async function initTingg(box) {
    let thing_id, thing_type_id, link_id;
    // Try 2 times ; if access token is expired and at startup this is required
    for (let index = 0; index < 2; index++) {
        try {
            let verified = await verifyModem({"imsi":box.integrations.gsm.imsi,"secret_code":box.integrations.gsm.secret_code})
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
    let response = await fetch(app.TINGG_URL + '/auth/login', {
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
    let response = await fetch(app.TINGG_URL + '/auth/token-refresh', {
        method: 'POST',
        headers: { "Authorization": "Bearer " + access_token, "Content-Type": "application/json" }
    })
    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Unauthorized Refresh');
        }
        throw new TinggError(response.statusText, { status: response.status })

    }
    response = await response.json();
    return response.token;


}
/*
    calls POST https://api.tingg.io/v1/thing-types to create thing types 
    should be called right after verifyModem()
    input: data:{box}
    output: thing_type_id
*/
const createThingType = async function createThingType(box) {
    const thingtypebody = buildBody(box);
    let response = await fetch(app.TINGG_URL + '/thing-types', {
        method: 'POST',
        body: JSON.stringify(thingtypebody),
        headers: { "Authorization": "Bearer " + access_token, "Content-Type": "application/json" }

    })
    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('401')
        }
        throw new TinggError(response.statusText, { status: response.status })

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

const createThing = async function createThing(boxname, thingid) {
    const body = { "name": boxname, "thing_type_id": thingid }
    let response = await fetch(app.TINGG_URL + '/things', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { "Authorization": "Bearer " + access_token, "Content-Type": "application/json" }
    })
    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('401')
        }
        throw new TinggError(response.statusText, { status: response.status })


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
        throw new TinggError(response.statusText, { status: response.status })

    }
    response = await response.json();
    return response;


}
/**
 * Updates thing types at tingg
 * uses sensors array from changed box to build new thing-types
 * @param {box} box 
 */
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
        throw new TinggError(response.statusText, { status: response.status })
    }
    response = await response.json();
    return response;
}


/**
 * Deactivates modem for the user account the token is specified with
 * Gets imsi as request parameter
 * @param {5378459734895} imsi 
 */
const deactivateModem = async function deactivateModem(imsi) {
    let response = await fetch(app.TINGG_URL + '/modems/' + imsi + '/link', {
        method: 'DELETE',
        headers: { "Authorization": "Bearer " + access_token }
    })
    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('401')
        }
        throw new TinggError(response.statusText, { status: response.status })
    }
    response = await response.json();
    return response

}
/**
 * Verifies Modem before registering thing and thing types
 * @param {"imsi":5384658345,"secret_code":"LHIUYSjhj"} data 
 */
const verifyModem = async function verifyModem(data) {
    let response = await fetch(app.TINGG_URL + '/modems/' + data.imsi + '/own?code=' + data.secret_code, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + access_token }
    })
    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('401')
        }
        throw new TinggError(response.statusText, { status: response.status })
    }
    return true;
}
/**
 * Error handler when Authentifcation at tingg failed
 */
const handleAuthError = async function handleAuthError() {
    if (!access_token) {
        access_token = await login({ "email": config.get('integrations.gsm.email'), "password": config.get('integrations.gsm.password') })
    }
    else {
        try {
            access_token = await refreshToken();
        } catch (e) {
            access_token = await login({ "email": config.get('integrations.gsm.email'), "password": config.get('integrations.gsm.password') })
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