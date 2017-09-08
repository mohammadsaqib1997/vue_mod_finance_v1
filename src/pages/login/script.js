import firebase from 'firebase'

import SimpleVueValidation from 'simple-vue-validator'
const Validator = SimpleVueValidation.Validator;

const admin_email = require('../../../config/private.json').admin_email;

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
                    self.mainErr = "";
                    if(self.email === admin_email){
                        firebase.auth().signInWithEmailAndPassword(self.email, self.password).then(function(){
                            self.isProcess = false;
                            self.$router.push('/');
                        }).catch(function (err) {
                            self.isProcess = false;
                            self.mainErr = err.message;
                        });
                    }else{
                        self.$http.post('/api/check_user', {
                            email: self.email,
                            password: self.password,
                        }).then(function (res) {
                            let body = res.body;
                            if(body.status === "ok"){
                                firebase.auth().signInWithCustomToken(body.token).then(function () {
                                    self.isProcess = false;
                                    self.$router.push('/');
                                }, function (err) {
                                    self.mainErr = err.message;
                                    self.isProcess = false;
                                });
                            }else{
                                self.isProcess = false;
                                self.mainErr = body.message;
                            }
                        }, function (err) {
                            self.isProcess = false;
                            console.log(err);
                        });
                    }
                }
            });
        },
		backtologin: function(){
		 $('.main-login .box-login, .main-login .box-forgot').toggle();
		}
    }
}
$(document).ready(function(){
    $('[data-toggle="tooltip"]').tooltip(); 
});

jQuery.fn.center = function (e) {
	
				var devtop = ($(window).height() - $(this).outerHeight()) / 2;
				
                var devleft = ($(window).width() - $(this).outerWidth()) / 2;
				
                jQuery(this).css({position:'absolute', margin:0, top: (devtop > 0 ? devtop : 0)+'px', left: (devleft > 0 ? devleft : 0)+'px'});
				
			}
			jQuery('.box-login').center();