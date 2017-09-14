import Vue from 'vue'
import VueRouter from 'vue-router'
import VueResource from "vue-resource"
import SimpleVueValidation from 'simple-vue-validator'
import firebase from 'firebase'

import config_fb from '../../config/private.json'
firebase.initializeApp(config_fb.config_fb);

import routes from './routes'

Vue.use(VueRouter);
Vue.use(VueResource);
Vue.use(SimpleVueValidation);

const router = new VueRouter({
    mode: 'history',
    routes
});

//const fromReq = '';
/*router.beforeEach(function (to, from, next) {
    let checkCond = to.matched.some(function (result) {
        return result.meta.admin;
    });
    if(checkCond){
        if(){

        }
        next();
    }else{
        next();
    }
});*/

new Vue({
    router,
    beforeCreate: function () {
        let self = this;
        self.$router.beforeEach(function (to, from, next) {
            if(self.loginUData !== null){
                if(to.matched.some((rec)=> rec.meta.admin)){
                    if(self.loginUData.type === "admin"){
                        next();
                    }else{
                        self.$router.push("/");
                    }
                }else{
                    next();
                }
            }else{
                self.$router.push("/");
            }
        });

        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                self.loginUID = user.uid;
            } else {
                self.compileProc = false;
                self.loginUID = "";
                self.$router.push('/login');
            }
        });
    },
    created: function () {
        let self = this;
        const db = firebase.database();
        self.usersRef = db.ref('/users');
    },
    data: {
        csrf: '',
        loginUID: "",
        loginUData: null,
        loadImgSrc: "",
        usersRef: null,
        compileProc: true
    },
    watch: {
        loginUID: function (val) {
            this.loginUserLoad(val);
        },
        loginUData: function (val) {
            let self = this;
            let checkRouteAuth = self.$route.matched.some(function (record) {
                return record.meta.requiresAuth;
            });
            let checkRouteAdmin = self.$route.matched.some(function (record) {
                return record.meta.admin;
            });
            let route = self.$route.path;
            if(val !== null){
                self.compileProc = false;
                if(checkRouteAuth){
                    if(checkRouteAdmin){
                        if(val.type === "admin"){
                            self.$router.push(route);
                        }else{
                            self.$router.push("/");
                        }
                    }else{
                        self.$router.push("/");
                    }
                }else{
                    self.$router.push("/");
                }
            }
        }
    },
    beforeMount: function () {
        this.csrf = this.$el.attributes.csrf.value;
    },
    methods: {
        isNumber: function (val, maxLength) {
            if (val !== "") {
                if (isNaN(val)) {
                    return val.substr(0, val.toString().length-1);
                } else {
                    if (val > maxLength) {
                        return val.substr(0, val.toString().length-1);
                    } else {
                        return val * 1;
                    }
                }
            } else {
                return 0;
            }
        },
        trim: function (val) {
            if(val.charAt(0) === " "){
                val = val.substr(1, val.length);
            }
            return val.replace(/\s{2,}/g, ' ');
        },
        loginUserLoad: function (uid) {
            let self = this;
            if(uid !== ""){
                self.compileProc = true;
                self.usersRef.orderByKey().equalTo(uid).on("value", function (snap) {
                    let data = snap.val();
                    let keys = Object.keys(data);
                    let item = data[keys[0]];
                    item["uid"] = keys[0];
                    self.loginUData = item;
                });
            }else{
                self.loginUData = null;
            }
        }
    }
}).$mount("#app");