function updatevariant(el,productname) {
    var addtocart = $(el).val().split(' | ');
    $('#shoppingcartbutton').attr('price',addtocart[1]);
    $('.price').html("&dollar; " + addtocart[1]);
    $('#shoppingcartbutton').attr('description',productname + ' ' + addtocart[0]);
};
Snipcart.execute('config', 'show_continue_shopping', true);