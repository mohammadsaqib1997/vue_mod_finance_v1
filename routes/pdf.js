var express = require('express');
var router = express.Router();
var pdf = require('html-pdf');
var admin = require('firebase-admin');
var func = require('../custom_libs/func');
var moment = require('moment');

var db = admin.database();
var refRegCont = db.ref('/reg_controls');
var refRegSubCont = db.ref('/reg_sub_controls');
var refCont = db.ref('/controls');
var refSubCont = db.ref('/sub_controls');
var refPro = db.ref('/projects');

router.post('/control/render.pdf', function (req, res, next){
    admin.auth().verifyIdToken(req.body.auth).then(function (decodedToken) {
        let data = req.body;
        refCont.child(data.sel_control_start).once('value').then(function (startContSnap) {
            let startContData = startContSnap.val();
            refCont.child(data.sel_control_end).once('value').then(function (endContSnap) {
                let endContData = endContSnap.val();
                let bw = [startContData.id, endContData.id];
                bw.sort();

                refCont.orderByChild('id').startAt(bw[0]).endAt(bw[1]).once('value').then(function (getContsSnap) {
                    let getContsData = getContsSnap.val();
                    let keys = Object.keys(getContsData);
                    let keys_length = keys.length;
                    let process_item = 0;
                    let grabData = {};
                    keys.forEach(function (key) {
                        refRegCont.child(data.sel_project+"/"+key).once('value').then(function (regContSnap) {
                            let regContData = regContSnap.val();
                            if(regContData !== null){
                                let item = getContsData[key];
                                grabData[key] = {id: func.genInvoiceNo(item.id, '00', 3), name:item.name};
                            }

                            process_item++;
                            if(keys_length === process_item){
                                refPro.child(data.sel_project).once('value').then(function (proSnap) {
                                    let proData = proSnap.val();
                                    let todayDate = moment().format('dddd, DD MMMM YYYY');
                                    res.render('pdf_templates/controls_listing', {data: grabData, proName: proData.name, date: todayDate}, function(errJade, html){
                                        pdf.create(html).toStream(function (err, stream) {
                                            stream.pipe(res);
                                        });
                                    });
                                });
                            }
                        });
                    });
                });

            });
        });


    }).catch(function (err) {
        res.json({err: err, status: 'failed'});
    });
});

router.post('/sub_control/render.pdf', function (req, res, next) {
    admin.auth().verifyIdToken(req.body.auth).then(function (decodedToken) {
        let data = req.body;
        let bw = [data.sel_subCont_start, data.sel_subCont_end];
        bw.sort();
        refPro.child(data.sel_project).once('value').then(function (proSnap) {
            let proData = proSnap.val();
            let todayDate = moment().format('dddd, DD MMMM YYYY');
            refRegSubCont.child(data.sel_project).orderByKey().startAt(bw[0]).endAt(bw[1]).once('value').then(function (getRegSCSnap) {
                let getRegSCData = getRegSCSnap.val();
                let keys = Object.keys(getRegSCData);
                let keys_length = keys.length;
                let process_item = 0;
                let grabData = {};
                keys.forEach(function (key) {
                    refSubCont.child(key).once('value').then(function (subContSnap) {
                        let subContData = subContSnap.val();
                        refCont.child(subContData.cont_key).once('value').then(function (contSnap) {
                            let contData = contSnap.val();
                            grabData[contSnap.key] = {};
                            grabData[contSnap.key]['cont_data'] = contData;
                            grabData[contSnap.key][subContSnap.key] = subContData;
                            process_item++;
                            if(keys_length === process_item){
                                res.json({data: grabData});
                                //res.render('pdf_templates/sub_controls_listing', {data: grabData, proName: proData.name, date: todayDate});
                            }
                        });
                    });
                });
            });
        });

        /*refPro.child(data.sel_project).once('value').then(function (proSnap) {
            let proData = proSnap.val();
            let todayDate = moment().format('dddd, DD MMMM YYYY');
            refCont.child(data.sel_control).once('value').then(function (contSnap) {
                let contData = contSnap.val();
                contData['id'] = func.genInvoiceNo(contData.id, '00', 3);

                refSubCont.child(data.sel_subCont_start).once('value').then(function (startSCSnap) {
                    let startSCData = startSCSnap.val();
                    refSubCont.child(data.sel_subCont_end).once('value').then(function (endSCSnap) {
                        let endSCData = endSCSnap.val();
                        let bw = [startSCData.id, endSCData.id];
                        bw.sort();
                        refSubCont.orderByChild('cont_key').equalTo(data.sel_control).once('value').then(function (getSCSnap) {
                            let getSCData = getSCSnap.val();
                            let keys = Object.keys(getSCData);
                            let keys_length = keys.length;
                            let process_item = 0;
                            let grabData = {};
                            keys.forEach(function (key) {
                                refRegSubCont.child(data.sel_project+"/"+key).once('value').then(function (regSCSnap) {
                                    let regSCData = regSCSnap.val();
                                    if(regSCData !== null){
                                        let item = getSCData[key];
                                        grabData[key] = {id: func.genInvoiceNo(item.id, '000', 4), name:item.name};
                                    }

                                    process_item++;
                                    if(keys_length === process_item){
                                        res.render('pdf_templates/sub_controls_listing', {contData: contData, data: grabData, proName: proData.name, date: todayDate}/!*, function(errJade, html){
                                            pdf.create(html).toStream(function (err, stream) {
                                                stream.pipe(res);
                                            });
                                        }*!/);
                                    }
                                });
                            });
                        });
                    });
                });
            });
        });*/

    }).catch(function (err) {
        res.json({err: err, status: 'failed'});
    });
});

module.exports = router;