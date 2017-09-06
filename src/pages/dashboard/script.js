import dashboardLayout from '../../partials/layouts/dashboardLayout/dashboardLayout.vue'

export default {
    created: function () {
        let self = this;

        setTimeout(function () {
            $.getScript('/vendor/jquery-validation/jquery.validate.min.js', function (data, textStatus, jqxhr) {
                $.getScript('/vendor/fullcalendar/fullcalendar.min.js', function (data, textStatus, jqxhr) {
                    $.getScript('/assets/js/calender.js', function (data, textStatus, jqxhr) {
                        Calendar.init();
                    });
                });
            });

            $.getScript('/vendor/Chart.js/Chart.min.js', function (data, textStatus, jqxhr) {
                $.getScript('/assets/js/index.js', function (data, textStatus, jqxhr) {
                    ChartLoader.init();
                });
            });
        }, 100);
    },
    data: function(){
        return {

        }
    },
    methods: {

    },
    components: {
        dashboardLayout
    }
}