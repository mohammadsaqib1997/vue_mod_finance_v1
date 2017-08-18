import firebase from 'firebase'

import SimpleVueValidation from 'simple-vue-validator'
const Validator = SimpleVueValidation.Validator;

export default {
    data: function(){
        return {
            mainErr: '',
            email: '',
            password: '',
            isProcess: false
        }
    },
    validators: {
        email: function(value){
            return Validator.value(value).required().email();
        },
        password: function(value){
            return Validator.value(value).required().minLength(6).maxLength(35);
        }
    },
    methods: {
        login: function(){
            let self = this;
            self.$validate().then(function (success) {
                if(success){
                    self.isProcess = true;
                    firebase.auth().signInWithEmailAndPassword(self.email, self.password).then(function(){
                        self.isProcess = false;
                        self.$router.push('/');
                    }).catch(function (err) {
                        self.isProcess = false;
                        self.mainErr = err.message;
                    });
                }
            });
        }
    }
}