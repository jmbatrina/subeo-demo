let unvalidatedDB = JSON.parse(localStorage.getItem("subeo-unvalidated")) ?? {};
unvalidatedDB["11111111"] = Object.assign({"username":"juandelacruz","password":"password"}, hardcoded_jdlc);
localStorage.setItem("subeo-unvalidated", JSON.stringify(unvalidatedDB));

function showUnvalidatedAccountList() { // add information from LRT database
  // HACK: hardcoded list of field ids; from passenger side signup.js
  const unvalidatedDB = JSON.parse(localStorage.getItem("subeo-unvalidated")) ?? {};

  let validate_list = document.getElementById("validate-list");
  for (const transactionID of Object.keys(unvalidatedDB)) {
    let accountDetails = unvalidatedDB[transactionID];

    let div = document.createElement("div");
    let tID = document.createElement("b");
    tID.innerText = `Transaction #: ${transactionID}`;

    div.appendChild(tID);

    for (const detailID of ["username", "email", "subeoID"]) {
        let field = document.createElement("p");
        field.innerText = `${detailID}: ${accountDetails[detailID]}`;

        div.appendChild(field);
    }

    let button = document.createElement("button");
    button.innerText = "Check Details";
    button.onclick = () => {
        sessionStorage.setItem("subeo-currentValidationID", transactionID);
        window.location.href = "validate-details.html";
    };

    div.appendChild(button);
    div.appendChild(document.createElement("br"));
    div.appendChild(document.createElement("br"));

    validate_list.appendChild(div);
  }
}

showUnvalidatedAccountList();
