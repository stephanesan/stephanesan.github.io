(function ($, window, document) {
    $(function (){
        $('.cover').mosaic({
            animation   :   'slide',    //fade or slide
            hover_x     :   '300px'     //Horizontal position on hover
        });
        $('.fade').mosaic({
            animation   :   'fade',    //fade or slide
            hover_x     :   '300px'     //Horizontal position on hover
        });
    });
})(jQuery, window, document);  // ends all functions