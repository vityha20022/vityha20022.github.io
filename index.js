function store(){
    var input = document.getElementById("username");
    var username = input.value;
    var rememberMe = document.querySelector('input[type=checkbox]');

    if (rememberMe.checked)
    {
        localStorage["rememberName"] = username;
    }
    else
    {
        localStorage.removeItem("rememberName");
    }

    if(username === ""){
        window.alert("Input your username!");
    }else{
        localStorage["snake.username"] = input.value;
        window.location.href = "./main.html";
    }
}

function read(){
    if(localStorage.hasOwnProperty("rememberName"))
    {
        var rememberMe = document.querySelector('input[type=checkbox]');
        rememberMe.checked = true;
        let rememberName = localStorage.getItem("rememberName");
        let currentName = document.getElementById("username");
        currentName.value = rememberName;
    }
}
