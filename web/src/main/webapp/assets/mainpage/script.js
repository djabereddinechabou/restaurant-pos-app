var pageRole = "cashier";

var token = Cookies.get("POSRESTAURANT");
var config;
var baseUrl;
var serviceUrls = {};
var userData = {};
var tax = 5;
var itemIdToRemove;

var dataLists = {};
dataLists.categories = {};
dataLists.categories['all'] = {};
dataLists.items = {};
dataLists.itemOnSidebar= {};
var tableStructures = {
    user: ["id", "name", "role", "email", "restaurantId"],
    restaurant: ["id", "address", "phone"],
    category: ["id", "name", "description"],
    item: ["id", "name", "price", "categoryId", "status"],
    itemWithStock: ["itemId", "itemName","stock","price","categoryId"]
};
var tableHeaders = {
    user: ["#ID", "Name", "Role", "Email", "Restaurant", ""],
    restaurant: ["#ID", "Address", "Phone", ""],
    category: ["#ID", "Name", "Description", ""],
    item: ["#ID", "Item Name", "Price", "Category", "Status", ""]
};
var createRequestBody = {
    receipt: {

    },
    user: {
        "name": "#fullname",
        "email": "#email",
        "restaurantId": "#restaurant-id"
    },
    userIdentity: {
        "username": "#new-username",
        "password": "#password",
        "role": "input[name='role']:checked"
    },
    restaurant: {
        "address": "#address",
        "phone": "#phone"
    },
    category: {
        "name": "#category-name",
        "description": "#category-description"
    },
    item: {
        "name": "#item-name",
        "price": "#item-price",
        "categoryId": "#category-id",
        "status": "#item-status"
    },
    itemWithStock: {

    }
};

$(document).ready(function () {
    // Get configurations and check cookie
    (function () {
        if (token === undefined) {
            backToLoginPage("You are not logged in. Please login.");
        }

        var configUrl = "configurations.json";
        $.getJSON(configUrl, function (data) {
            config = data;
            baseUrl = config.baseUrl;
            serviceUrls.parser = baseUrl + config.endpoints.parser;
            serviceUrls.user = baseUrl + config.endpoints.user;
            serviceUrls.item = baseUrl + config.endpoints.item;
            serviceUrls.category = baseUrl + config.endpoints.category;
            serviceUrls.restaurant = baseUrl + config.endpoints.restaurant;
            serviceUrls.member = baseUrl + config.endpoints.member;
            serviceUrls.receipt = baseUrl + config.endpoints.receipt;
        }).done(function () {
            $.ajax(serviceUrls.parser, {
                method: "POST",
                contentType: "application/x-www-form-urlencoded",
                data: {token: token}
            })
                .success(function (data) {
                    userData = data.payload;
                    if (userData.role === pageRole) {
                        console.log("Logged in as an " + pageRole);
                        initializePage();
                    } else {
                        backToLoginPage("You are not logged in as an " + pageRole + ". Please login as an " + pageRole);
                    }
                })
                .fail(function () {
                    backToLoginPage("Your session is already expired. Please login again.");
                });
        });
    })();
});

// json http request
function getJSON(async, url, callback){
    $.ajax({
        type: 'GET',
        url: url,
        dataType: 'json',
        async: async,
        success: function (data) {
            callback(data)
        },
        error: function (e) {
            console.log(e.responseJSON.message);
            alert("Error GET Request! See log for further information")
        }
    });
}
function postJSON(async, url, data, callback){
    $.ajax(url, {
        data : JSON.stringify(data),
        contentType : 'application/json',
        type : 'POST',
        async : async,
        success: function (data){
            callback(data)
        },
        error: function (e) {
            console.log(e.responseJSON.message);
            alert("Error POST Request! See log for further information")
        }
    });
}
function putJSON(async, url, data, callback){
    $.ajax(url, {
        data : JSON.stringify(data),
        contentType : 'application/json',
        type : 'PUT',
        async : async,
        success: function (data){
            callback(data)
        },
        error: function (e) {
            console.log(e.responseJSON.message);
            alert("Error PUT Request! See log for further information")
        }
    });
}
function deleteJSON(async, url, callback){
    $.ajax(url, {
        contentType : 'application/json',
        type : 'DELETE',
        async : async,
        success: function (data){
            callback(data)
        },
        error: function (e) {
            console.log(e.responseJSON.message);
            alert("Error PUT Request! See log for further information")
        }
    });
}

