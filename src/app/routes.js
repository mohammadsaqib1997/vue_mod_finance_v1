import PageNotFound from '../pages/error/error.vue'
import app from './app.vue'

import loginLayout from '../partials/layouts/loginLayout/loginLayout.vue'
import login from '../pages/login/login.vue'

import dashboardLayout from '../partials/layouts/dashboardLayout/dashboardLayout.vue'
import dashboard from '../pages/dashboard/dashboard.vue'

import masterDetails from '../pages/master_files/master_details/master_details.vue'
import control from '../pages/master_files/chart_of_accounts/control/control.vue'
import subControl from '../pages/master_files/chart_of_accounts/sub_control/sub_control.vue'
import subsidiary from '../pages/master_files/chart_of_accounts/subsidiary/subsidiary.vue'

import listingControl from '../pages/master_listing/list_chart_of_accounts/list_control/list_control.vue'
import listingSubControl from '../pages/master_listing/list_chart_of_accounts/list_sub_control/list_sub_control.vue'
import listingSubsidiary from '../pages/master_listing/list_chart_of_accounts/list_subsidiary/list_subsidiary.vue'

import journalVoucher from '../pages/transaction_files/journal_voucher/journal_voucher.vue'

import postUnPost from '../pages/process/post_unpost/post_unpost.vue'

import createNewUser from '../pages/user_control/create_new_user/create_new_user.vue'
import editUser from '../pages/user_control/edit_user/edit_user.vue'
import profile from '../pages/profile/profile.vue'

import partyInformation from '../pages/party_information/party_information.vue'

import detailedLedger from '../pages/mis_reports/detailed_ledger/detailed_ledger.vue'
import balListControl from '../pages/mis_reports/balance_sheet/list_control/list_control.vue'
import balListSubControl from '../pages/mis_reports/balance_sheet/list_sub_control/list_sub_control.vue'
import balListSubsidiary from '../pages/mis_reports/balance_sheet/list_subsidiary/list_subsidiary.vue'
import tBalListControl from '../pages/mis_reports/trial_balance/list_control/list_control.vue'
import tBalListSubControl from '../pages/mis_reports/trial_balance/list_sub_control/list_sub_control.vue'
import tBalListSubsidiary from '../pages/mis_reports/trial_balance/list_subsidiary/list_subsidiary.vue'

const routes = [
    {
        path: '/',
        component: app,
        children: [
            {
                path: '',
                component: dashboardLayout,
                meta: {
                    requiresAuth: true
                },
                children: [
                    {
                        path: '',
                        component: dashboard
                    },
                    {
                        path: '/master_details',
                        component: masterDetails
                    },
                    {
                        path: '/create_control',
                        component: control
                    },
                    {
                        path: '/create_sub_control',
                        component: subControl
                    },
                    {
                        path: '/create_subsidiary',
                        component: subsidiary
                    },
                    {
                        path: '/listing_control',
                        component: listingControl
                    },
                    {
                        path: '/listing_sub_control',
                        component: listingSubControl
                    },
                    {
                        path: '/listing_subsidiary',
                        component: listingSubsidiary
                    },
                    {
                        path: '/detailed_ledger',
                        component: detailedLedger
                    },
                    {
                        path: '/balance_sheet/list_control',
                        component: balListControl
                    },
                    {
                        path: '/balance_sheet/list_sub_control',
                        component: balListSubControl
                    },
                    {
                        path: '/balance_sheet/list_subsidiary',
                        component: balListSubsidiary
                    },
                    {
                        path: '/trial_balance/list_control',
                        component: tBalListControl
                    },
                    {
                        path: '/trial_balance/list_sub_control',
                        component: tBalListSubControl
                    },
                    {
                        path: '/trial_balance/list_subsidiary',
                        component: tBalListSubsidiary
                    },
                    {
                        path: '/journal_voucher',
                        component: journalVoucher
                    },
                    {
                        path: '/post_unpost',
                        component: postUnPost,
                        meta: {
                            admin: true
                        }
                    },
                    {
                        path: '/create_new_user',
                        component: createNewUser,
                        meta: {
                            admin: true
                        }
                    },
                    {
                        path: '/edit_user/:id',
                        component: editUser,
                        meta: {
                            admin: true
                        }
                    },
                    {
                        path: '/profile',
                        component: profile
                    },
                    {
                        path: '/add_party',
                        component: partyInformation
                    }
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
                component: dashboardLayout,
                children: [
                    {
                        path: '',
                        component: PageNotFound
                    },
                ]
            }
        ]
    }
];

module.exports = routes;