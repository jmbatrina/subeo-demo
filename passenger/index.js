var account_db = JSON.parse(localStorage.getItem("subeo-accounts")) ?? {};

function login() {
    var username = document.getElementById("username")?.value ?? "";
    var password = document.getElementById("password")?.value ?? "";

    // NOTE: for simplicity, we just use the username and password as key
    // TODO: Use proper auth
    var key = `('${username}','${password}')`;
    console.log("account" + key)
    if (Object.keys(account_db).indexOf(key) != -1 || key === "('juandelacruz','password')") {
        alert(`Welcome back ${username}!`)
        sessionStorage.setItem("subeo-activeUser", key);
        sessionStorage.setItem("subeo-activeUser-details", JSON.stringify(account_db[key]));
        window.location.href = "qr-generate.html";
    } else {
        alert("Incorrect username/password. If you have not been validated for discount yet, please sign up first.")
    }
}
