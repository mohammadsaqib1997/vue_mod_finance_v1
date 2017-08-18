var func = require('./func');

var admin = require("firebase-admin");
var db = admin.database();
var user_active_req_ref = db.ref("user_active_requests");
var driver_bids_ref = db.ref("driver_bids");

var user_req_invoices = db.ref("user_request_invoices");

module.exports = {
    driver_submit_job: function(){
        var self = this;
        user_active_req_ref.on('child_changed', function (actSnap) {
            var actData = actSnap.val();
            if(actData !== null){
                if(actData.status === 'req.complete'){
                    var user_invoice_record = {
                        invoice_no: "000",
                        client_uid: actSnap.key,
                        driver_uid: actData.driver_uid,
                        req_id: actData.req_id,
                        amount: 0
                    };
                    driver_bids_ref.child(user_invoice_record.req_id+'/'+user_invoice_record.driver_uid).once('value').then(function (bidSnap) {
                        var bidData = bidSnap.val();
                        user_invoice_record['amount'] = parseInt(bidData.amount);
                        user_req_invoices.orderByChild('invoice_no').limitToLast(1).once('value').then(function(userInvSnap){
                            if(userInvSnap.val() !== null){
                                var userInvData = userInvSnap.val();
                                var keys = Object.keys(userInvData);
                                user_invoice_record['invoice_no'] = func.genInvoiceNo(parseInt(userInvData[keys[0]].invoice_no)+1);
                            }else{
                                user_invoice_record['invoice_no'] = func.genInvoiceNo(1);
                            }
                            self.insertUserReqInvoice(user_invoice_record, function () {
                                console.log("inserted");
                            });
                        });
                    });
                }
            }
        });
    },
    insertUserReqInvoice: function (record, callback) {
        var self = this;
        if(record !== null){
            user_req_invoices.push(record, function (err) {
                if(err){
                    self.insertUserReqInvoice(record);
                }else{
                    callback();
                }
            });
        }
    }
};