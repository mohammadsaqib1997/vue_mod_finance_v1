import simpleIntCal from '../../calculator_forms/simple_int_cal/calculator.vue'
import compoundIntCal from '../../calculator_forms/compound_int_cal/calculator.vue'

export default {
    created: function () {
        let self = this;

    },
    data: function(){
        return {
            simple_res: Number(0).toFixed(2),
            comp_fv_res: Number(0).toFixed(2),
            comp_iv_res: Number(0).toFixed(2),
        }
    },
    methods: {
        showSimpleResult: function (res) {
            this.simple_res = res;
        },
        showCompoundResult: function (res) {
            this.comp_fv_res = res.fv;
            this.comp_iv_res = res.totInt;
        }
    },
    components: {
        simpleIntCal,
        compoundIntCal
    }
}
