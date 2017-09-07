import firebase from 'firebase'
import SimpleVueValidation from 'simple-vue-validator'
import Promise from 'bluebird'
import func from '../../../../custom_libs/func'

import getCodes from '../../../partials/components/get_codes/get_codes.vue'

const Validator = SimpleVueValidation.Validator;

export default {
    created: function () {
        let self = this;

        self.rows.forEach(function (row, ind) {
            self.$watch(function () {
                return self.rows[ind].quantity;
            }, function (val) {
                self.rows[ind].quantity = func.isNumber(val);
            });
            self.$watch(function () {
                return self.rows[ind].credit;
            }, function (val) {
                self.rows[ind].credit = func.isNumber(val);
                self.totalCredit();
            });
            self.$watch(function () {
                return self.rows[ind].debit;
            }, function (val) {
                self.rows[ind].debit = func.isNumber(val);
                self.totalDebit();
            });
        });

        const db = firebase.database();
        self.projectsRef = db.ref('/projects');
        self.vouchersRef = db.ref('/vouchers');
        self.vouchersEntriesRef = db.ref('/vouchers_entries');

        self.projectsRef.on('value', function (proSnap) {
            let renderData = proSnap.val();
            if (renderData !== null) {
                self.proData = renderData;
            } else {
                self.proData = {};
            }
            self.dataLoad1 = false;
        });

        self.vouchersRef.on('value', function (vouchersSnap) {
            let renderData = vouchersSnap.val();
            if (renderData !== null) {
                self.vouchersData = renderData;
            } else {
                self.vouchersData = {};
            }
            self.dataLoad2 = false;
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
            dataLoad2: true,

            // data save
            proData: {},
            vouchersData: {},

            // references
            projectsRef: null,
            vouchersRef: null,
            vouchersEntriesRef: null,

            // form fields
            rows: [
                {
                    code: '',
                    code_name: '',
                    remarks: '',
                    quantity: 0,
                    debit: 0,
                    credit: 0
                },
                {
                    code: '',
                    code_name: '',
                    remarks: '',
                    quantity: 0,
                    debit: 0,
                    credit: 0
                },
                {
                    code: '',
                    code_name: '',
                    remarks: '',
                    quantity: 0,
                    debit: 0,
                    credit: 0
                },
                {
                    code: '',
                    code_name: '',
                    remarks: '',
                    quantity: 0,
                    debit: 0,
                    credit: 0
                },
                {
                    code: '',
                    code_name: '',
                    remarks: '',
                    quantity: 0,
                    debit: 0,
                    credit: 0
                },
                {
                    code: '',
                    code_name: '',
                    remarks: '',
                    quantity: 0,
                    debit: 0,
                    credit: 0
                },
            ],
            total_debit: 0,
            total_credit: 0,
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

                            let voucher_push_gen = self.vouchersRef.push();
                            voucher_push_gen.set({
                                id: next_id,
                                nbr_number: self.nbr_number,
                                v_remarks: self.v_remarks,
                                posted_status: self.posted_status,
                                sel_project: self.sel_project,
                                voucher_date: self.voucher_date,
                                uid: firebase.auth().currentUser.uid,
                                createdAt: firebase.database.ServerValue.TIMESTAMP
                            }, function (err) {
                                if(err){
                                    self.errMain = err.message;
                                }else{
                                    let rows = self.rows;
                                    let subLength = 0;
                                    let process_item = 0;
                                    rows.forEach(function (row) {
                                        if(row.code !== ""){
                                            subLength++;
                                        }
                                    });
                                    rows.forEach(function (row, ind) {
                                        if(row.code !== ""){
                                            row['v_key'] = voucher_push_gen.key;
                                            row['v_data'] = self.voucher_date;
                                            row['createdAt'] = firebase.database.ServerValue.TIMESTAMP;

                                            self.vouchersEntriesRef.push(row, function (err) {
                                                if(err){
                                                    console.log(err);
                                                }

                                                process_item++;
                                                if(process_item === subLength){
                                                    self.errMain = "";
                                                    self.sucMain = "Successfully Inserted Voucher!";

                                                    self.voucher_id = "";
                                                    self.nbr_number = "";
                                                    self.v_remarks = "";
                                                    self.posted_status = "Yes";
                                                    self.sel_project = "";
                                                    $(".datepicker.voucher_date").val('');
                                                    self.voucher_date = "";
                                                    self.rows.forEach(function (row, ind) {
                                                        self.rows[ind].code = '';
                                                        self.rows[ind].code_name = '';
                                                        self.rows[ind].remarks = '';
                                                        self.rows[ind].quantity = 0;
                                                        self.rows[ind].debit = 0;
                                                        self.rows[ind].credit = 0;
                                                    });

                                                    self.validation.reset();
                                                    self.inProcess = false;
                                                    setTimeout(function () {
                                                        self.sucMain = "";
                                                    }, 1500);
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        });
                }
            });
        },
        changeCode: function (e, ind) {
            if(e !== ""){
                this.rows[ind].code = e.code;
                this.rows[ind].code_name = e.sub_name;
            }
        },
        totalCredit: function () {
            let self = this;
            self.total_credit = 0;
            self.rows.forEach(function (row) {
                self.total_credit += row.credit;
            });
        },
        totalDebit: function () {
            let self = this;
            self.total_debit = 0;
            self.rows.forEach(function (row) {
                self.total_debit += row.debit;
            });
        }
    },
    components: {
        getCodes
    }
}