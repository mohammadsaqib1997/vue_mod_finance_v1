import firebase from 'firebase'

import addProjectModal from '../../../../partials/components/modals/add_project/add_project.vue'
import addControlModal from '../../../../partials/components/modals/add_control/add_control.vue'
import addSubControlModal from '../../../../partials/components/modals/add_sub_control/add_sub_control.vue'

export default {
    created: function () {
        let self = this;

        const db = firebase.database();
        self.projectsRef = db.ref('/projects');
        self.controlsRef = db.ref('/controls');
        self.subControlsRef = db.ref('/sub_controls');

        self.projectsRef.on('value', function (proSnap) {
            let renderData = proSnap.val();
            if (renderData !== null) {
                self.proData = renderData;
            }else{
                self.proData = {};
            }
            self.dataLoad1 = false;
        });

        self.controlsRef.on('value', function (proSnap) {
            let renderData = proSnap.val();
            if (renderData !== null) {
                self.controlData = renderData;
            }else{
                self.controlData = {};
            }
            self.dataLoad2 = false;
        });
    },
    data: function(){
        return {
            dbLoad: null,

            //loaders
            dataLoad1: true,
            dataLoad2: true,
            dataLoad3: false,
            inProcess: false,

            // data save
            proData: {},
            controlData: {},
            subControlData: {},

            // references
            subControlsRef: null,
            controlsRef: null,
            projectsRef: null,

            // form fields
            sel_project: "",
            sel_control: "",
            sel_sub_control: "",
            errMain: "",
            sucMain: "",
        }
    },
    watch: {
        sel_project: function (value) {
            //this.projectControlLoad(value);
        },
        sel_control: function (value) {
            this.controlSubControlLoad(value);
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
        controlSubControlLoad: function(cont_key){
            let self = this;
            if(cont_key !== ""){
                self.dataLoad3 = true;
                self.dbLoadMet(function () {
                    self.subControlsRef.child(cont_key).on('value', function (subControlsSnap) {
                        let subControlsData = subControlsSnap.val();
                        if(subControlsData !== null){
                            self.subControlData = subControlsData;
                        }else{
                            self.subControlData = {};
                        }
                        self.sel_sub_control = "";
                        self.dataLoad3 = false;
                    });
                }, 500);
            }else{
                self.dbLoadMet(function () {
                    self.sel_sub_control = "";
                    self.subControlData = {};
                    self.dataLoad3 = false;
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