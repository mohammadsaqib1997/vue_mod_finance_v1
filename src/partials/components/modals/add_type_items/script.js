import firebase from 'firebase'

import Promise from 'bluebird'
import SimpleVueValidation from 'simple-vue-validator'
const Validator = SimpleVueValidation.Validator;

export default {
    props:[
        "sel_project",
        "edit_data"
    ],
    created: function () {
        let self = this;

        const db = firebase.database();
        self.projectsRef = db.ref('/projects');
        self.projectTypesRef = db.ref('/project_types');
        self.projectTypeItemsRef = db.ref('/project_type_items');
        self.regSubsidiaryRef = db.ref('/reg_subsidiary');
        self.subsidiaryRef = db.ref('/subsidiary');
    },
    data: function () {
        return {
            //loaders
            inProcess: false,
            dataLoad1: true,

            //data
            proData: {},
            proTypesData: {},
            regSubsData: {},

            //reference
            projectsRef: null,
            projectTypesRef: null,
            projectTypeItemsRef: null,
            regSubsidiaryRef: null,

            // form fields
            update: false,
            name: "",
            sel_subs: "",
            sel_type: "",
            type_name: "",
            errMain: "",
            sucMain: "",
        }
    },
    watch: {
        sel_project: function (val) {
            let self = this;
            if(val !== ""){
                self.loadData(val);
            }else{
                self.name = "";
                self.sel_subs = "";
                self.validation.reset();
            }
        },
        edit_data: function (val) {
            if(val.hasOwnProperty('key')){
                this.update = true;
                this.loadData(this.sel_project);
            }else{
                this.sel_subs = "";
                this.name = "";
                this.update = false;
                this.validation.reset();
            }
        }
    },
    validators: {
        name: function (value) {
            let self = this;
            return Validator.value(value).required().lengthBetween(3, 50).custom(function () {
                if(value !== ""){
                    return Promise.delay(1000).then(function () {
                        return self.projectTypeItemsRef.orderByChild('name').equalTo(value).once('value').then(function (snap) {
                            let data = snap.val();
                            if(data !== null){
                                let keys = Object.keys(data);
                                let exist = false;
                                keys.forEach(function (key) {
                                    let item = data[key];
                                    if(item.pro_key === self.sel_project){
                                        if(self.update){
                                            if(key !== self.edit_data.key){
                                                exist = true;
                                                return false;
                                            }
                                        }else{
                                            exist = true;
                                            return false;
                                        }
                                    }
                                });
                                if(exist){
                                    return "Already taken!";
                                }
                            }
                        });
                    });
                }
            });
        },
        sel_project: function (value) {
            return Validator.value(value).required().lengthBetween(20, 36);
        },
        sel_subs: function (value) {
            let self = this;
            return Validator.value(value).required().lengthBetween(20, 36).custom(function () {
                if(value !== ""){
                    return Promise.delay(1000).then(function () {
                        return self.projectTypeItemsRef.orderByChild('subs_key').equalTo(value).once('value').then(function (snap) {
                            let data = snap.val();
                            if(data !== null){
                                let keys = Object.keys(data);
                                let exist = false;
                                keys.forEach(function (key) {
                                    let item = data[key];
                                    if(item.pro_key === self.sel_project){
                                        if(self.update){
                                            if(key !== self.edit_data.key){
                                                exist = true;
                                                return false;
                                            }
                                        }else{
                                            exist = true;
                                            return false;
                                        }
                                    }
                                });
                                if(exist){
                                    return "Already taken!";
                                }
                            }
                        });
                    });
                }
            });
        },
        sel_type: function (value) {
            return Validator.value(value).required().lengthBetween(1, 11);
        },
    },
    methods: {
        addTypeItem: function () {
            let self = this;
            self.inProcess = true;
            self.$validate().then(function (success) {
                if (success) {
                    if(self.update){
                        self.projectTypeItemsRef.child(self.edit_data.key).update({
                            name: self.name,
                            subs_key: self.sel_subs
                        }, function (err) {
                            if (err) {
                                self.errMain = err.message;
                            } else {
                                self.errMain = "";
                                self.sucMain = "Successfully updated item!";
                                setTimeout(function () {
                                    self.sucMain = "";
                                }, 1500);
                            }
                            self.inProcess = false;
                        });
                    }else{
                        self.projectTypeItemsRef
                            .orderByChild('id')
                            .limitToLast(1)
                            .once('value')
                            .then(function (snap) {
                                let renderData = snap.val();
                                let next_id = 1;
                                if (renderData !== null) {
                                    let keys = Object.keys(renderData);
                                    next_id = parseInt(renderData[keys[0]].id) + 1;
                                }
                                self.projectTypeItemsRef.push({
                                    id: next_id,
                                    name: self.name,
                                    pro_key: self.sel_project,
                                    type_key: self.sel_type,
                                    subs_key: self.sel_subs,
                                    createdAt: firebase.database.ServerValue.TIMESTAMP,
                                }, function (err) {
                                    if (err) {
                                        self.errMain = err.message;
                                    } else {
                                        self.errMain = "";
                                        self.sucMain = "Successfully inserted item!";
                                        self.name = "";
                                        self.sel_subs = "";
                                        self.validation.reset();
                                        setTimeout(function () {
                                            self.sucMain = "";
                                        }, 1500);
                                    }
                                    self.inProcess = false;
                                });
                            });
                    }
                }else{
                    self.inProcess = false;
                }
            });
        },
        loadData: function (val) {
            let self = this;
            self.sel_subs = "";
            self.sel_type = "";
            self.type_name = "";
            self.dataLoad1 = true;
            // --data-load
            self.projectsRef.child(val).once('value', function (proSnap) {
                let proData = proSnap.val();
                if(proData !== null){
                    self.sel_type = proData.pro_type_id;
                    // --data-load
                    self.projectTypesRef.child(self.sel_type).once('value', function(proTypeSnap){
                        self.type_name = proTypeSnap.val().name;
                        // --data-load
                        self.regSubsidiaryRef.child(val).once('value', function (regSubsSnap) {
                            if(regSubsSnap.numChildren() > 0){
                                let grabData = {};
                                let process_item = 0;
                                regSubsSnap.forEach(function (regSubSnap) {
                                    let regSubItem = regSubSnap.val();
                                    // --data-load
                                    self.subsidiaryRef.child(regSubItem.key).once('value', function (subsSnap) {
                                        let subsData = subsSnap.val();
                                        regSubItem['name'] = subsData.name;
                                        grabData[subsSnap.key] = regSubItem;

                                        process_item++;
                                        if(process_item === regSubsSnap.numChildren()){
                                            self.regSubsData = grabData;
                                            if(self.update){
                                                self.sel_subs = self.edit_data.subs_key;
                                                self.name = self.edit_data.name;
                                            }
                                            self.dataLoad1 = false;
                                        }
                                    });
                                });
                            }else{
                                self.dataLoad1 = false;
                            }
                        });
                    });
                } else {
                    self.dataLoad1 = false;
                }
            });
        }
    }
}