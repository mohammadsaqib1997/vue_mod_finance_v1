import firebase from 'firebase'
import SimpleVueValidation from 'simple-vue-validator'
import func from '../../../../custom_libs/func'

import comCities from '../../../partials/components/get_cities/get_cities.vue'

const Validator = SimpleVueValidation.Validator;

export default {
    created: function () {
        let self = this;

        const db = firebase.database();
        self.projectsRef = db.ref('/projects');

        self.projectsRef.on('value', function (proSnap) {
            let renderData = proSnap.val();
            if (renderData !== null) {
                self.proData = renderData;
            } else {
                self.proData = {};
            }
            self.dataLoad1 = false;
        });
    },
    data: function(){
        return {
            //loaders
            dataLoad1: true,

            // data save
            proData: {},

            // references
            projectsRef: null,

            // form fields
            first_name: "",
            last_name: "",
            email: "",
            mob_num: "",
            password: "",
            retype_password: "",
            gender: "Male",
            sel_project: "",
            zipcode: "",
        }
    },
    validators: {
        first_name: function (value) {
            return Validator.value(value).required().lengthBetween(3, 35);
        },
        last_name: function (value) {
            return Validator.value(value).required().lengthBetween(3, 35);
        },
        email: function (value) {
            return Validator.value(value).required().lengthBetween(3, 35).email();
        },
    },
    methods: {
        createUser: function () {
            let self = this;
            self.$validate().then(function (success_form) {
                self.$refs.sel_city.validate(function (success_city) {
                    if(success_form && success_city){
                        console.log('valid');
                    }
                });
            });
        }
    },
    components: {
        "com_cities": comCities
    }
}