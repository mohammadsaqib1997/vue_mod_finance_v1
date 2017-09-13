import firebase from 'firebase'
import SimpleVueValidation from 'simple-vue-validator'
import Promise from 'bluebird'
import func from '../../../../custom_libs/func'

import getCodes from '../../../partials/components/get_codes/get_codes.vue'

const Validator = SimpleVueValidation.Validator;

export default {
    created: function () {
        let self = this;

        self.$watch("sel_voucher", function (val, oldVal) {
            self.updateVoucherVal(val);
        });

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
            $(function () {
                $(".datepicker").datepicker().on('change', function (e) {
                    let grabField = $(e.target);
                    if (grabField.hasClass('voucher_date')) {
                        let date = new Date(grabField.val());
                        self.voucher_date = date.getTime();
                    }
                });
            });
        }, 100);
    },
    data: function () {
        return {
            //loaders
            inProcess: false,
            dataLoad1: true,
            dataLoad2: true,
            dataLoad3: false,
            updateV: false,

            // data save
            proData: {},
            vouchersData: {},

            // references
            projectsRef: null,
            vouchersRef: null,
            vouchersEntriesRef: null,

            // form fields
            sel_voucher: "",
            rows: [
                {
                    key: '',
                    code: '',
                    code_name: '',
                    remarks: '',
                    quantity: 0,
                    debit: 0,
                    credit: 0,
                    v_key: '',
                    v_date: 0,
                    createdAt: 0,
                }, {
                    key: '',
                    code: '',
                    code_name: '',
                    remarks: '',
                    quantity: 0,
                    debit: 0,
                    credit: 0,
                    v_key: '',
                    v_date: 0,
                    createdAt: 0,
                }, {
                    key: '',
                    code: '',
                    code_name: '',
                    remarks: '',
                    quantity: 0,
                    debit: 0,
                    credit: 0,
                    v_key: '',
                    v_date: 0,
                    createdAt: 0,
                }, {
                    key: '',
                    code: '',
                    code_name: '',
                    remarks: '',
                    quantity: 0,
                    debit: 0,
                    credit: 0,
                    v_key: '',
                    v_date: 0,
                    createdAt: 0,
                }, {
                    key: '',
                    code: '',
                    code_name: '',
                    remarks: '',
                    quantity: 0,
                    debit: 0,
                    credit: 0,
                    v_key: '',
                    v_date: 0,
                    createdAt: 0,
                }, {
                    key: '',
                    code: '',
                    code_name: '',
                    remarks: '',
                    quantity: 0,
                    debit: 0,
                    credit: 0,
                    v_key: '',
                    v_date: 0,
                    createdAt: 0,
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
            let setValidator = Validator.value(value);
            if (self.updateV) {
                setValidator.required();
            }
            return setValidator.digit().maxLength(20).custom(function () {
                value = parseInt(value);
                if (value !== "" && !isNaN(value)) {
                    return Promise.delay(1000).then(function () {
                        return self.vouchersRef.orderByChild('id').equalTo(value).once('value').then(function (voucherSnap) {
                            let renderData = voucherSnap.val();
                            if (renderData !== null) {
                                if (self.updateV) {
                                    let keys = Object.keys(renderData);
                                    if (keys[0] !== self.sel_voucher) {
                                        return "Already taken!";
                                    }
                                } else {
                                    return "Already taken!";
                                }
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
        addVoucher: function () {
            let self = this;
            self.inProcess = true;
            self.$validate().then(function (success) {
                if (success) {
                    self.vouchersRef
                        .orderByChild('id')
                        .limitToLast(1)
                        .once('value')
                        .then(function (voucherSnap) {
                            let renderData = voucherSnap.val();
                            let next_id = 1;
                            if (self.voucher_id !== "") {
                                next_id = parseInt(self.voucher_id);
                            } else {
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
                                if (err) {
                                    self.errMain = err.message;
                                    self.inProcess = false;
                                } else {
                                    let rows = self.rows;
                                    let subLength = 0;
                                    let process_item = 0;
                                    rows.forEach(function (row) {
                                        if (row.code !== "") {
                                            subLength++;
                                        }
                                    });
                                    if (subLength > 0) {
                                        rows.forEach(function (row, ind) {
                                            if (row.code !== "") {
                                                delete row['key'];
                                                row.v_key = voucher_push_gen.key;
                                                row.v_date = self.voucher_date;
                                                row.createdAt = firebase.database.ServerValue.TIMESTAMP;
                                                row['type'] = "jv";

                                                self.vouchersEntriesRef.push(row, function (err) {
                                                    if (err) {
                                                        console.log(err);
                                                    }

                                                    process_item++;
                                                    if (process_item === subLength) {
                                                        self.voucherMsg(self, "Successfully Inserted Voucher!");
                                                    }
                                                });
                                            }
                                        });
                                    } else {
                                        self.voucherMsg(self, "Successfully Inserted Voucher!");
                                    }
                                }
                            });
                        });
                } else {
                    self.inProcess = false;
                }
            });
        },
        updateVoucher: function () {
            let self = this;
            self.inProcess = true;
            self.$validate().then(function (success) {
                if (success) {
                    self.vouchersRef.child(self.sel_voucher).update({
                        id: self.voucher_id,
                        nbr_number: self.nbr_number,
                        v_remarks: self.v_remarks,
                        posted_status: self.posted_status,
                        sel_project: self.sel_project,
                        voucher_date: self.voucher_date,
                        uid: firebase.auth().currentUser.uid,
                        createdAt: firebase.database.ServerValue.TIMESTAMP
                    }, function (err) {
                        if (err) {
                            self.errMain = err.message;
                            self.inProcess = false;
                        } else {
                            let rows = self.rows;
                            let subLength = 0;
                            let process_item = 0;
                            rows.forEach(function (row) {
                                if (row.code !== "") {
                                    subLength++;
                                }
                            });
                            if (subLength > 0) {
                                rows.forEach(function (row, ind) {
                                    let key_save = row.key;
                                    if (row.code !== "") {
                                        delete row['key'];
                                        row.v_key = self.sel_voucher;
                                        row.v_date = self.voucher_date;
                                        row.createdAt = firebase.database.ServerValue.TIMESTAMP;
                                        row['type'] = "jv";

                                        if(key_save !== ""){
                                            self.vouchersEntriesRef.child(key_save).update(row, function (err) {
                                                if (err) {
                                                    console.log(err);
                                                }

                                                process_item++;
                                                if (process_item === subLength) {
                                                    self.voucherMsg(self, "Successfully Updated Voucher!");
                                                }
                                            });
                                        }else{
                                            self.vouchersEntriesRef.push(row, function (err) {
                                                if (err) {
                                                    console.log(err);
                                                }

                                                process_item++;
                                                if (process_item === subLength) {
                                                    self.voucherMsg(self, "Successfully Updated Voucher!");
                                                }
                                            });
                                        }
                                    }
                                });
                            } else {
                                self.voucherMsg(self, "Successfully Updated Voucher!");
                            }
                        }
                    });
                } else {
                    self.inProcess = false;
                }
            });
        },
        changeCode: function (e, ind) {
            if (e !== "") {
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
        },
        updateVoucherVal: function (key) {
            let self = this;
            if (key !== "") {
                self.updateV = true;
                let sel_voucher = self.vouchersData[key];
                self.voucher_id = sel_voucher.id;
                self.nbr_number = sel_voucher.nbr_number;
                self.v_remarks = sel_voucher.v_remarks;
                self.posted_status = sel_voucher.posted_status;
                self.sel_project = sel_voucher.sel_project;
                self.voucher_date = sel_voucher.voucher_date;
                $(".datepicker.voucher_date").datepicker("setDate", new Date(sel_voucher.voucher_date));
                self.voucherEntriesGet(self);

            } else {
                self.updateV = false;
                self.fullVoucherReset(self);
            }
        },
        fullVoucherReset: function (self) {
            self.sel_voucher = "";
            self.voucher_id = "";
            self.nbr_number = "";
            self.v_remarks = "";
            self.posted_status = "Yes";
            self.sel_project = "";
            $(".datepicker.voucher_date").val('');
            self.voucher_date = "";
            self.rows.forEach(function (row, ind) {
                self.rows[ind].key = '';
                self.rows[ind].code = '';
                self.rows[ind].code_name = '';
                self.rows[ind].remarks = '';
                self.rows[ind].quantity = 0;
                self.rows[ind].debit = 0;
                self.rows[ind].credit = 0;
                self.rows[ind].v_key = '';
                self.rows[ind].v_date = 0;
                self.rows[ind].createdAt = 0;
            });
            self.validation.reset();
        },
        voucherMsg: function (self, msg) {
            self.errMain = "";
            self.sucMain = msg;

            self.fullVoucherReset(self);

            self.inProcess = false;
            setTimeout(function () {
                self.sucMain = "";
            }, 1500);
        },
        voucherEntriesGet: function (self) {
            self.dataLoad3 = true;
            self.vouchersEntriesRef
                .orderByChild("v_key")
                .equalTo(self.sel_voucher)
                .once('value', function (entSnap) {
                    let entData = entSnap.val();
                    if(entData !== null){
                        let keys = Object.keys(entData);
                        self.rows.forEach(function (row, ind) {
                            if(keys.length >= (ind+1)){
                                let item = entData[keys[ind]];
                                self.rows[ind].key = keys[ind];
                                self.rows[ind].code = item.code;
                                self.rows[ind].code_name = item.code_name;
                                self.rows[ind].createdAt = item.createdAt;
                                self.rows[ind].credit = item.credit;
                                self.rows[ind].debit = item.debit;
                                self.rows[ind].quantity = item.quantity;
                                self.rows[ind].remarks = item.remarks;
                                self.rows[ind].v_date = item.v_date;
                                self.rows[ind].v_key = item.v_key;
                            }
                        });
                    }
                    self.dataLoad3 = false;
                });
        }
    },
    components: {
        getCodes
    }
}