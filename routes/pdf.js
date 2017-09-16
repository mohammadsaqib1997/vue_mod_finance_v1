var express = require('express');
var router = express.Router();
var pdf = require('html-pdf');
var admin = require('firebase-admin');
var func = require('../custom_libs/func');
var moment = require('moment');

var db = admin.database();
var refRegCont = db.ref('/reg_controls');
var refRegSubCont = db.ref('/reg_sub_controls');
var refRegSubsidiary = db.ref('/reg_subsidiary');
var refCont = db.ref('/controls');
var refSubCont = db.ref('/sub_controls');
var refSubsidiary = db.ref('/subsidiary');
var refPro = db.ref('/projects');
var refVouchersEntries = db.ref('/vouchers_entries');
var refVouchers = db.ref('/vouchers');
var refMasterDetails = db.ref('/master_details');

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

router.post('/subsidiary/render.pdf', function (req, res, next) {
    admin.auth().verifyIdToken(req.body.auth).then(function (decodedToken) {
        let data = req.body;
        let bw = [data.sel_subs_start, data.sel_subs_end];
        bw.sort();
        refPro.child(data.sel_project).once('value').then(function (proSnap) {
            let proData = proSnap.val();
            let todayDate = moment().format('dddd, DD MMMM YYYY');
            refRegSubsidiary.child(data.sel_project).orderByKey().startAt(bw[0]).endAt(bw[1]).once('value').then(function (regSubsSnap) {
                let regSubsData = regSubsSnap.val();
                if(regSubsData !== null){
                    let ids = Object.keys(regSubsData);
                    let ids_length = ids.length;
                    let process_item = 0;
                    let grabData = {};
                    let contDataObj = {};
                    let subContDataObj = {};
                    let subsDataObj = {};
                    ids.forEach(function (id) {
                        let row = regSubsData[id];
                        // get subsidiary
                        refSubsidiary.child(row.key).once('value').then(function (subsSnap) {
                            let subsData = subsSnap.val();
                            // get sub control
                            refSubCont.child(subsData.sub_cont_key).once('value').then(function (subContSnap) {
                                let subContData = subContSnap.val();
                                // get control
                                refCont.child(subContData.cont_key).once('value').then(function (contSnap) {
                                    let contData = contSnap.val();

                                    contData['id'] = func.genInvoiceNo(contData.id, '00', 3);
                                    contDataObj[contData.id] = contData;

                                    subContData['cont_id'] = contData.id;
                                    subContData['id'] = func.genInvoiceNo(subContData.id, '000', 4);
                                    subContDataObj[contData.id+subContData.id] = subContData;

                                    subsData['cont_id'] = contData.id;
                                    subsData['sub_cont_id'] = subContData.id;
                                    subsData['id'] = func.genInvoiceNo(subsData.id, '00', 3);
                                    subsDataObj[contData.id+subContData.id+subsData.id] = subsData;

                                    process_item++;
                                    if(ids_length === process_item) {
                                        grabData = {
                                            cont_data: contDataObj,
                                            sub_cont_data: subContDataObj,
                                            subs_data: subsDataObj
                                        };
                                        res.render('pdf_templates/subsidiary_listing', {
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

router.post('/detailed_ledger/render.pdf', function (req, res, next) {
    admin.auth().verifyIdToken(req.body.auth).then(function (decodedToken) {
        let data = req.body;
        let bwDates = [new Date(data.start_date).getTime(), new Date(data.end_date).getTime()];
        bwDates.sort();
        refPro.child(data.sel_project).once('value').then(function (proSnap) {
            let proData = proSnap.val();
            let todayDate = moment().format('dddd, DD MMMM YYYY');

            refVouchersEntries.orderByChild("code").equalTo(data.sel_subsidiary).once('value', function (voucherEntSnap) {
                let voucherEntData = voucherEntSnap.val();
                if(voucherEntData !== null){
                    let keys = Object.keys(voucherEntData);
                    let process_item = 0;
                    let grabEnt = [];
                    let start_date = moment(data.start_date).format("DD/MM/YYYY");
                    let end_date = moment(data.end_date).format("DD/MM/YYYY");
                    keys.forEach(function (key) {
                        let item = voucherEntData[key];
                        item['date'] = moment(item.v_date).format("DD/MM/YYYY");
                        if(item.type === "jv"){
                            refVouchers.child(item.v_key).once('value', function (voucherSnap) {
                                let voucherData = voucherSnap.val();
                                if(voucherData !== null && voucherData.posted_status === "Yes"){
                                    item['v_id'] = voucherData.id;
                                    grabEnt.push(item);
                                }
                                process_item++;
                                if(process_item === keys.length){
                                    grabEnt = func.sortObjByVal(grabEnt, "v_date");
                                    grabEnt = bwDatesEntries(bwDates, grabEnt);
                                    res.render('pdf_templates/detailed_ledger', {
                                        proName: proData.name,
                                        date: todayDate,
                                        code: (item.code) ? item.code:"",
                                        code_name: (item.code_name) ? item.code_name:"",
                                        data: grabEnt.newEnt,
                                        start_date: start_date,
                                        end_date: end_date,
                                        balance: grabEnt.balance
                                    });
                                }
                            });
                        }else if(item.type === "md"){
                            refMasterDetails.child(item.v_key).once('value', function (mdSnap) {
                                let mdData = mdSnap.val();
                                item['v_id'] = mdData.id;
                                grabEnt.push(item);
                                process_item++;
                                if(process_item === keys.length){
                                    grabEnt = func.sortObjByVal(grabEnt, "v_date");
                                    grabEnt = bwDatesEntries(bwDates, grabEnt);
                                    res.render('pdf_templates/detailed_ledger', {
                                        proName: proData.name,
                                        date: todayDate,
                                        code: (item.code) ? item.code:"",
                                        code_name: (item.code_name) ? item.code_name:"",
                                        data: grabEnt.newEnt,
                                        start_date: start_date,
                                        end_date: end_date,
                                        balance: grabEnt.balance
                                    });
                                }
                            });
                        }
                    });
                }else{
                    res.json({project: proData.name, data: {}});
                }
            });
        });
    }).catch(function (err) {
        res.json({err: err, status: 'failed'});
    });
});

module.exports = router;

function bwDatesEntries(bwDates, objEnt){
    let newGrabEnt = [];
    let balCr = 0;
    let balDr = 0;
    objEnt.forEach(function (row) {
        let sel_row = null;
        if(row.v_date < bwDates[0]){
            balCr += row.credit;
            balDr += row.debit;
        }
        if(row.v_date >= bwDates[0] && row.v_date <= bwDates[1]){
            sel_row = row;
        }
        if(sel_row !== null){
            newGrabEnt.push(sel_row);
        }
    });
    return { newEnt: newGrabEnt, balance: {balCr: balCr, balDr: balDr} };
}