function backToLoginPage(message) {
    alert(message);
    window.location.replace(config.pages.login);
}

// Initialize all functionality
function initializePage() {
    loadNavbar();
    $('.tax').each(function(){
        $(this).text(tax);
    });
    $('ul.CTAs').hide();
    document.title = pageRole + " Page";
    if(pageRole === "admin") {

    } else if (pageRole === "manager"){

    } else if (pageRole === 'cashier'){
        loadNavCategory();
        loadItemByCategoryId("all");
    }
}
function loadNavbar() {
    $('#navbar-container').load('template/navbar.html', function(){
        console.log("load navbar");
        setNavbar();
    });
}

// Set navbar username
function setNavbar() {
    getJSON(true,serviceUrls.user+"/"+userData.id,function (data) {
        userData.userInfo = data.payload;
        var restaurantId = userData.userInfo.restaurantId;
        getJSON(true, serviceUrls.restaurant+"/"+restaurantId,function (data) {
            userData.restaurantInfo = data.payload;
            $("#page-role > a")
                .text(pageRole + " Page")
                .attr("href",pageRole+"page.html");
            $("#user-name > a").text(userData.username);
            if(pageRole == "admin"){
                $("#restaurant-id").remove();
                $("#restaurant-phone").remove();
            } else {
                $("#restaurant-id > a > span").text(userData.restaurantInfo.id);
                $("#restaurant-phone > a").text(userData.restaurantInfo.phone);
            }
        });
    });
}

function itemToHTML(item){
    var result = "<div class='item-"+item.itemId+" item col-md-3 pointer' onclick='addItem("+item.itemId+")'>" +
        "<div class='well dash-box'>" +
        "<h4 class='title-item'>"+item.itemName+"</h4>" +
        "<div>Stock : <span class='item-stock-"+item.itemId+"'>"+item.stock+"</span></div>" +
        "<div>Rp "+item.price+"</div>"+
        "</div>" +
        "</div>";
    return result;
}
function loadItemByCategoryId(id) {
    var url;
    if(id === "all"){
        url = serviceUrls.item;
    } else {
        url = serviceUrls.category+"/"+id+"/items";
    }
    if(dataLists.categories[id].items){
        console.log("Already loaded");
        return;
    } else {
        getJSON(true, url, function (data) {
            var payload = data.payload;
            var items = [];
            dataLists.categories[id].items = {};
            payload.forEach(function (item) {
                dataLists.categories[id].items[item.id] = item;
                if(!dataLists.items[item.itemId]) {
                    dataLists.items[item.itemId] = item;
                }
                items.push(
                    itemToHTML(item)
                )
            });
            console.log(dataLists);
            $("#category-panel-" + id).empty().append(items);
            renderMain();
        });
    }
}

function categoryToHTML(category) {
    var catId = "category-panel-"+category.id;
    var result =
        "<li>"+
        "<a href='#"+catId+"' data-toggle='tab' onclick='loadItemByCategoryId("+category.id+")'>"+
        category.name+
        "</a>"+
        "</li>";

    return result;
}
function categoryPanelToHTML(id){
    var result = "<div class='tab-pane fade' id='category-panel-"+id+"'></div>";
    return result;
}

