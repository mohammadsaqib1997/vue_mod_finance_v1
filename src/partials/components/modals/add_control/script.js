import firebase from 'firebase'

import Promise from 'bluebird'
import SimpleVueValidation from 'simple-vue-validator'
const Validator = SimpleVueValidation.Validator;

export default {
    props: ["sel_control"],
    created: function () {
        let self = this;

        self.$watch('cont_name', function (val, oldVal) {
            self.cont_name = self.$root.trim(val);
        });

        const db = firebase.database();
        self.controlsRef = db.ref('/controls');
    },
    watch: {
        sel_control: function (val) {
            this.update = (val) ? val.hasOwnProperty('key') : false;
            if(this.update){
                this.cont_name = val.name;
            }else{
                this.cont_name = "";
            }
        }
    },
    data: function () {
        return {
            //loaders
            inProcess: false,
            update: false,

            controlsRef: null,

            // form fields
            cont_name: "",
            errMain: "",
            sucMain: "",
        }
    },
    validators: {
        cont_name: function (value) {
            let self = this;
            return Validator.value(value).required().lengthBetween(3, 40).custom(function () {
                return Promise.delay(1000).then(function () {
                    return self.controlsRef.orderByChild('name').equalTo(value).once('value').then(function (contSnap) {
                        if(contSnap.numChildren() > 0){
                            if(self.update){
                                let valid = true;
                                contSnap.forEach(function (snap) {
                                    if(snap.key !== self.sel_control.key){
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
                });
            });
        }
    },
    methods: {
        addControl: function () {
            let self = this;
            self.$validate().then(function (success) {
                if (success) {
                    self.inProcess = true;
                    if(self.update){
                        self.controlsRef.child(self.sel_control.key).update({
                            name: self.cont_name
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
                    }else{
                        self.controlsRef
                            .orderByChild('id')
                            .limitToLast(1)
                            .once('value')
                            .then(function (controlsSnap) {
                                let controlsData = controlsSnap.val();
                                let next_id = 1;
                                if (controlsData !== null) {
                                    let keys = Object.keys(controlsData);
                                    next_id = parseInt(controlsData[keys[0]].id) + 1;
                                }
                                self.controlsRef.push({
                                    id: next_id,
                                    name: self.cont_name,
                                }, function (err) {
                                    if (err) {
                                        self.errMain = err.message;
                                    } else {
                                        self.errMain = "";
                                        self.sucMain = "Successfully inserted control!";
                                        self.cont_name = "";
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