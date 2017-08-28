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
        let bw = [data.sel_control_start, data.sel_control_end];
        bw.sort();
        refPro.child(data.sel_project).once('value').then(function (proSnap) {
            let proData = proSnap.val();
            let todayDate = moment().format('dddd, DD MMMM YYYY');
            refRegCont.child(data.sel_project).orderByKey().startAt(bw[0]).endAt(bw[1]).once('value').then(function (regContSnap) {
                let regContData = regContSnap.val();
                if(regContData !== null){
                    let ids = Object.keys(regContData);
                    let ids_length = ids.length;
                    let process_item = 0;
                    let grabData = {};
                    ids.forEach(function (id) {
                        let row = regContData[id];
                        refCont.child(row.key).once('value').then(function (contSnap) {
                            grabData[id] = contSnap.val();
                            process_item++;
                            if(ids_length === process_item) {
                                res.render('pdf_templates/controls_listing', {
                                    data: grabData,
                                    proName: proData.name,
                                    date: todayDate
                                }, function (errJade, html) {
                                    pdf.create(html).toStream(function (err, stream) {
                                        stream.pipe(res);
                                    });
                                });
                            }
                        });
                    });
                }else{
                    res.json({err: "No Data Found!", status: false});
                }
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
            refRegSubCont.child(data.sel_project).orderByKey().startAt(bw[0]).endAt(bw[1]).once('value').then(function (regSubContSnap) {
                let regSubContData = regSubContSnap.val();
                if(regSubContData !== null){
                    let ids = Object.keys(regSubContData);
                    let ids_length = ids.length;
                    let process_item = 0;
                    let grabData = {};
                    let contDataObj = {};
                    let subContDataArr = [];
                    ids.forEach(function (id) {
                        let row = regSubContData[id];
                        refSubCont.child(row.key).once('value').then(function (subContSnap) {
                            let subContData = subContSnap.val();
                            subContData['id'] = func.genInvoiceNo(subContData.id, '000', 4);
                            refCont.child(subContData.cont_key).once('value').then(function (contSnap) {
                                let contData = contSnap.val();

                                subContData['cont_id'] = func.genInvoiceNo(contData.id, '00', 3);
                                subContDataArr.push(subContData);

                                contData['id'] = subContData.cont_id;
                                contDataObj[contData.id] = contData;

                                process_item++;
                                if(ids_length === process_item) {
                                    subContDataArr = func.sortObjByVal(subContDataArr, 'id');
                                    grabData = {
                                        cont_data: contDataObj,
                                        sub_cont_data: subContDataArr
                                    };
                                    res.render('pdf_templates/sub_controls_listing', {
                                        data: grabData,
                                        proName: proData.name,
                                        date: todayDate
                                    }, function (errJade, html) {
                                        pdf.create(html).toStream(function (err, stream) {
                                            stream.pipe(res);
                                        });
                                    });
                                }
                            });
                        });
                    });
                }else{
                    res.json({err: "No Data Found!", status: false});
                }
            });
        });
    }).catch(function (err) {
        res.json({err: err, status: 'failed'});
    });
});

module.exports = router;