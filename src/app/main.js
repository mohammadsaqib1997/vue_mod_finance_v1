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

/*const fromReq = '';
 router.beforeEach(function (to, from, next) {
 console.log(to.path);
 next();
 });*/

new Vue({
    router,
    beforeCreate: function () {
        let self = this;
        let checkRouteAuth = self.$route.matched.some(function (record) {
            return record.meta.requiresAuth;
        });
        let route = self.$route.path;
        firebase.auth().onAuthStateChanged(function (user) {
            self.compileProc = false;
            if (user) {
                if (checkRouteAuth) {
                    self.$router.push(route);
                } else {
                    self.$router.push('/');
                }
            } else {
                self.$router.push('/login');
            }
        });
    },
    data: {
        csrf: '',
        compileProc: true
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
        }
    }
}).$mount("#app");