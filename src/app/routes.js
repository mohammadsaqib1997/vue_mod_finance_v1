import PageNotFound from '../pages/error/error.vue'
import app from './app.vue'

import loginLayout from '../partials/layouts/loginLayout/loginLayout.vue'
import login from '../pages/login/login.vue'

import dashboardLayout from '../partials/layouts/dashboardLayout/dashboardLayout.vue'
import dashboard from '../pages/dashboard/dashboard.vue'

/*import parentComLayout from '../partials/layouts/parentComLayout/parentComLayout.vue'
import addDriver from '../pages/add_driver/add_driver.vue'
import driverList from '../pages/driver_listing/driver_listing.vue'
import driverListDeactive from '../pages/driver_listing_deactive/driver_listing_deactive.vue'
import profile from '../pages/profile/profile.vue'

import userList from '../pages/user_listing/user_listing.vue'
import user_profile from '../pages/user_profile/user_profile.vue'

import completedRequests from '../pages/completed_req/completed_req.vue'
import pendingRequests from '../pages/pending_req/pending_req.vue'
import newRequests from '../pages/new_req/new_req.vue'

import userAccount from '../pages/user_account/user_account.vue'
import driverAccount from '../pages/driver_account/driver_account.vue'*/

const routes = [
    {
        path: '/',
        component: app,
        children: [
            {
                path: '',
                component: dashboardLayout,
                children: [
                    {
                        path: '',
                        component: dashboard
                    }/*,
                    {
                        path: 'users',
                        component: parentComLayout,
                        children: [
                            {path: '', component: userList},
                            {path: 'profile/:id', component: user_profile}
                        ]
                    },
                    {
                        path: 'drivers',
                        component: parentComLayout,
                        children: [
                            {path: '', component: driverList},
                            {path: 'requests', component: driverListDeactive},
                            {path: 'profile/:id', component: profile},
                            {path: 'add_driver', component: addDriver}
                        ]
                    },
                    {
                        path: 'requests',
                        component: parentComLayout,
                        children: [
                            {path: 'new_requests', component: newRequests},
                            {path: 'completed', component: completedRequests},
                            {path: 'pending', component: pendingRequests}
                        ]
                    },
                    {
                        path: 'accounts',
                        component: parentComLayout,
                        children: [
                            {path: 'user', component: userAccount},
                            {path: 'driver', component: driverAccount}
                        ]
                    }*/
                ]
            },
            {
                path: 'login',
                component: loginLayout,
                children: [
                    {path: '', component: login},
                ]
            },
            {
                path: '*',
                component: PageNotFound
            }
        ]
    }
];

module.exports = routes;