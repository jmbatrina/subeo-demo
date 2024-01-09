function loadAccountDB() {
    let account_db = JSON.parse(localStorage.getItem("subeo-accounts")) ??
        {"('juandelacruz','password')": {
            "email": "juandelacruz@example.com"
        }};

    return account_db;
}

function getUsernamesAndEmails(account_db) {
    var usernames = [];
    var emails = [];
    for (let [key, details] of Object.entries(account_db)) {
        let username = key.substring(2, key.indexOf("'", 2));
        let email = details["email"];

        if (username) usernames.push(username);
        if (email) emails.push(email);
    }

    return [usernames, emails];
}

function registerCredentials() {
    var username = document.getElementById("username")?.value ?? "";
    var password = document.getElementById("password")?.value ?? "";
    var confirm = document.getElementById("confirm-password")?.value ?? "";
    var email = document.getElementById("email")?.value ?? "";

    // NOTE: for simplicity, we just use the username and password as key
    // TODO: Use proper auth
    var key = `('${username}','${password}')`;
    console.log("account" + key)
    let [usernames, emails] = getUsernamesAndEmails(loadAccountDB());
    if (usernames.indexOf(username) != -1) {
        alert(`Account with username ${username} already exists. Please choose another username`);
        return;
    } else if (emails.indexOf(email) != -1) {
        alert(`An account has already been linked with the email ${email}. If you forgot your password, please contact Subeo support to retrieve your account`);
        return;
    } else if (password != confirm) {
        alert("Password and Confirm Password do not match.");
        return;
    }

    // TODO: make sure subeoID numbers are unique
    const maxNum = 9999999999;
    let subeoID = getRandomIntInclusive(0, maxNum).toString().padStart(maxNum.toString().length, "0")

    let accountInfo = {
        "username": username,
        "password": password,
        "email": email,
        "subeoID": subeoID
    }

    sessionStorage.setItem("subeo-newAccount-details", JSON.stringify(accountInfo));
    alert(sessionStorage.getItem("subeo-newAccount-details"));
    window.location.href = "signup-2.html";
}

function registerDetails(accountInfo) {
    let key =`('${accountInfo["username"]}','${accountInfo["password"]}')`;

    let detailIDs = ["first-name", "mid-name", "last-name", "age", "passenger-type"];
    let imgIDs = ["1by1ID", "proofID", "kycID"];
    let accountDetails = {}

    for (let infoKey of ["email", "subeoID"]) {
        accountDetails[infoKey] = accountInfo[infoKey];
    }

    for (let detailID of detailIDs) {
        accountDetails[detailID] = document.getElementById(detailID)?.value ?? "";
    }

    for (let imgID of imgIDs) {
        accountDetails[imgID] = document.getElementById(imgID)?.getAttribute("imgBase64") ?? "";
    }

    let addtlFields = {
        "Student": ["school", "student-num"],
        "Senior Citizen": ["senior-id-num"],
        "PWD": ["pwd-id-num"]
    }

    let passengerType = document.getElementById("passenger-type")?.value;
    for (let fieldID of addtlFields[passengerType]) {
        accountDetails[fieldID] = document.getElementById(fieldID)?.value ?? "";
    }

    // TODO: optimize by not requiring full reload/resave of DB
    console.log(accountDetails);
    let account_db = loadAccountDB();
    account_db[key] = accountDetails;
    localStorage.setItem("subeo-accounts", JSON.stringify(account_db));

    // TODO: make sure transaction numbers are unique
    const maxNum = 99999999;
    let transactionNumber = getRandomIntInclusive(0, maxNum).toString().padStart(maxNum.toString().length, "0")
    alert(`Your details have been submitted. Your transaction number is ${transactionNumber}. Kindly await confirmation email for your account)`);

    sessionStorage.setItem("subeo-newAccount-details", "");
    window.location.href = "index.html";
}

function passengerTypeChanged() {
    let passengerType = document.getElementById("passenger-type")?.value;
    document.getElementById("proof-id-label").innerText = `${passengerType} ID: `;
    document.getElementById("kyc-id-label").innerText = `Selfie with ${passengerType} ID: `;

    document.getElementById("div-proof-id").removeAttribute("hidden");

    for (let divID of ["student-fields", "senior-fields", "pwd-fields"]) {
        document.getElementById(divID)?.setAttribute("hidden", "");
    }

    let divID = {
        "Student": "student-fields",
        "Senior Citizen": "senior-fields",
        "PWD": "pwd-fields"
    }[passengerType];
    document.getElementById(divID)?.removeAttribute("hidden");
}

function addImagePreview(inputElemID) {
    let inputElem = document.getElementById(inputElemID);
    const imgElemID = `${inputElemID}-img`;
    inputElem?.insertAdjacentHTML("afterend",
    `<br>
    <img src="" id="${imgElemID}" height="300" hidden/>
    `);

    inputElem.addEventListener('change', (event) => {
        const reader = new FileReader();
        reader.readAsDataURL(event.target.files[0]);
        reader.addEventListener("load", () => {
            let imgElem = document.getElementById(imgElemID);
            imgElem.src = reader.result;
            imgElem.removeAttribute("hidden");

            const imgAsBase64 = reader.result.replace('data:', '').replace(/^.+,/, '');
            inputElem.setAttribute("imgBase64", imgAsBase64);
        });
    });
}


// FROM: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random#getting_a_random_integer_between_two_values_inclusive
function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min); // The maximum is inclusive and the minimum is inclusive
}
