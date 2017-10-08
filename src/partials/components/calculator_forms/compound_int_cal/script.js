import func from '../../../../../custom_libs/func'

import SimpleVueValidation from 'simple-vue-validator'
const Validator = SimpleVueValidation.Validator;

export default {
    created: function () {
        let self = this;
    },
    data: function(){
        return {
            init_invest: '',
            monthly_add: '',
            interest_rate: '',
            payments_time: '',
        }
    },
    validators: {
        'init_invest': function (value) {
            return Validator.value(value).required().greaterThan(0, 'Greater than 0!');
        },
        'monthly_add': function (value) {
            return Validator.value(value).required().greaterThan(0, 'Greater than 0!');
        },
        'interest_rate': function (value) {
            return Validator.value(value).required().greaterThan(0, 'Greater than 0!');
        },
        'payments_time': function (value) {
            return Validator.value(value).required().greaterThan(0, 'Greater than 0!');
        },

    },
    watch: {
        init_invest: function (val) {
            this.init_invest = func.isNumber(val, 10, '');
        },
        monthly_add: function (val) {
            this.monthly_add = func.isNumber(val, 10, '');
        },
        interest_rate: function (val) {
            this.interest_rate = func.isNumber(val, 2, '');
        },
        payments_time: function (val) {
            this.payments_time = func.isNumber(val, 2, '');
        },
    },
    methods: {
        resetFields: function () {
            let self = this;
            self.init_invest = '';
            self.monthly_add = '';
            self.interest_rate = '';
            self.payments_time = '';
            self.validation.reset();
            self.$emit('calculate', {
                fv: Number(0).toFixed(2),
                totInt: Number(0).toFixed(2)
            });
        },
        calculate: function () {
            let self = this;
            let int_sel = self.interest_select;
            let int_data = self.int_sel_data;
            let fields = self.fields;
            self.$validate().then(function (success) {
                if (success) {
                    let i = self.interest_rate;
                    if (i > 1.0) {i = self.interest_rate / 100} else {i = self.interest_rate}
                    i /= 12;
                    let ma = eval(self.monthly_add);
                    let prin = eval(self.init_invest);
                    let pmts = eval(self.payments_time * 12);
                    let count = 0;

                    while(count < pmts) {
                        let newprin = prin + ma;
                        prin = (newprin * i) + eval(prin + ma);
                        count = count + 1;
                    }

                    let totinv = eval(count * ma) + eval(self.init_invest);
                    let future_value = Number(prin).toFixed(2);
                    let total_interest = Number(eval(prin - totinv)).toFixed(2);

                    self.$emit('calculate', {
                        fv: future_value,
                        totInt: total_interest
                    });
                }
            });
        }
    },
}

/*

 function computeForm(form) {

 if ((form.payments.value == null || form.payments.value.length == 0) ||
 (form.moAdd.value == null || form.moAdd.value.length == 0) ||
 (form.interest.value == null || form.interest.value.length == 0) ||
 (form.principal.value == null || form.principal.value.length == 0)) {
 return;
 }

 if (!checkNumber(form.interest, .001, 99, "Interest Rate") ||
 !checkNumber(form.payments, 1, 99, "Years") ||
 !checkNumber(form.moAdd, 0, 10000000, "Monthly Addition") ||
 !checkNumber(form.principal, 10, 10000000, "Initial Investment")) {
 return;
 }

 var i = form.interest.value;
 if (i > 1.0) {i = form.interest.value / 100} else {i = form.interest.value};
 i /= 12;
 var ma = eval(form.moAdd.value);
 var prin = eval(form.principal.value);
 var pmts = eval(form.payments.value * 12);
 var count = 0;

 while(count < pmts) {
 newprin = prin + ma;
 prin = (newprin * i) + eval(prin + ma);
 count = count + 1;
 }

 form.fv.value = prin;
 var totinv = eval(count * ma) + eval(form.principal.value);
 form.totalint.value = eval(prin - totinv);
 }

*/

//find_A visible fields
// p, r, t

//find_P visible fields
// a, r, t

//find_r visible fields
// a, p, t

//find_t visible fields
// a, p, r
