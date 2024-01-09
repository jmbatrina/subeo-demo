var account_db = localStorage.getItem("subeo-accounts") ?? {};

function login() {
    var username = document.getElementById("username")?.value ?? "";
    var password = document.getElementById("password")?.value ?? "";

    // NOTE: for simplicity, we just use the username and password as key
    // TODO: Use proper auth
    var key = `('${username}','${password}')`;
    console.log("account" + key)
    if ((key in account_db) || key === "('juandelacruz@example.com','password')") {
        window.location.href = "qr-generate.html";
    } else {
        alert("Incorrect username/password. If you have not been validated for discount yet, please sign up first.")
    }
}
