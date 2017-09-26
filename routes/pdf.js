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
var refBrokers = db.ref('/brokers');
var refProjectTypeItems = db.ref('/project_type_items');
var refProjectTypes = db.ref('/project_types');

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
                                }/*, function (errJade, html) {
                                    pdf.create(html).toStream(function (err, stream) {
                                        stream.pipe(res);
                                    });
                                }*/);
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
                                    }/*, function (errJade, html) {
                                        pdf.create(html).toStream(function (err, stream) {
                                            stream.pipe(res);
                                        });
                                    }*/);
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
                                        }/*, function (errJade, html) {
                                            pdf.create(html).toStream(function (err, stream) {
                                                stream.pipe(res);
                                            });
                                        }*/);
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
                                if(mdData !== null && mdData.posted_status === "Yes"){
                                    item['v_id'] =  mdData.id;
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
                        }
                    });
                }else{
                    res.json({status: "failed", message: "No data found!"});
                }
            });
        });
    }).catch(function (err) {
        res.json({err: err, status: 'failed'});
    });
});

router.post('/balance_sheet/controls/view', function (req, res, next) {
    admin.auth().verifyIdToken(req.body.auth).then(function (decodedToken) {
        let data = req.body;
        let bwDates = [new Date(data.start_date).getTime(), new Date(data.end_date).getTime()];
        bwDates.sort();
        refPro.child(data.sel_project).once('value').then(function (proSnap) {
            let proData = proSnap.val();
            let todayDate = moment().format('dddd, DD MMMM YYYY');
            let start_date = moment(data.start_date).format("DD/MM/YYYY");
            let end_date = moment(data.end_date).format("DD/MM/YYYY");

            refRegCont.child(data.sel_project).once('value', function (regContSnap) {
                let regContData = regContSnap.val();
                if(regContData !== null){
                    let keys = Object.keys(regContData);
                    let grabData = {};
                    keys.forEach(function (key, loopInd1, array1) {
                        let item = regContData[key];
                        refCont.child(item.key).once('value', function (contSnap) {
                            item['contData'] = contSnap.val();

                            refRegSubCont.child(data.sel_project).orderByChild("cont_key").equalTo(item.key).once('value', function (regSubContSnap) {
                                let regSubContData = regSubContSnap.val();
                                if(regSubContData !== null){
                                    item['contData']['regSubContData'] = {};
                                    item['contData']['regSubContData'] = regSubContData;
                                    let regSubContKeys = Object.keys(regSubContData);
                                    regSubContKeys.forEach(function (rscKey, loopInd2, array2) {
                                        let rscItem = regSubContData[rscKey];

                                        refSubCont.child(rscItem.key).once('value', function (subContSnap) {
                                            let subContData = subContSnap.val();
                                            item['contData']['regSubContData'][rscKey]['subContData'] = {};
                                            item['contData']['regSubContData'][rscKey]['subContData'] = subContData;

                                            refRegSubsidiary.child(data.sel_project).orderByChild("sub_cont_key").equalTo(rscItem.key).once('value', function (regSubsSnap) {
                                                let regSubsData = regSubsSnap.val();

                                                if(regSubsData !== null){
                                                    item['contData']['regSubContData'][rscKey]['subContData']['regSubsData'] = {};
                                                    item['contData']['regSubContData'][rscKey]['subContData']['regSubsData'] = regSubsData;
                                                    let regSubsKeys = Object.keys(regSubsData);
                                                    regSubsKeys.forEach(function (rssKey, loopInd3, array3) {
                                                        let rssItem = regSubsData[rssKey];

                                                        refSubsidiary.child(rssItem.key).once('value', function(subsSnap){
                                                            let subsData = subsSnap.val();
                                                            item['contData']['regSubContData'][rscKey]['subContData']['regSubsData'][rssKey]['subsData'] = {};
                                                            item['contData']['regSubContData'][rscKey]['subContData']['regSubsData'][rssKey]['subsData'] = subsData;

                                                            refVouchersEntries.orderByChild('code').equalTo(rssKey).once('value', function (voucherEntSnap) {
                                                                let voucherEntData = voucherEntSnap.val();

                                                                if(voucherEntData !== null){
                                                                    let voucherEntKeys = Object.keys(voucherEntData);
                                                                    let grabEnt = {};
                                                                    let process_ent = 0;
                                                                    voucherEntKeys.forEach(function (vEntKey, loopInd4, array4) {
                                                                        let vEntItem = voucherEntData[vEntKey];
                                                                        if(vEntItem.type === "md"){
                                                                            refMasterDetails.child(vEntItem.v_key).once('value', function (mdSnap) {
                                                                                let mdData = mdSnap.val();
                                                                                if(mdData.posted_status === "Yes"){
                                                                                    grabEnt[vEntKey] = vEntItem;
                                                                                }
                                                                                process_ent++;
                                                                                if(process_ent === array4.length){
                                                                                    if(Object.keys(grabEnt).length > 0){
                                                                                        item['contData']['regSubContData'][rscKey]['subContData']['regSubsData'][rssKey]['subsData']['entries_data'] = bwDatesEntObj(bwDates, grabEnt);
                                                                                    }
                                                                                    if(loopInd3 === array3.length-1){
                                                                                        if(loopInd2 === array2.length-1){
                                                                                            grabData[key] = item;
                                                                                            if(loopInd1 === array1.length-1){
                                                                                                res.render('pdf_templates/bs_controls_listing', {
                                                                                                    proName: proData.name,
                                                                                                    date: todayDate,
                                                                                                    data: grabData,
                                                                                                    start_date: start_date,
                                                                                                    end_date: end_date,
                                                                                                });
                                                                                                //res.json(grabData);
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            });
                                                                        }else{
                                                                            refVouchers.child(vEntItem.v_key).once('value', function (voucherSnap) {
                                                                                let voucherData = voucherSnap.val();
                                                                                if(voucherData.posted_status === "Yes"){
                                                                                    grabEnt[vEntKey] = vEntItem;
                                                                                }
                                                                                process_ent++;
                                                                                if(process_ent === array4.length){
                                                                                    if(Object.keys(grabEnt).length > 0){
                                                                                        item['contData']['regSubContData'][rscKey]['subContData']['regSubsData'][rssKey]['subsData']['entries_data'] = bwDatesEntObj(bwDates, grabEnt);
                                                                                    }
                                                                                    if(loopInd3 === array3.length-1){
                                                                                        if(loopInd2 === array2.length-1){
                                                                                            grabData[key] = item;
                                                                                            if(loopInd1 === array1.length-1){
                                                                                                res.render('pdf_templates/bs_controls_listing', {
                                                                                                    proName: proData.name,
                                                                                                    date: todayDate,
                                                                                                    data: grabData,
                                                                                                    start_date: start_date,
                                                                                                    end_date: end_date,
                                                                                                });
                                                                                                //res.json(grabData);
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            });
                                                                        }
                                                                    });
                                                                }else{
                                                                    if(loopInd3 === array3.length-1){
                                                                        if(loopInd2 === array2.length-1){
                                                                            grabData[key] = item;
                                                                            if(loopInd1 === array1.length-1){
                                                                                res.render('pdf_templates/bs_controls_listing', {
                                                                                    proName: proData.name,
                                                                                    date: todayDate,
                                                                                    data: grabData,
                                                                                    start_date: start_date,
                                                                                    end_date: end_date,
                                                                                });
                                                                                //res.json(grabData);
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            });
                                                        });
                                                    });
                                                }else{
                                                    if(loopInd2 === array2.length-1){
                                                        grabData[key] = item;
                                                        if(loopInd1 === array1.length-1){
                                                            res.render('pdf_templates/bs_controls_listing', {
                                                                proName: proData.name,
                                                                date: todayDate,
                                                                data: grabData,
                                                                start_date: start_date,
                                                                end_date: end_date,
                                                            });
                                                            // res.json(grabData);
                                                        }
                                                    }
                                                }
                                            });
                                        });
                                    });
                                }else{
                                    grabData[key] = item;
                                    if(loopInd1 === array1.length-1){
                                        res.render('pdf_templates/bs_controls_listing', {
                                            proName: proData.name,
                                            date: todayDate,
                                            data: grabData,
                                            start_date: start_date,
                                            end_date: end_date,
                                        });
                                        // res.json(grabData);
                                    }
                                }
                            });
                        });
                    });
                }else {
                    res.json({status: 'failed', message: "No Data Found!"});
                }
            });
        });
    }).catch(function (err) {
        res.json({err: err, status: 'failed'});
    });
});

router.post('/balance_sheet/sub_controls/view', function (req, res, next) {
    admin.auth().verifyIdToken(req.body.auth).then(function (decodedToken) {
        let data = req.body;
        let bwDates = [new Date(data.start_date).getTime(), new Date(data.end_date).getTime()];
        bwDates.sort();
        refPro.child(data.sel_project).once('value').then(function (proSnap) {
            let proData = proSnap.val();
            let todayDate = moment().format('dddd, DD MMMM YYYY');
            let start_date = moment(data.start_date).format("DD/MM/YYYY");
            let end_date = moment(data.end_date).format("DD/MM/YYYY");

            refRegCont.child(data.sel_project).once('value', function (regContSnap) {
                let regContData = regContSnap.val();
                if(regContData !== null){
                    let keys = Object.keys(regContData);
                    let grabData = {};
                    keys.forEach(function (key, loopInd1, array1) {
                        let item = regContData[key];
                        refCont.child(item.key).once('value', function (contSnap) {
                            item['contData'] = contSnap.val();

                            refRegSubCont.child(data.sel_project).orderByChild("cont_key").equalTo(item.key).once('value', function (regSubContSnap) {
                                let regSubContData = regSubContSnap.val();
                                if(regSubContData !== null){
                                    item['contData']['regSubContData'] = {};
                                    item['contData']['regSubContData'] = regSubContData;
                                    let regSubContKeys = Object.keys(regSubContData);
                                    regSubContKeys.forEach(function (rscKey, loopInd2, array2) {
                                        let rscItem = regSubContData[rscKey];

                                        refSubCont.child(rscItem.key).once('value', function (subContSnap) {
                                            let subContData = subContSnap.val();
                                            item['contData']['regSubContData'][rscKey]['subContData'] = {};
                                            item['contData']['regSubContData'][rscKey]['subContData'] = subContData;

                                            refRegSubsidiary.child(data.sel_project).orderByChild("sub_cont_key").equalTo(rscItem.key).once('value', function (regSubsSnap) {
                                                let regSubsData = regSubsSnap.val();

                                                if(regSubsData !== null){
                                                    item['contData']['regSubContData'][rscKey]['subContData']['regSubsData'] = {};
                                                    item['contData']['regSubContData'][rscKey]['subContData']['regSubsData'] = regSubsData;
                                                    let regSubsKeys = Object.keys(regSubsData);
                                                    regSubsKeys.forEach(function (rssKey, loopInd3, array3) {
                                                        let rssItem = regSubsData[rssKey];

                                                        refSubsidiary.child(rssItem.key).once('value', function(subsSnap){
                                                            let subsData = subsSnap.val();
                                                            item['contData']['regSubContData'][rscKey]['subContData']['regSubsData'][rssKey]['subsData'] = {};
                                                            item['contData']['regSubContData'][rscKey]['subContData']['regSubsData'][rssKey]['subsData'] = subsData;

                                                            refVouchersEntries.orderByChild('code').equalTo(rssKey).once('value', function (voucherEntSnap) {
                                                                let voucherEntData = voucherEntSnap.val();

                                                                if(voucherEntData !== null){
                                                                    let voucherEntKeys = Object.keys(voucherEntData);
                                                                    let grabEnt = {};
                                                                    let process_ent = 0;
                                                                    voucherEntKeys.forEach(function (vEntKey, loopInd4, array4) {
                                                                        let vEntItem = voucherEntData[vEntKey];
                                                                        if(vEntItem.type === "md"){
                                                                            refMasterDetails.child(vEntItem.v_key).once('value', function (mdSnap) {
                                                                                let mdData = mdSnap.val();
                                                                                if(mdData.posted_status === "Yes"){
                                                                                    grabEnt[vEntKey] = vEntItem;
                                                                                }
                                                                                process_ent++;
                                                                                if(process_ent === array4.length){
                                                                                    if(Object.keys(grabEnt).length > 0){
                                                                                        item['contData']['regSubContData'][rscKey]['subContData']['regSubsData'][rssKey]['subsData']['entries_data'] = bwDatesEntObj(bwDates, grabEnt);
                                                                                    }
                                                                                    if(loopInd3 === array3.length-1){
                                                                                        if(loopInd2 === array2.length-1){
                                                                                            grabData[key] = item;
                                                                                            if(loopInd1 === array1.length-1){
                                                                                                res.render('pdf_templates/bs_sub_controls_listing', {
                                                                                                    proName: proData.name,
                                                                                                    date: todayDate,
                                                                                                    data: grabData,
                                                                                                    start_date: start_date,
                                                                                                    end_date: end_date,
                                                                                                });
                                                                                                //res.json(grabData);
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            });
                                                                        }else{
                                                                            refVouchers.child(vEntItem.v_key).once('value', function (voucherSnap) {
                                                                                let voucherData = voucherSnap.val();
                                                                                if(voucherData.posted_status === "Yes"){
                                                                                    grabEnt[vEntKey] = vEntItem;
                                                                                }
                                                                                process_ent++;
                                                                                if(process_ent === array4.length){
                                                                                    if(Object.keys(grabEnt).length > 0){
                                                                                        item['contData']['regSubContData'][rscKey]['subContData']['regSubsData'][rssKey]['subsData']['entries_data'] = bwDatesEntObj(bwDates, grabEnt);
                                                                                    }
                                                                                    if(loopInd3 === array3.length-1){
                                                                                        if(loopInd2 === array2.length-1){
                                                                                            grabData[key] = item;
                                                                                            if(loopInd1 === array1.length-1){
                                                                                                res.render('pdf_templates/bs_sub_controls_listing', {
                                                                                                    proName: proData.name,
                                                                                                    date: todayDate,
                                                                                                    data: grabData,
                                                                                                    start_date: start_date,
                                                                                                    end_date: end_date,
                                                                                                });
                                                                                                //res.json(grabData);
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            });
                                                                        }
                                                                    });
                                                                }else{
                                                                    if(loopInd3 === array3.length-1){
                                                                        if(loopInd2 === array2.length-1){
                                                                            grabData[key] = item;
                                                                            if(loopInd1 === array1.length-1){
                                                                                res.render('pdf_templates/bs_sub_controls_listing', {
                                                                                    proName: proData.name,
                                                                                    date: todayDate,
                                                                                    data: grabData,
                                                                                    start_date: start_date,
                                                                                    end_date: end_date,
                                                                                });
                                                                                //res.json(grabData);
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            });
                                                        });
                                                    });
                                                }else{
                                                    if(loopInd2 === array2.length-1){
                                                        grabData[key] = item;
                                                        if(loopInd1 === array1.length-1){
                                                            res.render('pdf_templates/bs_sub_controls_listing', {
                                                                proName: proData.name,
                                                                date: todayDate,
                                                                data: grabData,
                                                                start_date: start_date,
                                                                end_date: end_date,
                                                            });
                                                            //res.json(grabData);
                                                        }
                                                    }
                                                }
                                            });
                                        });
                                    });
                                }else{
                                    grabData[key] = item;
                                    if(loopInd1 === array1.length-1){
                                        res.render('pdf_templates/bs_sub_controls_listing', {
                                            proName: proData.name,
                                            date: todayDate,
                                            data: grabData,
                                            start_date: start_date,
                                            end_date: end_date,
                                        });
                                        //res.json(grabData);
                                    }
                                }
                            });
                        });
                    });
                }else {
                    res.json({status: 'failed', message: "No Data Found!"});
                }
            });
        });
    }).catch(function (err) {
        res.json({err: err, status: 'failed'});
    });
});

router.post('/balance_sheet/subsidiary/view', function (req, res, next) {
    admin.auth().verifyIdToken(req.body.auth).then(function (decodedToken) {
        let data = req.body;
        let bwDates = [new Date(data.start_date).getTime(), new Date(data.end_date).getTime()];
        bwDates.sort();
        refPro.child(data.sel_project).once('value').then(function (proSnap) {
            let proData = proSnap.val();
            let todayDate = moment().format('dddd, DD MMMM YYYY');
            let start_date = moment(data.start_date).format("DD/MM/YYYY");
            let end_date = moment(data.end_date).format("DD/MM/YYYY");

            refRegCont.child(data.sel_project).once('value', function (regContSnap) {
                let regContData = regContSnap.val();
                if(regContData !== null){
                    let keys = Object.keys(regContData);
                    let grabData = {};
                    keys.forEach(function (key, loopInd1, array1) {
                        let item = regContData[key];
                        refCont.child(item.key).once('value', function (contSnap) {
                            item['contData'] = contSnap.val();

                            refRegSubCont.child(data.sel_project).orderByChild("cont_key").equalTo(item.key).once('value', function (regSubContSnap) {
                                let regSubContData = regSubContSnap.val();
                                if(regSubContData !== null){
                                    item['contData']['regSubContData'] = {};
                                    item['contData']['regSubContData'] = regSubContData;
                                    let regSubContKeys = Object.keys(regSubContData);
                                    regSubContKeys.forEach(function (rscKey, loopInd2, array2) {
                                        let rscItem = regSubContData[rscKey];

                                        refSubCont.child(rscItem.key).once('value', function (subContSnap) {
                                            let subContData = subContSnap.val();
                                            item['contData']['regSubContData'][rscKey]['subContData'] = {};
                                            item['contData']['regSubContData'][rscKey]['subContData'] = subContData;

                                            refRegSubsidiary.child(data.sel_project).orderByChild("sub_cont_key").equalTo(rscItem.key).once('value', function (regSubsSnap) {
                                                let regSubsData = regSubsSnap.val();

                                                if(regSubsData !== null){
                                                    item['contData']['regSubContData'][rscKey]['subContData']['regSubsData'] = {};
                                                    item['contData']['regSubContData'][rscKey]['subContData']['regSubsData'] = regSubsData;
                                                    let regSubsKeys = Object.keys(regSubsData);
                                                    regSubsKeys.forEach(function (rssKey, loopInd3, array3) {
                                                        let rssItem = regSubsData[rssKey];

                                                        refSubsidiary.child(rssItem.key).once('value', function(subsSnap){
                                                            let subsData = subsSnap.val();
                                                            item['contData']['regSubContData'][rscKey]['subContData']['regSubsData'][rssKey]['subsData'] = {};
                                                            item['contData']['regSubContData'][rscKey]['subContData']['regSubsData'][rssKey]['subsData'] = subsData;

                                                            refVouchersEntries.orderByChild('code').equalTo(rssKey).once('value', function (voucherEntSnap) {
                                                                let voucherEntData = voucherEntSnap.val();

                                                                if(voucherEntData !== null){
                                                                    let voucherEntKeys = Object.keys(voucherEntData);
                                                                    let grabEnt = {};
                                                                    let process_ent = 0;
                                                                    voucherEntKeys.forEach(function (vEntKey, loopInd4, array4) {
                                                                        let vEntItem = voucherEntData[vEntKey];
                                                                        if(vEntItem.type === "md"){
                                                                            refMasterDetails.child(vEntItem.v_key).once('value', function (mdSnap) {
                                                                                let mdData = mdSnap.val();
                                                                                if(mdData.posted_status === "Yes"){
                                                                                    grabEnt[vEntKey] = vEntItem;
                                                                                }
                                                                                process_ent++;
                                                                                if(process_ent === array4.length){
                                                                                    if(Object.keys(grabEnt).length > 0){
                                                                                        item['contData']['regSubContData'][rscKey]['subContData']['regSubsData'][rssKey]['subsData']['entries_data'] = bwDatesEntObj(bwDates, grabEnt);
                                                                                    }
                                                                                    if(loopInd3 === array3.length-1){
                                                                                        if(loopInd2 === array2.length-1){
                                                                                            grabData[key] = item;
                                                                                            if(loopInd1 === array1.length-1){
                                                                                                res.render('pdf_templates/bs_subsidiary_listing', {
                                                                                                    proName: proData.name,
                                                                                                    date: todayDate,
                                                                                                    data: grabData,
                                                                                                    start_date: start_date,
                                                                                                    end_date: end_date,
                                                                                                });
                                                                                                //res.json(grabData);
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            });
                                                                        }else{
                                                                            refVouchers.child(vEntItem.v_key).once('value', function (voucherSnap) {
                                                                                let voucherData = voucherSnap.val();
                                                                                if(voucherData.posted_status === "Yes"){
                                                                                    grabEnt[vEntKey] = vEntItem;
                                                                                }
                                                                                process_ent++;
                                                                                if(process_ent === array4.length){
                                                                                    if(Object.keys(grabEnt).length > 0){
                                                                                        item['contData']['regSubContData'][rscKey]['subContData']['regSubsData'][rssKey]['subsData']['entries_data'] = bwDatesEntObj(bwDates, grabEnt);
                                                                                    }
                                                                                    if(loopInd3 === array3.length-1){
                                                                                        if(loopInd2 === array2.length-1){
                                                                                            grabData[key] = item;
                                                                                            if(loopInd1 === array1.length-1){
                                                                                                res.render('pdf_templates/bs_subsidiary_listing', {
                                                                                                    proName: proData.name,
                                                                                                    date: todayDate,
                                                                                                    data: grabData,
                                                                                                    start_date: start_date,
                                                                                                    end_date: end_date,
                                                                                                });
                                                                                                //res.json(grabData);
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            });
                                                                        }
                                                                    });
                                                                }else{
                                                                    if(loopInd3 === array3.length-1){
                                                                        if(loopInd2 === array2.length-1){
                                                                            grabData[key] = item;
                                                                            if(loopInd1 === array1.length-1){
                                                                                res.render('pdf_templates/bs_subsidiary_listing', {
                                                                                    proName: proData.name,
                                                                                    date: todayDate,
                                                                                    data: grabData,
                                                                                    start_date: start_date,
                                                                                    end_date: end_date,
                                                                                });
                                                                                //res.json(grabData);
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            });
                                                        });
                                                    });
                                                }else{
                                                    if(loopInd2 === array2.length-1){
                                                        grabData[key] = item;
                                                        if(loopInd1 === array1.length-1){
                                                            res.render('pdf_templates/bs_subsidiary_listing', {
                                                                proName: proData.name,
                                                                date: todayDate,
                                                                data: grabData,
                                                                start_date: start_date,
                                                                end_date: end_date,
                                                            });
                                                            //res.json(grabData);
                                                        }
                                                    }
                                                }
                                            });
                                        });
                                    });
                                }else{
                                    grabData[key] = item;
                                    if(loopInd1 === array1.length-1){
                                        res.render('pdf_templates/bs_subsidiary_listing', {
                                            proName: proData.name,
                                            date: todayDate,
                                            data: grabData,
                                            start_date: start_date,
                                            end_date: end_date,
                                        });
                                        //res.json(grabData);
                                    }
                                }
                            });
                        });
                    });
                }else {
                    res.json({status: 'failed', message: "No Data Found!"});
                }
            });
        });
    }).catch(function (err) {
        res.json({err: err, status: 'failed'});
    });
});

router.post('/trial_balance/subsidiary/view', function (req, res, next) {
    admin.auth().verifyIdToken(req.body.auth).then(function (decodedToken) {
        let data = req.body;
        let bwDates = [new Date(data.start_date).getTime(), new Date(data.end_date).getTime()];
        bwDates.sort();
        refPro.child(data.sel_project).once('value').then(function (proSnap) {
            let proData = proSnap.val();
            let todayDate = moment().format('dddd, DD MMMM YYYY');
            let start_date = moment(data.start_date).format("DD/MM/YYYY");
            let end_date = moment(data.end_date).format("DD/MM/YYYY");

            refRegCont.child(data.sel_project).once('value', function (regContSnap) {
                let regContData = regContSnap.val();
                if(regContData !== null){
                    let keys = Object.keys(regContData);
                    let grabData = {};
                    keys.forEach(function (key, loopInd1, array1) {
                        let item = regContData[key];
                        refCont.child(item.key).once('value', function (contSnap) {
                            item['contData'] = contSnap.val();

                            refRegSubCont.child(data.sel_project).orderByChild("cont_key").equalTo(item.key).once('value', function (regSubContSnap) {
                                let regSubContData = regSubContSnap.val();
                                if(regSubContData !== null){
                                    item['contData']['regSubContData'] = {};
                                    item['contData']['regSubContData'] = regSubContData;
                                    let regSubContKeys = Object.keys(regSubContData);
                                    regSubContKeys.forEach(function (rscKey, loopInd2, array2) {
                                        let rscItem = regSubContData[rscKey];

                                        refSubCont.child(rscItem.key).once('value', function (subContSnap) {
                                            let subContData = subContSnap.val();
                                            item['contData']['regSubContData'][rscKey]['subContData'] = {};
                                            item['contData']['regSubContData'][rscKey]['subContData'] = subContData;

                                            refRegSubsidiary.child(data.sel_project).orderByChild("sub_cont_key").equalTo(rscItem.key).once('value', function (regSubsSnap) {
                                                let regSubsData = regSubsSnap.val();

                                                if(regSubsData !== null){
                                                    item['contData']['regSubContData'][rscKey]['subContData']['regSubsData'] = {};
                                                    item['contData']['regSubContData'][rscKey]['subContData']['regSubsData'] = regSubsData;
                                                    let regSubsKeys = Object.keys(regSubsData);
                                                    regSubsKeys.forEach(function (rssKey, loopInd3, array3) {
                                                        let rssItem = regSubsData[rssKey];

                                                        refSubsidiary.child(rssItem.key).once('value', function(subsSnap){
                                                            let subsData = subsSnap.val();
                                                            item['contData']['regSubContData'][rscKey]['subContData']['regSubsData'][rssKey]['subsData'] = {};
                                                            item['contData']['regSubContData'][rscKey]['subContData']['regSubsData'][rssKey]['subsData'] = subsData;

                                                            refVouchersEntries.orderByChild('code').equalTo(rssKey).once('value', function (voucherEntSnap) {
                                                                let voucherEntData = voucherEntSnap.val();

                                                                if(voucherEntData !== null){
                                                                    let voucherEntKeys = Object.keys(voucherEntData);
                                                                    let grabEnt = {};
                                                                    let process_ent = 0;
                                                                    voucherEntKeys.forEach(function (vEntKey, loopInd4, array4) {
                                                                        let vEntItem = voucherEntData[vEntKey];
                                                                        if(vEntItem.type === "md"){
                                                                            refMasterDetails.child(vEntItem.v_key).once('value', function (mdSnap) {
                                                                                let mdData = mdSnap.val();
                                                                                if(mdData.posted_status === "Yes"){
                                                                                    grabEnt[vEntKey] = vEntItem;
                                                                                }
                                                                                process_ent++;
                                                                                if(process_ent === array4.length){
                                                                                    if(Object.keys(grabEnt).length > 0){
                                                                                        item['contData']['regSubContData'][rscKey]['subContData']['regSubsData'][rssKey]['subsData']['entries_data'] = bwDatesEntObj(bwDates, grabEnt);
                                                                                    }
                                                                                    if(loopInd3 === array3.length-1){
                                                                                        if(loopInd2 === array2.length-1){
                                                                                            grabData[key] = item;
                                                                                            if(loopInd1 === array1.length-1){
                                                                                                res.render('pdf_templates/trial_bs_subsidiary_listing', {
                                                                                                    proName: proData.name,
                                                                                                    date: todayDate,
                                                                                                    data: grabData,
                                                                                                    start_date: start_date,
                                                                                                    end_date: end_date,
                                                                                                });
                                                                                                //res.json(grabData);
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            });
                                                                        }else{
                                                                            refVouchers.child(vEntItem.v_key).once('value', function (voucherSnap) {
                                                                                let voucherData = voucherSnap.val();
                                                                                if(voucherData.posted_status === "Yes"){
                                                                                    grabEnt[vEntKey] = vEntItem;
                                                                                }
                                                                                process_ent++;
                                                                                if(process_ent === array4.length){
                                                                                    if(Object.keys(grabEnt).length > 0){
                                                                                        item['contData']['regSubContData'][rscKey]['subContData']['regSubsData'][rssKey]['subsData']['entries_data'] = bwDatesEntObj(bwDates, grabEnt);
                                                                                    }
                                                                                    if(loopInd3 === array3.length-1){
                                                                                        if(loopInd2 === array2.length-1){
                                                                                            grabData[key] = item;
                                                                                            if(loopInd1 === array1.length-1){
                                                                                                res.render('pdf_templates/trial_bs_subsidiary_listing', {
                                                                                                    proName: proData.name,
                                                                                                    date: todayDate,
                                                                                                    data: grabData,
                                                                                                    start_date: start_date,
                                                                                                    end_date: end_date,
                                                                                                });
                                                                                                //res.json(grabData);
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            });
                                                                        }
                                                                    });
                                                                }else{
                                                                    if(loopInd3 === array3.length-1){
                                                                        if(loopInd2 === array2.length-1){
                                                                            grabData[key] = item;
                                                                            if(loopInd1 === array1.length-1){
                                                                                res.render('pdf_templates/trial_bs_subsidiary_listing', {
                                                                                    proName: proData.name,
                                                                                    date: todayDate,
                                                                                    data: grabData,
                                                                                    start_date: start_date,
                                                                                    end_date: end_date,
                                                                                });
                                                                                //res.json(grabData);
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            });
                                                        });
                                                    });
                                                }else{
                                                    if(loopInd2 === array2.length-1){
                                                        grabData[key] = item;
                                                        if(loopInd1 === array1.length-1){
                                                            res.render('pdf_templates/trial_bs_subsidiary_listing', {
                                                                proName: proData.name,
                                                                date: todayDate,
                                                                data: grabData,
                                                                start_date: start_date,
                                                                end_date: end_date,
                                                            });
                                                            //res.json(grabData);
                                                        }
                                                    }
                                                }
                                            });
                                        });
                                    });
                                }else{
                                    grabData[key] = item;
                                    if(loopInd1 === array1.length-1){
                                        res.render('pdf_templates/trial_bs_subsidiary_listing', {
                                            proName: proData.name,
                                            date: todayDate,
                                            data: grabData,
                                            start_date: start_date,
                                            end_date: end_date,
                                        });
                                        //res.json(grabData);
                                    }
                                }
                            });
                        });
                    });
                }else {
                    res.json({status: 'failed', message: "No Data Found!"});
                }
            });
        });
    }).catch(function (err) {
        res.json({err: err, status: 'failed'});
    });
});

router.post('/trial_balance/sub_controls/view', function (req, res, next) {
    admin.auth().verifyIdToken(req.body.auth).then(function (decodedToken) {
        let data = req.body;
        let bwDates = [new Date(data.start_date).getTime(), new Date(data.end_date).getTime()];
        bwDates.sort();
        refPro.child(data.sel_project).once('value').then(function (proSnap) {
            let proData = proSnap.val();
            let todayDate = moment().format('dddd, DD MMMM YYYY');
            let start_date = moment(data.start_date).format("DD/MM/YYYY");
            let end_date = moment(data.end_date).format("DD/MM/YYYY");

            refRegCont.child(data.sel_project).once('value', function (regContSnap) {
                let regContData = regContSnap.val();
                if(regContData !== null){
                    let keys = Object.keys(regContData);
                    let grabData = {};
                    keys.forEach(function (key, loopInd1, array1) {
                        let item = regContData[key];
                        refCont.child(item.key).once('value', function (contSnap) {
                            item['contData'] = contSnap.val();

                            refRegSubCont.child(data.sel_project).orderByChild("cont_key").equalTo(item.key).once('value', function (regSubContSnap) {
                                let regSubContData = regSubContSnap.val();
                                if(regSubContData !== null){
                                    item['contData']['regSubContData'] = {};
                                    item['contData']['regSubContData'] = regSubContData;
                                    let regSubContKeys = Object.keys(regSubContData);
                                    regSubContKeys.forEach(function (rscKey, loopInd2, array2) {
                                        let rscItem = regSubContData[rscKey];

                                        refSubCont.child(rscItem.key).once('value', function (subContSnap) {
                                            let subContData = subContSnap.val();
                                            item['contData']['regSubContData'][rscKey]['subContData'] = {};
                                            item['contData']['regSubContData'][rscKey]['subContData'] = subContData;

                                            refRegSubsidiary.child(data.sel_project).orderByChild("sub_cont_key").equalTo(rscItem.key).once('value', function (regSubsSnap) {
                                                let regSubsData = regSubsSnap.val();

                                                if(regSubsData !== null){
                                                    item['contData']['regSubContData'][rscKey]['subContData']['regSubsData'] = {};
                                                    item['contData']['regSubContData'][rscKey]['subContData']['regSubsData'] = regSubsData;
                                                    let regSubsKeys = Object.keys(regSubsData);
                                                    regSubsKeys.forEach(function (rssKey, loopInd3, array3) {
                                                        let rssItem = regSubsData[rssKey];

                                                        refSubsidiary.child(rssItem.key).once('value', function(subsSnap){
                                                            let subsData = subsSnap.val();
                                                            item['contData']['regSubContData'][rscKey]['subContData']['regSubsData'][rssKey]['subsData'] = {};
                                                            item['contData']['regSubContData'][rscKey]['subContData']['regSubsData'][rssKey]['subsData'] = subsData;

                                                            refVouchersEntries.orderByChild('code').equalTo(rssKey).once('value', function (voucherEntSnap) {
                                                                let voucherEntData = voucherEntSnap.val();

                                                                if(voucherEntData !== null){
                                                                    let voucherEntKeys = Object.keys(voucherEntData);
                                                                    let grabEnt = {};
                                                                    let process_ent = 0;
                                                                    voucherEntKeys.forEach(function (vEntKey, loopInd4, array4) {
                                                                        let vEntItem = voucherEntData[vEntKey];
                                                                        if(vEntItem.type === "md"){
                                                                            refMasterDetails.child(vEntItem.v_key).once('value', function (mdSnap) {
                                                                                let mdData = mdSnap.val();
                                                                                if(mdData.posted_status === "Yes"){
                                                                                    grabEnt[vEntKey] = vEntItem;
                                                                                }
                                                                                process_ent++;
                                                                                if(process_ent === array4.length){
                                                                                    if(Object.keys(grabEnt).length > 0){
                                                                                        item['contData']['regSubContData'][rscKey]['subContData']['regSubsData'][rssKey]['subsData']['entries_data'] = bwDatesEntObj(bwDates, grabEnt);
                                                                                    }
                                                                                    if(loopInd3 === array3.length-1){
                                                                                        if(loopInd2 === array2.length-1){
                                                                                            grabData[key] = item;
                                                                                            if(loopInd1 === array1.length-1){
                                                                                                res.render('pdf_templates/trial_bs_sub_control_listing', {
                                                                                                    proName: proData.name,
                                                                                                    date: todayDate,
                                                                                                    data: grabData,
                                                                                                    start_date: start_date,
                                                                                                    end_date: end_date,
                                                                                                });
                                                                                                //res.json(grabData);
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            });
                                                                        }else{
                                                                            refVouchers.child(vEntItem.v_key).once('value', function (voucherSnap) {
                                                                                let voucherData = voucherSnap.val();
                                                                                if(voucherData.posted_status === "Yes"){
                                                                                    grabEnt[vEntKey] = vEntItem;
                                                                                }
                                                                                process_ent++;
                                                                                if(process_ent === array4.length){
                                                                                    if(Object.keys(grabEnt).length > 0){
                                                                                        item['contData']['regSubContData'][rscKey]['subContData']['regSubsData'][rssKey]['subsData']['entries_data'] = bwDatesEntObj(bwDates, grabEnt);
                                                                                    }
                                                                                    if(loopInd3 === array3.length-1){
                                                                                        if(loopInd2 === array2.length-1){
                                                                                            grabData[key] = item;
                                                                                            if(loopInd1 === array1.length-1){
                                                                                                res.render('pdf_templates/trial_bs_sub_control_listing', {
                                                                                                    proName: proData.name,
                                                                                                    date: todayDate,
                                                                                                    data: grabData,
                                                                                                    start_date: start_date,
                                                                                                    end_date: end_date,
                                                                                                });
                                                                                                //res.json(grabData);
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            });
                                                                        }
                                                                    });
                                                                }else{
                                                                    if(loopInd3 === array3.length-1){
                                                                        if(loopInd2 === array2.length-1){
                                                                            grabData[key] = item;
                                                                            if(loopInd1 === array1.length-1){
                                                                                res.render('pdf_templates/trial_bs_sub_control_listing', {
                                                                                    proName: proData.name,
                                                                                    date: todayDate,
                                                                                    data: grabData,
                                                                                    start_date: start_date,
                                                                                    end_date: end_date,
                                                                                });
                                                                                //res.json(grabData);
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            });
                                                        });
                                                    });
                                                }else{
                                                    if(loopInd2 === array2.length-1){
                                                        grabData[key] = item;
                                                        if(loopInd1 === array1.length-1){
                                                            res.render('pdf_templates/trial_bs_sub_control_listing', {
                                                                proName: proData.name,
                                                                date: todayDate,
                                                                data: grabData,
                                                                start_date: start_date,
                                                                end_date: end_date,
                                                            });
                                                            //res.json(grabData);
                                                        }
                                                    }
                                                }
                                            });
                                        });
                                    });
                                }else{
                                    grabData[key] = item;
                                    if(loopInd1 === array1.length-1){
                                        res.render('pdf_templates/trial_bs_sub_control_listing', {
                                            proName: proData.name,
                                            date: todayDate,
                                            data: grabData,
                                            start_date: start_date,
                                            end_date: end_date,
                                        });
                                        //res.json(grabData);
                                    }
                                }
                            });
                        });
                    });
                }else {
                    res.json({status: 'failed', message: "No Data Found!"});
                }
            });
        });
    }).catch(function (err) {
        res.json({err: err, status: 'failed'});
    });
});

router.post('/trial_balance/controls/view', function (req, res, next) {
    admin.auth().verifyIdToken(req.body.auth).then(function (decodedToken) {
        let data = req.body;
        let bwDates = [new Date(data.start_date).getTime(), new Date(data.end_date).getTime()];
        bwDates.sort();
        refPro.child(data.sel_project).once('value').then(function (proSnap) {
            let proData = proSnap.val();
            let todayDate = moment().format('dddd, DD MMMM YYYY');
            let start_date = moment(data.start_date).format("DD/MM/YYYY");
            let end_date = moment(data.end_date).format("DD/MM/YYYY");

            refRegCont.child(data.sel_project).once('value', function (regContSnap) {
                let regContData = regContSnap.val();
                if(regContData !== null){
                    let keys = Object.keys(regContData);
                    let grabData = {};
                    keys.forEach(function (key, loopInd1, array1) {
                        let item = regContData[key];
                        refCont.child(item.key).once('value', function (contSnap) {
                            item['contData'] = contSnap.val();

                            refRegSubCont.child(data.sel_project).orderByChild("cont_key").equalTo(item.key).once('value', function (regSubContSnap) {
                                let regSubContData = regSubContSnap.val();
                                if(regSubContData !== null){
                                    item['contData']['regSubContData'] = {};
                                    item['contData']['regSubContData'] = regSubContData;
                                    let regSubContKeys = Object.keys(regSubContData);
                                    regSubContKeys.forEach(function (rscKey, loopInd2, array2) {
                                        let rscItem = regSubContData[rscKey];

                                        refSubCont.child(rscItem.key).once('value', function (subContSnap) {
                                            let subContData = subContSnap.val();
                                            item['contData']['regSubContData'][rscKey]['subContData'] = {};
                                            item['contData']['regSubContData'][rscKey]['subContData'] = subContData;

                                            refRegSubsidiary.child(data.sel_project).orderByChild("sub_cont_key").equalTo(rscItem.key).once('value', function (regSubsSnap) {
                                                let regSubsData = regSubsSnap.val();

                                                if(regSubsData !== null){
                                                    item['contData']['regSubContData'][rscKey]['subContData']['regSubsData'] = {};
                                                    item['contData']['regSubContData'][rscKey]['subContData']['regSubsData'] = regSubsData;
                                                    let regSubsKeys = Object.keys(regSubsData);
                                                    regSubsKeys.forEach(function (rssKey, loopInd3, array3) {
                                                        let rssItem = regSubsData[rssKey];

                                                        refSubsidiary.child(rssItem.key).once('value', function(subsSnap){
                                                            let subsData = subsSnap.val();
                                                            item['contData']['regSubContData'][rscKey]['subContData']['regSubsData'][rssKey]['subsData'] = {};
                                                            item['contData']['regSubContData'][rscKey]['subContData']['regSubsData'][rssKey]['subsData'] = subsData;

                                                            refVouchersEntries.orderByChild('code').equalTo(rssKey).once('value', function (voucherEntSnap) {
                                                                let voucherEntData = voucherEntSnap.val();

                                                                if(voucherEntData !== null){
                                                                    let voucherEntKeys = Object.keys(voucherEntData);
                                                                    let grabEnt = {};
                                                                    let process_ent = 0;
                                                                    voucherEntKeys.forEach(function (vEntKey, loopInd4, array4) {
                                                                        let vEntItem = voucherEntData[vEntKey];
                                                                        if(vEntItem.type === "md"){
                                                                            refMasterDetails.child(vEntItem.v_key).once('value', function (mdSnap) {
                                                                                let mdData = mdSnap.val();
                                                                                if(mdData.posted_status === "Yes"){
                                                                                    grabEnt[vEntKey] = vEntItem;
                                                                                }
                                                                                process_ent++;
                                                                                if(process_ent === array4.length){
                                                                                    if(Object.keys(grabEnt).length > 0){
                                                                                        item['contData']['regSubContData'][rscKey]['subContData']['regSubsData'][rssKey]['subsData']['entries_data'] = bwDatesEntObj(bwDates, grabEnt);
                                                                                    }
                                                                                    if(loopInd3 === array3.length-1){
                                                                                        if(loopInd2 === array2.length-1){
                                                                                            grabData[key] = item;
                                                                                            if(loopInd1 === array1.length-1){
                                                                                                res.render('pdf_templates/trial_bs_control_listing', {
                                                                                                    proName: proData.name,
                                                                                                    date: todayDate,
                                                                                                    data: grabData,
                                                                                                    start_date: start_date,
                                                                                                    end_date: end_date,
                                                                                                });
                                                                                                //res.json(grabData);
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            });
                                                                        }else{
                                                                            refVouchers.child(vEntItem.v_key).once('value', function (voucherSnap) {
                                                                                let voucherData = voucherSnap.val();
                                                                                if(voucherData.posted_status === "Yes"){
                                                                                    grabEnt[vEntKey] = vEntItem;
                                                                                }
                                                                                process_ent++;
                                                                                if(process_ent === array4.length){
                                                                                    if(Object.keys(grabEnt).length > 0){
                                                                                        item['contData']['regSubContData'][rscKey]['subContData']['regSubsData'][rssKey]['subsData']['entries_data'] = bwDatesEntObj(bwDates, grabEnt);
                                                                                    }
                                                                                    if(loopInd3 === array3.length-1){
                                                                                        if(loopInd2 === array2.length-1){
                                                                                            grabData[key] = item;
                                                                                            if(loopInd1 === array1.length-1){
                                                                                                res.render('pdf_templates/trial_bs_control_listing', {
                                                                                                    proName: proData.name,
                                                                                                    date: todayDate,
                                                                                                    data: grabData,
                                                                                                    start_date: start_date,
                                                                                                    end_date: end_date,
                                                                                                });
                                                                                                //res.json(grabData);
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            });
                                                                        }
                                                                    });
                                                                }else{
                                                                    if(loopInd3 === array3.length-1){
                                                                        if(loopInd2 === array2.length-1){
                                                                            grabData[key] = item;
                                                                            if(loopInd1 === array1.length-1){
                                                                                res.render('pdf_templates/trial_bs_control_listing', {
                                                                                    proName: proData.name,
                                                                                    date: todayDate,
                                                                                    data: grabData,
                                                                                    start_date: start_date,
                                                                                    end_date: end_date,
                                                                                });
                                                                                //res.json(grabData);
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            });
                                                        });
                                                    });
                                                }else{
                                                    if(loopInd2 === array2.length-1){
                                                        grabData[key] = item;
                                                        if(loopInd1 === array1.length-1){
                                                            res.render('pdf_templates/trial_bs_control_listing', {
                                                                proName: proData.name,
                                                                date: todayDate,
                                                                data: grabData,
                                                                start_date: start_date,
                                                                end_date: end_date,
                                                            });
                                                            //res.json(grabData);
                                                        }
                                                    }
                                                }
                                            });
                                        });
                                    });
                                }else{
                                    grabData[key] = item;
                                    if(loopInd1 === array1.length-1){
                                        res.render('pdf_templates/trial_bs_control_listing', {
                                            proName: proData.name,
                                            date: todayDate,
                                            data: grabData,
                                            start_date: start_date,
                                            end_date: end_date,
                                        });
                                        //res.json(grabData);
                                    }
                                }
                            });
                        });
                    });
                }else {
                    res.json({status: 'failed', message: "No Data Found!"});
                }
            });
        });
    }).catch(function (err) {
        res.json({err: err, status: 'failed'});
    });
});

router.post('/payment/:id', function(req, res, next){
    admin.auth().verifyIdToken(req.body.auth).then(function (decodedToken) {
        refMasterDetails.child(req.params.id).once('value', function (mdSnap) {
            let mdData = mdSnap.val();
            if (mdData !== null) {
                refPro.child(mdData.sel_project).once('value', function (projectSnap) {
                    let projectData = projectSnap.val();
                    mdData['sel_project'] = projectData.name;

                    refBrokers.child(mdData.sel_broker).once('value', function (brokerSnap) {
                        let brokerData = brokerSnap.val();
                        mdData['sel_broker'] = brokerData.name;

                        refProjectTypes.child(mdData.sel_type).once('value', function (proTypeSnap) {
                            let proTypeData = proTypeSnap.val();
                            mdData['sel_type'] = proTypeData.name;

                            refProjectTypeItems.child(mdData.sel_pro_type_no).once('value', function (proTypeItemSnap) {
                                let proTypeItemData = proTypeItemSnap.val();
                                mdData['sel_pro_type_no'] = proTypeItemData.name;

                                refRegSubsidiary.child(projectSnap.key).orderByChild("key").equalTo(proTypeItemData.subs_key).once('value', function (regSubsSnap) {
                                    let regSubsCode = Object.keys(regSubsSnap.val())[0];
                                    refVouchersEntries.orderByChild("v_key").equalTo(mdSnap.key).once('value', function (md_entSnap) {
                                        if (md_entSnap.numChildren() > 0) {
                                            let process_item = 0;
                                            let grabEnt = [];
                                            md_entSnap.forEach(function (entItemSnap) {
                                                let entItemData = entItemSnap.val();
                                                if (regSubsCode === entItemData.code) {
                                                    let date = moment(entItemData.v_date);
                                                    let dueDate = date.clone().add(1, "M").set('date', 1);
                                                    grabEnt.push({
                                                        type: "MD",
                                                        voucher_id: mdData.id,
                                                        installment: entItemData.credit,
                                                        amount: entItemData.credit,
                                                        penalty: false,
                                                        pay_date: date.format("DD/MM/YYYY"),
                                                        due_date: dueDate.format("DD/MM/YYYY"),
                                                        due_date_unix: dueDate.unix(),
                                                    });
                                                }

                                                process_item++;
                                                if (process_item === md_entSnap.numChildren()) {
                                                    let server_date_unix = moment().unix();
                                                    let booking_date = moment(mdData.booking_date).add(1, "M");
                                                    for (let i = 0; i < mdData.payment_installment; i++) {
                                                        let dueDate = booking_date.add(1, "M").set('date', 1);
                                                        let dataSet = {
                                                            type: "",
                                                            voucher_id: "",
                                                            installment: mdData.payment_plan,
                                                            amount: 0,
                                                            penalty: false,
                                                            pay_date: false,
                                                            due_date: dueDate.format("DD/MM/YYYY"),
                                                            due_date_unix: dueDate.unix(),
                                                        };
                                                        if (server_date_unix > dataSet.due_date_unix) {
                                                            dataSet['penalty'] = true;
                                                        }
                                                        grabEnt.push(dataSet);
                                                    }

                                                    refVouchers.orderByChild("ref_key").equalTo(mdSnap.key).once('value', function (jv_entsSnap) {

                                                        if (jv_entsSnap.numChildren() > 0) {
                                                            let jv_entsData = jv_entsSnap.val();
                                                            let keys = Object.keys(jv_entsData);
                                                            keys.forEach(function (key, loopInd, arr) {
                                                                let jvEntData = jv_entsData[key];
                                                                if (jvEntData.posted_status === "Yes") {
                                                                    refVouchersEntries.orderByChild("v_key").equalTo(key).once('value', function (jvPayEntsSnap) {
                                                                        if (jvPayEntsSnap.numChildren() > 0) {
                                                                            jvPayEntsSnap.forEach(function (jvPayEntSnap) {
                                                                                let jvPayEntData = jvPayEntSnap.val();
                                                                                if (regSubsCode === jvPayEntData.code) {
                                                                                    let date = moment(jvPayEntData.v_date);
                                                                                    grabEnt.forEach(function (obj, ind, arr) {
                                                                                        if (obj.due_date_unix > date.unix()) {
                                                                                            if (arr[ind - 1].due_date_unix <= date.unix()) {
                                                                                                grabEnt[ind]['type'] = "JV";
                                                                                                grabEnt[ind]['voucher_id'] = jvEntData.id;
                                                                                                grabEnt[ind]['penalty'] = false;
                                                                                                grabEnt[ind]['pay_date'] = date.format("DD/MM/YYYY");
                                                                                                grabEnt[ind]['amount'] = jvPayEntData.credit;
                                                                                            }
                                                                                        }
                                                                                    });
                                                                                }
                                                                            });
                                                                        }

                                                                        if (loopInd === arr.length - 1) {
                                                                            mdData['booking_date'] = moment(mdData.booking_date).format("DD/MM/YYYY");
                                                                            res.render('pdf_templates/payment_plan', {
                                                                                data: mdData,
                                                                                entData: grabEnt
                                                                            });
                                                                        }
                                                                    });
                                                                } else {
                                                                    if (loopInd === arr.length - 1) {
                                                                        mdData['booking_date'] = moment(mdData.booking_date).format("DD/MM/YYYY");
                                                                        res.render('pdf_templates/payment_plan', {
                                                                            data: mdData,
                                                                            entData: grabEnt
                                                                        });
                                                                    }
                                                                }
                                                            });
                                                        } else {
                                                            mdData['booking_date'] = moment(mdData.booking_date).format("DD/MM/YYYY");
                                                            res.render('pdf_templates/payment_plan', {
                                                                data: mdData,
                                                                entData: grabEnt
                                                            });
                                                        }
                                                    });
                                                }
                                            });
                                        } else {
                                            res.json({status: "failed", message: "No Customer voucher found!"});
                                        }
                                    });
                                });
                            });
                        });
                    });
                });
            } else {
                res.json({status: "failed", message: "Invalid Id!"});
            }
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

function bwDatesEntObj(bwDates, entries){
    let keys = Object.keys(entries);
    let totCr = 0;
    let totDr = 0;
    keys.forEach(function (key) {
        let item = entries[key];
        if(item.v_date >= bwDates[0] && item.v_date <= bwDates[1]){
            totCr += item.credit;
            totDr += item.debit;
        }
    });
    return {credit: totCr, debit: totDr};
}