function loadNavCategory() {
    getJSON(true,serviceUrls.category, function (data) {
        var payload = data.payload;
        var categories = [];
        var categoryPanels = [];
        payload.forEach(function(category){
            dataLists.categories[category.id] = category;
            categories.push(
                categoryToHTML(category)
            );
            categoryPanels.push(
                categoryPanelToHTML(category.id)
            )
        });

        $("#nav-categories").append(categories);
        $("#tab-panel-main").append(categoryPanels);
    });
}

function addItem(id){
    console.log(id);
    if(dataLists.itemOnSidebar[id]){
        dataLists.itemOnSidebar[id].count+=1;
    } else {
        dataLists.itemOnSidebar[id] = {
            "itemId": id,
            "count": 1
        };
    }
    dataLists.items[id].stock-=1;
    renderSidebar();
    renderMain();
}

function renderSidebar(){
    var itemSidebarList = [];
    var totalPrice = 0;
    var totalCount = 0;
    var totalPriceAfterTax;
    if(dataLists.itemOnSidebar.length == 0){
        $('ul.CTAs').hide();
    } else {
        $('ul.CTAs').show();
    }
    $.each(dataLists.itemOnSidebar, function (key,val) {
        itemSidebarList.push(itemOnSidebarToHTML(val));
        totalCount+=val.count;
        totalPrice+=val.count*dataLists.items[key].price;
    });
    totalPriceAfterTax = totalPrice*(100+tax)/100;

    totalPriceAfterTax = totalPrice*(100+tax)/100;
    $('#item-on-sidebar').empty().append(itemSidebarList);
    $('.total-count').each(function(){
        $(this).text(totalCount);
    });
    $('.total-price').each(function(){
        $(this).text(totalPrice);
    });
    $('.total-price-after-tax').each(function () {
        $(this).text(totalPriceAfterTax);
    });
}

function invokeIdToRemove(id){
    itemIdToRemove = id;
}

function removeOne() {
    dataLists.items[itemIdToRemove].stock+=1;
    dataLists.itemOnSidebar[itemIdToRemove].count-=1;
    renderSidebar();
    renderMain();
}

function removeById() {
    dataLists.items[itemIdToRemove].stock+=dataLists.itemOnSidebar[itemIdToRemove].count;
    delete dataLists.itemOnSidebar[itemIdToRemove];
    renderSidebar();
    renderMain();
}

function itemOnSidebarToHTML(itemOnSidebar){
    var id = itemOnSidebar.itemId;
    var cnt = itemOnSidebar.count;
    var result = "<li data-toggle='modal' data-target='#modal-remove-id' onclick='invokeIdToRemove("+id+")'>"+
        "<a href='#'>"+
        dataLists.items[id].itemName +
        "<ul class='list-inline' style='float:right'>"+
        "<li><span class='badge' style='background:#bf360c'>"+cnt+"</span></li>"+
        "<li>Rp "+dataLists.items[id].price*cnt+"</li>"+
        "</ul>"+
        "</a>"+
        "</li>";
    return result;
}

function renderMain(){
    $.each(dataLists.items, function (key,val) {
        $('.item-stock-'+key).each(function(){
            $(this).text(dataLists.items[key].stock);
        });
    });
}

function removeAll(){
    (function() {
        $.each(dataLists.itemOnSidebar, function (key,val) {
            dataLists.items[key].stock+=val.count;
        });
    })();

    dataLists.itemOnSidebar = {};
    renderSidebar();
    renderMain();
}

function itemOnReceiptToHTML(item) {
    var id = item.itemId;
    var cnt = item.count;
    var result = "<tr>"+
        "<td>"+dataLists.items[id].itemName+"</td>"+
        "<td>"+cnt+"</td>"+
        "<td>Rp "+dataLists.items[id].price*cnt+"</td>"+
        "</tr>";
    return result;
}
function renderReceipt(){
    var itemReceiptList = [];
    $.each(dataLists.itemOnSidebar, function (key,val) {
        itemReceiptList.push(itemOnReceiptToHTML(val));
    });
    $('#receipt-items').empty().append(itemReceiptList);
}