import firebase from 'firebase'
import SimpleVueValidation from 'simple-vue-validator'

import addProjectModal from '../../../../partials/components/modals/add_project/add_project.vue'
import addControlModal from '../../../../partials/components/modals/add_control/add_control.vue'
import addSubControlModal from '../../../../partials/components/modals/add_sub_control/add_sub_control.vue'

const Validator = SimpleVueValidation.Validator;

export default {
    created: function () {
        let self = this;

        const db = firebase.database();
        self.projectsRef = db.ref('/projects');
        self.controlsRef = db.ref('/controls');

        self.projectsRef.on('value', function (proSnap) {
            let renderData = proSnap.val();
            if (renderData !== null) {
                self.proData = renderData;
            }else{
                self.proData = {};
            }
            self.dataLoad1 = false;
        });
    },
    data: function(){
        return {
            dbLoad: null,

            //loaders
            dataLoad1: true,
            dataLoad2: false,
            inProcess: false,

            // data save
            proData: {},
            controlData: {},

            // references
            controlsRef: null,
            projectsRef: null,

            // form fields
            sel_project: "",
            sel_control: "",
            errMain: "",
            sucMain: "",
        }
    },
    validators: {
        sel_project: function (value) {
            this.projectControlLoad(value);
            return Validator.value(value).required().lengthBetween(20, 36);
        },
        sel_control: function (value) {
            return Validator.value(value).required().lengthBetween(20, 36);
        },
    },
    methods: {
        getObjId: function (sel_key, obj) {
            if(sel_key !== ""){
                if(typeof obj[sel_key] !== "undefined"){
                    return (typeof obj[sel_key].id !== "undefined") ? obj[sel_key].id:"";
                }
            }
            return "";
        },
        getObjKeyVal: function (sel_key, obj, key) {
            if(sel_key !== ""){
                if(typeof obj[sel_key] !== "undefined"){
                    return (typeof obj[sel_key][key] !== "undefined") ? obj[sel_key][key]:"";
                }
            }
            return "";
        },
        projectControlLoad: function(pro_key){
            let self = this;
            if(pro_key !== ""){
                self.dataLoad2 = true;
                self.dbLoadMet(function () {
                    self.controlsRef.child(pro_key).on('value', function (controlsSnap) {
                        let controlsData = controlsSnap.val();
                        if(controlsData !== null){
                            self.controlData = controlsData;
                        }else{
                            self.controlData = {};
                        }
                        self.sel_control = "";
                        self.dataLoad2 = false;
                    });
                }, 500);
            }else{
                self.dbLoadMet(function () {
                    self.sel_control = "";
                    self.controlData = {};
                    self.dataLoad2 = false;
                }, 0);
            }
        },
        dbLoadMet: function (func, time) {
            let self = this;
            if(self.dbLoad !== null){
                clearTimeout(self.dbLoad);
                self.dbLoad = null;
                self.dbLoadMet(func, time);
            }else{
                self.dbLoad = setTimeout(func, time);
            }
        }
    },
    components: {
        addProjectModal,
        addControlModal,
        addSubControlModal
    }
}