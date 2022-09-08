const express = require('express');
const fetch = require('node-fetch');
const { Headers } = fetch
const app = express();
var user = 'maintenance';
var password = 'raid-maintenance';
app.use(express.json());
const api_url = 'https://10.80.230.20:23451/ConfigurationManager/v1/objects/storages';

// aded to avoid SSL certificate error while calling validate function, should not use in production.
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

app.use(express.urlencoded())


// for checking on browser
app.get('/hitachi/firmware', (req, res) => {
    res.sendFile(__dirname + '/public/index.html')
    console.log("This is get response ")
    // res.json('This is get response from Hitachi Firmware')
})

app.post('/hitachi/firmware', async (req, res) => {
    const authorization = req.headers.authorization?req.headers.authorization:'Basic '+ Buffer.from(user + ':' + password).toString('base64');
    if (!req.body.serial) {
        return res.json({ res: 'Request must have body' })
    }
    try {
        const serial = parseInt(req.body.serial);
        const deviceId = await getDeviceId(serial);
        if(!deviceId) return res.json({msg:`Device with serial number ${serial} not found`});
        const versionCode = await getVersionCode (deviceId, authorization);
        res.json({"version": versionCode})
    }
    catch (err) {
        res.json({"Error ": err})
    }
})

app.listen(3000, (err) => {
    if (err) console.log("Something wrong")
    console.log('Server is runnig on 3000 port')
})


async function getDeviceId(serial) {
    try{
        const allDevice_response = await fetch(api_url);
        if(!allDevice_response.ok){
            return ({"Error status": allDevice_response.status == 500 ? "Failed to communicate with target Host" : allDevice_response.status})
        }
        const json_response = await allDevice_response.json();
        const filter_device_complete_info = await json_response.data.filter((ele)=>{
         return ele.serialNumber == serial ? ele.storageDeviceId : null
        })
        return deivec_Id = filter_device_complete_info.length > 0 ? filter_device_complete_info[0].storageDeviceId:null
    }catch(err){
        return err;
    }
}
 async function getVersionCode(deviceId, auth){
    try{ 
        const deviceInfo = await fetch(api_url + "/"+deviceId, {
            method: 'GET', headers: new Headers({
                "Authorization": auth
            })
        })  
        if(!deviceInfo.ok){
            return ({"Error Status":deviceInfo.status == 404 ? "Specdifed storage system was not found": deviceInfo.status == 500? "Failed to communicate with target Host": deviceInfo.status});
        }
        const json_response = await deviceInfo.json();
        const version = await json_response.dkcMicroVersion;
        return value = version?version:`Version code for device with DeviceId ${deviceId} not Found`
    }catch(err){console.log("what is err", err);return err}
 }
