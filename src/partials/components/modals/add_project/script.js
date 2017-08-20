import firebase from 'firebase'

import SimpleVueValidation from 'simple-vue-validator'
const Validator = SimpleVueValidation.Validator;

export default {
    created: function () {
        let self = this;

        const db = firebase.database();
        self.projectsRef = db.ref('/projects');
        self.typesRef = db.ref('/project_types');

        self.typesRef.on('value', function (snap) {
            let renderData = snap.val();
            if (renderData !== null) {
                self.typesData = renderData;
            }else{
                self.typesData = {};
            }
            self.dataLoad1 = false;
        });
    },
    data: function(){
        return {
            //loaders
            dataLoad1: true,
            inProcess: false,

            // data save
            typesData: {},

            // references
            typesRef: null,
            projectsRef: null,

            // form fields
            name: "",
            type: "",
            address: "",
            contactNo: "",
            errMain: "",
            sucMain: "",
        }
    },
    validators: {
        name: function (value) {
            let self = this;
            return Validator.custom(function (){
                self.name = self.$root.trim(value);
            }).value(value).required().lengthBetween(6, 40);
        },
        type: function (value) {
            return Validator.value(value).required().digit().maxLength(11);
        },
        address: function (value) {
            let self = this;
            return Validator.custom(function () {
                self.address = self.$root.trim(value);
            }).value(value).required().maxLength(100);
        },
        contactNo: function (value) {
            return Validator.value(value).required().digit().lengthBetween(11, 11, "Invalid Number!");
        },
    },
    methods: {
        addProject: function () {
            let self = this;
            self.$validate().then(function (success) {
                if(success){
                    self.inProcess = true;
                    self.projectsRef.orderByChild('id').limitToLast(1).once('value').then(function (projSnap) {
                        let projData = projSnap.val();
                        let next_id = 1;
                        if(projData !== null){
                            let keys = Object.keys(projData);
                            next_id = parseInt(projData[keys[0]].id)+1;
                        }
                        self.projectsRef.push({
                            id: next_id,
                            name: self.name,
                            pro_type_id: self.type,
                            address: self.address,
                            contactNo: self.contactNo,
                        }, function (err) {
                            if(err){
                                self.errMain = err.message;
                            }else{
                                self.errMain = "";
                                self.sucMain = "Successfully inserted project!";
                                self.name = "";
                                self.type = "";
                                self.address = "";
                                self.contactNo = "";
                                self.validation.reset();
                                setTimeout(function () {
                                    self.sucMain = "";
                                }, 1500);
                            }
                            self.inProcess = false;
                        })
                    });
                }
            });
        }
    }
}