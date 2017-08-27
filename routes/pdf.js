var express = require('express');
var router = express.Router();
var conversion = require('phantom-html-to-pdf')();

router.get('/1', function (req, res, next){
    res.render('pdf_templates/template_one', {heading: "Check 1"}, function(errJade, html){
        conversion({ html: html }, function(err, pdf) {
            console.log(pdf.logs);
            console.log(pdf.numberOfPages);
            pdf.stream.pipe(res);
        });
    });
});

module.exports = router;