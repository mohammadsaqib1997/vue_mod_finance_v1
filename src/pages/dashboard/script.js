import dashboardLayout from '../../partials/layouts/dashboardLayout/dashboardLayout.vue'
import projectModel from '../../partials/components/modals/add_project/add_project.vue'
import calculatorModel from '../../partials/components/modals/calculator/calculator.vue'
import dashboardSearch from '../../partials/components/dashboard_search/dashboard_search.vue'
import calendarCom from '../../partials/components/full_calendar/full_calendar.vue'
import calculatorview from '../../partials/components/modals/calculator_info/calculator_info.vue'

export default {
    created: function () {
        let self = this;
    },
    mounted: function () {
        $.getScript('/vendor/Chart.js/Chart.min.js', function (data, textStatus, jqxhr) {
            $.getScript('/assets/js/index.js', function (data, textStatus, jqxhr) {
                ChartLoader.init();
            });
        });
    },
    data: function(){
        return {

        }
    },
    methods: {

    },
    components: {
        dashboardLayout,
        calculatorModel,
        projectModel,
        dashboardSearch,
        calendarCom,
        calculatorview
    }
}
