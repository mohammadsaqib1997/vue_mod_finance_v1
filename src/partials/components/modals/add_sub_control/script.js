import firebase from 'firebase'
import func from '../../../../../custom_libs/func'
import Promise from 'bluebird'
import SimpleVueValidation from 'simple-vue-validator'
const Validator = SimpleVueValidation.Validator;

export default {
    props: ["sel_sub_control"],
    created: function () {
        let self = this;

        self.$watch('sub_cont_name', function (val, oldVal) {
            self.sub_cont_name = func.trim(val);
        });

        const db = firebase.database();
        self.controlsRef = db.ref('/controls');
        self.subControlsRef = db.ref('/sub_controls');

        self.controlsRef.on('value', function (snap) {
            let renderData = snap.val();
            if (renderData !== null) {
                self.controlData = renderData;
            } else {
                self.controlData = {};
            }
            self.dataLoad1 = false;
        });
    },
    watch: {
        sel_sub_control: function (val) {
            this.update = (val) ? val.hasOwnProperty('key') : false;
            if(this.update){
                this.sel_control = val.cont_key;
                this.sub_cont_name = val.name;
            }else{
                this.sel_control = "";
                this.sub_cont_name = "";
            }
        }
    },
    data: function () {
        return {
            //loaders
            dataLoad1: true,
            inProcess: false,
            update: false,

            // data save
            controlData: {},

            // references
            controlsRef: null,
            subControlsRef: null,

            // form fields
            sel_control: "",
            sub_cont_name: "",
            errMain: "",
            sucMain: "",
        }
    },
    validators: {
        sel_control: function (value) {
            return Validator.value(value).required().lengthBetween(20, 36);
        },
        sub_cont_name: function (value) {
            let self = this;
            return Validator.value(value).required().lengthBetween(3, 40).custom(function () {
                return Promise.delay(1000).then(function () {
                    if(self.sel_control !== ""){
                        return self.subControlsRef.orderByChild('name').equalTo(value).once('value').then(function (subContSnap) {
                            if(subContSnap.numChildren() > 0){
                                if(self.update){
                                    let valid = true;
                                    subContSnap.forEach(function (snap) {
                                        if(snap.key !== self.sel_sub_control.key){
                                            valid = false;
                                            return false;
                                        }
                                    });
                                    if(!valid){
                                        return "Already taken!";
                                    }
                                }else{
                                    return "Already taken!";
                                }
                            }
                        });
                    }
                });
            });
        }
    },
    methods: {
        addSubControl: function () {
            let self = this;
            self.$validate().then(function (success) {
                if (success) {
                    self.inProcess = true;
                    if(self.update){
                        self.subControlsRef.child(self.sel_sub_control.key).update({
                            name: self.sub_cont_name,
                            cont_key: self.sel_control
                        }, function (err) {
                            if (err) {
                                self.errMain = err.message;
                            } else {
                                self.errMain = "";
                                self.sucMain = "Successfully updated control!";
                                self.validation.reset();
                                setTimeout(function () {
                                    self.sucMain = "";
                                }, 1500);
                            }
                            self.inProcess = false;
                        });
                    }else {
                        self.subControlsRef
                            .orderByChild('cont_key')
                            .equalTo(self.sel_control)
                            .limitToLast(1)
                            .once('value')
                            .then(function (subControlsSnap) {
                                let subControlsData = subControlsSnap.val();
                                let next_id = 1;
                                if (subControlsData !== null) {
                                    let keys = Object.keys(subControlsData);
                                    next_id = parseInt(subControlsData[keys[keys.length - 1]].id) + 1;
                                }
                                self.inProcess = false;
                                self.subControlsRef.push({
                                    id: next_id,
                                    name: self.sub_cont_name,
                                    cont_key: self.sel_control
                                }, function (err) {
                                    if (err) {
                                        self.errMain = err.message;
                                    } else {
                                        self.errMain = "";
                                        self.sucMain = "Successfully inserted sub control!";
                                        self.sel_control = "";
                                        self.sub_cont_name = "";
                                        self.validation.reset();
                                        setTimeout(function () {
                                            self.sucMain = "";
                                        }, 1500);
                                    }
                                    self.inProcess = false;
                                });
                            });
                    }
                }
            });
        }
    }
}