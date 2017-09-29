import Vue from 'vue'
import VueRouter from 'vue-router'
import VueResource from "vue-resource"
import VueSession from "vue-session"
import SimpleVueValidation from 'simple-vue-validator'
import firebase from 'firebase'

import config_fb from '../../config/private.json'
firebase.initializeApp(config_fb.config_fb);

import routes from './routes'

Vue.use(VueSession);
Vue.use(VueRouter);
Vue.use(VueResource);
Vue.use(SimpleVueValidation);

const router = new VueRouter({
    mode: 'history',
    routes
});

new Vue({
    router,
    created: function () {
        let self = this;
        const db = firebase.database();
        self.usersRef = db.ref('/users');

        if(!self.routeCond){
            self.routeCond = true;
            self.$router.beforeEach(function (to, from, next) {
                let route = to.path;
                if(to.matched.some((rec)=>rec.meta.requiresAuth)){
                    if(self.loginUData !== null){
                        if(to.matched.some((rec)=>rec.meta.admin)){
                            if(self.loginUData.type === "admin"){
                                next();
                            }else{
                                self.$router.push('/');
                            }
                        }else{
                            next();
                        }
                    }else{
                        self.$router.push('/login');
                    }
                }else{
                    if(route === "/login"){
                        if(self.loginUData === null){
                            next();
                        }else{
                            self.$router.push('/');
                        }
                    }else{
                        next();
                    }
                }
            });
        }

        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                self.$session.start();
                let userObj = {
                    uid: user.uid,
                    lock: false
                };
                self.$session.set('loginUser', userObj);
                self.loginUID = user.uid;
            } else {
                self.$session.destroy();
                self.compileProc = false;
                self.loginUID = "";
                self.loginUData = null;
                self.$router.push('/login');
            }
        });
    },
    data: {
        csrf: '',
        userLoginEmit: false,
        loginUID: "",
        loginUData: null,
        loadImgSrc: "",
        usersRef: null,
        compileProc: true,
        routeCond: false,
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
            self.compileProc = false;
            if(checkRouteAuth){
                if(val === null){
                    self.$router.push('/login');
                }else{
                    if(checkRouteAdmin){
                        if(val.type !== "admin"){
                            self.$router.push('/');
                        }
                    }
                }
            }else{
                if(route === "/login"){
                    if(val !== null){
                        self.$router.push('/');
                    }
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