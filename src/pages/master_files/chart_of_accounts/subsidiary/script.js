import firebase from 'firebase'
import SimpleVueValidation from 'simple-vue-validator'
import func from '../../../../../custom_libs/func'

import addProjectModal from '../../../../partials/components/modals/add_project/add_project.vue'
import proSelControlModal from '../../../../partials/components/modals/proj_sel_control/proj_sel_control.vue'
import proSelSubControlModal from '../../../../partials/components/modals/proj_sel_sub_control/proj_sel_sub_control.vue'
import proSelSubsModal from '../../../../partials/components/modals/proj_sel_subsidiary/proj_sel_subsidiary.vue'
import addControlModal from '../../../../partials/components/modals/add_control/add_control.vue'
import addSubControlModal from '../../../../partials/components/modals/add_sub_control/add_sub_control.vue'
import addSubsidiaryModal from '../../../../partials/components/modals/add_subsidiary/add_subsidiary.vue'

const Validator = SimpleVueValidation.Validator;

export default {
    created: function () {
        let self = this;

        self.$watch('sel_project', function (val, oldVal) {
            self.proSelContGet(val);
        });

        self.$watch('sel_control', function (val, oldVal) {
            self.contSelSubContGet(val);
        });

        self.$watch('sel_sub_control', function (val, oldVal) {
            self.selSubSelSubsGet(val);
        });

        self.$watch('sel_subsidiary', function (val, oldVal) {
            self.loadDataSubs(self.sel_project, val);
        });

        self.$watch('debit', function (val, oldVal) {
            self.debit = func.isNumber(val, 100000);
        });

        self.$watch('credit', function (val, oldVal) {
            self.credit = func.isNumber(val, 100000);
        });

        const db = firebase.database();
        self.projectsRef = db.ref('/projects');
        self.controlsRef = db.ref('/controls');
        self.subControlsRef = db.ref('/sub_controls');
        self.subsRef = db.ref('/subsidiary');
        self.proSelContRef = db.ref('/pro_sel_control');
        self.regSubsRef = db.ref('/reg_subsidiary');
        self.billTypesRef = db.ref('/bill_types');

        self.projectsRef.on('value', function (proSnap) {
            let renderData = proSnap.val();
            if (renderData !== null) {
                self.proData = renderData;
            }else{
                self.proData = {};
            }
            self.dataLoad1 = false;
        });

        self.billTypesRef.on('value', function (billTypesSnap) {
            let renderData = billTypesSnap.val();
            if (renderData !== null) {
                self.billTypesData = renderData;
            }else{
                self.billTypesData = {};
            }
            self.dataLoad6 = false;
        });
    },
    data: function(){
        return {
            dbLoad: null,

            //loaders
            dataLoad1: true,
            dataLoad2: false,
            dataLoad3: false,
            dataLoad4: false,
            dataLoad5: false,
            dataLoad6: true,
            inProcess: false,

            // data save
            proData: {},
            controlData: {},
            subControlData: {},
            subsData: {},
            billTypesData: {},

            // references
            subsRef: null,
            subControlsRef: null,
            controlsRef: null,
            projectsRef: null,
            proSelContRef: null,
            regSubsRef: null,
            billTypesRef: null,

            // form fields
            sel_project: "",
            sel_control: "",
            sel_sub_control: "",
            sel_subsidiary: "",
            party_id: "",
            bill_type: "",
            debit: 0,
            credit: 0,
            errMain: "",
            sucMain: "",
        }
    },
    validators: {
        sel_project: function (value) {
            return Validator.value(value).required().lengthBetween(20, 36);
        },
        sel_control: function (value) {
            return Validator.value(value).required().lengthBetween(20, 36);
        },
        sel_sub_control: function (value) {
            return Validator.value(value).required().lengthBetween(20, 36);
        },
        sel_subsidiary: function (value) {
            return Validator.value(value).required().lengthBetween(20, 36);
        },
        party_id: function (value) {
            return Validator.value(value).lengthBetween(20, 36);
        },
        bill_type: function (value) {
            return Validator.value(value).required().lengthBetween(1, 11, "Invalid Bill Type!");
        },
        debit: function (value) {
            return Validator.value(value).required();
        },
        credit: function (value) {
            return Validator.value(value).required();
        }
    },
    methods: {
        getObjId: func.getObjId,
        getObjKeyVal: func.getObjKeyVal,
        proSelContGet: function (pro_key) {
            let self = this;
            self.dataLoad2 = true;
            self.sel_control = "";
            self.controlData = {};
            if(pro_key !== ""){
                func.dbLoadMet(function () {
                    self.proSelContRef.child(pro_key).on('value', function (proSelContSnap) {
                        let data = proSelContSnap.val();
                        if(data !== null){
                            let keys = Object.keys(data);
                            let keys_length = keys.length;
                            let process_item = 0;
                            self.sel_control = "";
                            self.controlData = {};
                            keys.forEach(function (row) {
                                self.controlsRef.child(row).once('value').then(function (conSnap) {
                                    self.controlData[row] = conSnap.val();
                                    process_item++;
                                    if(process_item === keys_length){
                                        self.controlData = func.sortObj(self.controlData, false);
                                        self.dataLoad2 = false;
                                    }
                                });
                            });
                        }else{
                            self.dataLoad2 = false;
                        }
                    });
                }, 500, self.dbLoad);
            }else{
                self.dataLoad2 = false;
            }
        },
        contSelSubContGet: function (cont_key) {
            let self = this;
            self.dataLoad3 = true;
            self.sel_sub_control = "";
            self.subControlData = {};
            if(cont_key !== ""){
                func.dbLoadMet(function () {
                    self.proSelContRef.child(self.sel_project+"/"+cont_key).once('value', function (proSelSubContSnap) {
                        let data = proSelSubContSnap.val();
                        if(data !== null){
                            let keys = Object.keys(data);
                            let keys_length = keys.length;
                            if(keys_length > 0){
                                let process_item = 0;
                                self.sel_sub_control = "";
                                self.subControlData = {};
                                keys.forEach(function (row) {
                                    self.subControlsRef.child(row).once('value').then(function (subConSnap) {
                                        self.subControlData[row] = subConSnap.val();
                                        process_item++;
                                        if(process_item === keys_length){
                                            self.subControlData = func.sortObj(self.subControlData, false);
                                            self.dataLoad3 = false;
                                        }
                                    });
                                });
                            }else{
                                self.dataLoad3 = false;
                            }
                        }else{
                            self.dataLoad3 = false;
                        }
                    });
                }, 500, self.dbLoad);
            }else{
                self.dataLoad3 = false;
            }
        },
        selSubSelSubsGet: function (sub_cont_key) {
            let self = this;
            self.dataLoad4 = true;
            self.sel_subsidiary = "";
            self.subsData = {};
            if(sub_cont_key !== ""){
                func.dbLoadMet(function () {
                    self.proSelContRef.child(self.sel_project+"/"+self.sel_control+"/"+sub_cont_key).once('value', function (proSubsSnap) {
                        let data = proSubsSnap.val();
                        if(data !== null){
                            let keys = Object.keys(data);
                            let keys_length = keys.length;
                            if(keys_length > 0){
                                let process_item = 0;
                                self.sel_subsidiary = "";
                                self.subsData = {};
                                keys.forEach(function (row) {
                                    self.subsRef.child(row).once('value').then(function (subsSnap) {
                                        self.subsData[row] = subsSnap.val();
                                        process_item++;
                                        if(process_item === keys_length){
                                            self.subsData = func.sortObj(self.subsData, false);
                                            self.dataLoad4 = false;
                                        }
                                    });
                                });
                            }else{
                                self.dataLoad4 = false;
                            }
                        }else{
                            self.dataLoad4 = false;
                        }
                    });
                }, 500, self.dbLoad);
            }else{
                self.dataLoad4 = false;
            }
        },
        loadDataSubs: function (pro_key, subs_key) {
            let self = this;
            self.dataLoad5 = true;
            self.party_id = "";
            self.bill_type = "";
            self.debit = 0;
            self.credit = 0;
            if(pro_key !== "" && subs_key !== ""){
                self.regSubsRef.child(pro_key).orderByChild('key').equalTo(subs_key).once('value').then(function (regSubsSnap) {
                    let data = regSubsSnap.val();
                    if(data !== null){
                        let keys = Object.keys(data);
                        self.party_id = (data[keys[0]].party_key !== false)? data[keys[0]].party_key: "";
                        self.bill_type = data[keys[0]].bill_type_key;
                        self.debit = data[keys[0]].debit;
                        self.credit = data[keys[0]].credit;
                    }
                    self.dataLoad5 = false;
                });
            }else{
                self.dataLoad5 = false;
            }
        },
        addSubsEntry: function () {
            let self = this;
            self.$validate().then(function (success) {
                if (success) {
                    self.inProcess = true;
                    let id_gen = func.genInvoiceNo(self.controlData[self.sel_control].id, '00', 3)
                        +func.genInvoiceNo(self.subControlData[self.sel_sub_control].id, '000', 4)
                        +func.genInvoiceNo(self.subsData[self.sel_subsidiary].id, '00', 3);
                    self.regSubsRef.child(self.sel_project+"/"+id_gen).set({
                        'key': self.sel_subsidiary,
                        'debit': self.debit,
                        'credit': self.credit,
                        'party_key': (self.party_id !== "")? self.party_id: false,
                        'bill_type_key': self.bill_type,
                        'createdAt': firebase.database.ServerValue.TIMESTAMP
                    }, function (err) {
                        if(err){
                            self.errMain = err.message;
                        }else{
                            self.errMain = "";
                            self.sucMain = "Successfully inserted subsidiary amount!";
                            self.sel_project = "";
                            self.sel_control = "";
                            self.sel_sub_control = "";
                            self.sel_subsidiary = "";
                            self.party_id = "";
                            self.bill_type = "";
                            self.debit = 0;
                            self.credit = 0;
                            self.validation.reset();
                            setTimeout(function () {
                                self.sucMain = "";
                            }, 1500);
                        }
                        self.inProcess = false;
                    });
                }
            });
        }
    },
    components: {
        addProjectModal,
        proSelControlModal,
        proSelSubControlModal,
        proSelSubsModal,
        addControlModal,
        addSubControlModal,
        addSubsidiaryModal
    }
}