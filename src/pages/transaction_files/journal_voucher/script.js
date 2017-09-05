import firebase from 'firebase'
import SimpleVueValidation from 'simple-vue-validator'
import Promise from 'bluebird'
import func from '../../../../custom_libs/func'

import getCodes from '../../../partials/components/get_codes/get_codes.vue'

const Validator = SimpleVueValidation.Validator;

export default {
    created: function () {
        let self = this;

        const db = firebase.database();
        self.projectsRef = db.ref('/projects');
        self.vouchersRef = db.ref('/vouchers');

        self.projectsRef.on('value', function (proSnap) {
            let renderData = proSnap.val();
            if (renderData !== null) {
                self.proData = renderData;
            } else {
                self.proData = {};
            }
            self.dataLoad1 = false;
        });

        setTimeout(function () {
            $(function(){
                $(".datepicker").datepicker().on('change', function(e) {
                    let grabField = $(e.target);
                    if(grabField.hasClass('voucher_date')){
                        let date = new Date(grabField.val());
                        self.voucher_date = date.getTime();
                    }
                });
            });
        }, 100);
    },
    data: function(){
        return {
            //loaders
            inProcess: false,
            dataLoad1: true,

            // data save
            proData: {},

            // references
            projectsRef: null,
            vouchersRef: null,

            // form fields
            voucher_id: "",
            nbr_number: "",
            v_remarks: "",
            posted_status: "Yes",
            sel_project: "",
            voucher_date: "",
            errMain: "",
            sucMain: "",
        }
    },
    validators: {
        voucher_id: function (value) {
            let self = this;
            return Validator.value(value).digit().maxLength(20).custom(function(){
                value = parseInt(value);
                if(value !== "" && !isNaN(value)){
                    return Promise.delay(1000).then(function () {
                        return self.vouchersRef.orderByChild('id').equalTo(value).once('value').then(function (voucherSnap) {
                            let renderData = voucherSnap.val();
                            if(renderData !== null){
                                return "Already taken!";
                            }
                        });
                    });
                }
            });
        },
        nbr_number: function (value) {
            return Validator.value(value).required().digit().maxLength(11, "Invalid NBR Number!");
        },
        v_remarks: function (value) {
            return Validator.value(value).required().lengthBetween(6, 35);
        },
        posted_status: function (value) {
            return Validator.value(value).required().in(['Yes', 'No'], "Invalid Status!");
        },
        sel_project: function (value) {
            return Validator.value(value).required().lengthBetween(20, 36);
        },
        voucher_date: function (value) {
            return Validator.value(value).required().digit().maxLength(20);
        },
    },
    methods: {
        addVoucher: function(){
            let self = this;
            self.$validate().then(function (success) {
                if(success){
                    self.inProcess = true;
                    self.vouchersRef
                        .orderByChild('id')
                        .limitToLast(1)
                        .once('value')
                        .then(function (voucherSnap) {
                            let renderData = voucherSnap.val();
                            let next_id = 1;
                            if(self.voucher_id !== ""){
                                next_id = parseInt(self.voucher_id);
                            }else{
                                if (renderData !== null) {
                                    let keys = Object.keys(renderData);
                                    next_id = parseInt(renderData[keys[0]].id) + 1;
                                }
                            }
                            /*self.vouchersRef.push({
                                id: next_id,
                                nbr_number: self.nbr_number,
                                v_remarks: self.v_remarks,
                                posted_status: self.posted_status,
                                sel_project: self.sel_project,
                                voucher_date: self.voucher_date,
                                createdAt: firebase.database.ServerValue.TIMESTAMP
                            }, function (err) {
                                if (err) {
                                    self.errMain = err.message;
                                } else {
                                    self.errMain = "";
                                    self.sucMain = "Successfully Inserted Voucher!";

                                    self.voucher_id = "";
                                    self.nbr_number = "";
                                    self.v_remarks = "";
                                    self.posted_status = "Yes";
                                    self.sel_project = "";
                                    $(".datepicker.voucher_date").val('');
                                    self.voucher_date = "";

                                    self.validation.reset();
                                    setTimeout(function () {
                                        self.sucMain = "";
                                    }, 1500);
                                }
                                self.inProcess = false;
                            });*/
                        });
                }
            });
        },
        changeCode: function (e) {
            let value = e.target.value;
            console.log(value);
        }
    },
    components: {
        getCodes
    }
}