import firebase from 'firebase'
import moment from 'moment'

import SimpleVueValidation from 'simple-vue-validator'
const Validator = SimpleVueValidation.Validator;

export default {
    created: function () {
        let self = this;

        const db = firebase.database();
        self.calendarEventsRef = db.ref('/calendar_events');
    },
    mounted: function () {
        let self = this;
        let addEventModel, modSelStartTime, modSelEndTime;
        $.getScript('/vendor/jquery-validation/jquery.validate.min.js', function (data, textStatus, jqxhr) {
            $.getScript('/vendor/fullcalendar/fullcalendar.min.js', function (data, textStatus, jqxhr) {
                $.getScript('/vendor/bootstrap-datetimepicker/bootstrap-datetimepicker.min.js', function (data, textStatus, jqxhr) {
                    addEventModel = $('#addEvent');
                    modSelStartTime = $('#sel_start_time');
                    modSelEndTime = $('#sel_end_time');

                    modSelStartTime.datetimepicker().on('dp.change', function (e) {
                        if(e.date){
                            self.start_time = moment(e.timestamp).toISOString();
                        }else{
                            self.start_time = '';
                        }
                    });
                    modSelEndTime.datetimepicker().on('dp.change', function (e) {
                        if(e.date){
                            self.end_time = moment(e.timestamp).toISOString();
                        }else{
                            self.end_time = '';
                        }
                    });

                    $('#full-calendar').fullCalendar({
                        buttonIcons: {
                            prev: 'fa fa-chevron-left',
                            next: 'fa fa-chevron-right'
                        },
                        header: {
                            left: 'prev,next today',
                            center: 'title',
                            right: 'month,agendaWeek,agendaDay'
                        },
                        events: function(start, end, timezone, callback){
                            self.calendarEventsRef.orderByChild('uid').equalTo(firebase.auth().currentUser.uid).once('value', function (snap) {
                                if(snap.numChildren() > 0){
                                    snap.forEach(function (event) {
                                        let item = event.val();
                                        self.data.push({
                                            id: event.key,
                                            title: item.title,
                                            start: item.start_time,
                                            end: item.end_time
                                        });
                                    });
                                }
                                console.log(self.data);
                                callback(self.data);
                            });
                        },
                        editable: true,
                        selectable: true,
                        selectHelper: true,
                        select: function(start, end, allDay) {
                            modSelStartTime.data("DateTimePicker").date(moment(start._d));
                            modSelEndTime.data("DateTimePicker").date(moment(end._d));
                            addEventModel.modal('show');
                        },
                    });
                });
            });
        });
    },
    data: function(){
        return {
            inProcess: false,
            errMsg: '',
            title: '',
            start_time: '',
            end_time: '',
            badge_type: 'Meeting',
            calendarEventsRef: null,
            data: []
        }
    },
    validators: {
        title: function (value) {
            return Validator.value(value).required().lengthBetween(3, 50);
        },
        start_time: function (value) {
            let msg = 'Invalid Date!';
            return Validator.value(value).required().maxLength(30, msg);
        },
        end_time: function (value) {
            let msg = 'Invalid Date!';
            return Validator.value(value).required().maxLength(30, msg);
        },
        badge_type: function (value) {
            return Validator.value(value).required().in(['Meeting', 'Reminder', 'Event'], 'Invalid Event Select!');
        },
    },
    methods: {
        addEvent: function () {
            let self = this;
            self.$validate().then(function (success) {
                if(success){
                    self.inProcess = true;
                    self.errMsg = '';
                    self.calendarEventsRef.push({
                        title: self.title,
                        start_time: self.start_time,
                        end_time: self.end_time,
                        badge_type: self.badge_type,
                        uid: firebase.auth().currentUser.uid,
                        createdAt: firebase.database.ServerValue.TIMESTAMP
                    }, function(err){
                        if (err) {
                            self.errMsg = err.message;
                            console.log(err);
                        } else {
                            self.errMsg = '';
                            self.title = '';
                            self.start_time = '';
                            self.end_time = '';
                            self.badge_type = 'Meeting';
                            self.validation.reset();
                            $('#addEvent').modal('hide');
                        }
                        self.inProcess = false;
                    });
                }
            });
        }
    }
}
