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
    }
}).$mount("#app");