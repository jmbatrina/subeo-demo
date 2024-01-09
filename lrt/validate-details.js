let unvalidatedDB = JSON.parse(localStorage.getItem("subeo-unvalidated")) ?? {};
unvalidatedDB["11111111"] = Object.assign({"username":"juandelacruz","password":"password"}, hardcoded_jdlc);
localStorage.setItem("subeo-unvalidated", JSON.stringify(unvalidatedDB));

const transactionID = sessionStorage.getItem("subeo-currentValidationID");

function populateInfoDiv(divID, fields) {
  var ansdiv = document.getElementById(divID);

  var orig_idx = -1;
  var dest_idx = -1;
  for (var q of fields) {
    const type = q["Type"];
    const q_name = q["Label"];
    var raw_ans = q["Answer"];

    var anscontent;
    switch (type) {
      case "Image":
        anscontent = document.createElement("div");
        var img = document.createElement("img");
        img.setAttribute("src", `data:image/png;base64,${raw_ans}`);
        anscontent.appendChild(document.createElement("br"));
        anscontent.appendChild(img);

        break;
      case "Choice":
        const opt_idx = parseInt(raw_ans)-1;
        raw_ans = q["Choices"][opt_idx];
        // TODO: remove hardcoded detection of orig-dest pair
        if (q_name === "Destination") {
          dest_idx = opt_idx
          console.log("Found dest", opt_idx, raw_ans);
        } else if (q_name === "Station of Origin") {
          orig_idx = opt_idx;
          console.log("Found orig", opt_idx, raw_ans);
        }
      case "Date":
      case "String":
      default:
        anscontent = document.createElement("b");
        anscontent.innerText = `${raw_ans}`;
        break;
    }
    var qtext = document.createElement("label");
    qtext.innerText = `${q_name}: `;

    ansdiv.appendChild(qtext);
    ansdiv.appendChild(anscontent);
    ansdiv.appendChild(document.createElement("br"));
  }
}

function showAccountForValidation(transactionID) { // add information from LRT database
  // HACK: hardcoded list of field ids; from passenger side signup.js
  const unvalidatedDB = JSON.parse(localStorage.getItem("subeo-unvalidated")) ?? {};
  if (Object.keys(unvalidatedDB).indexOf(transactionID) == -1) {
    alert(`There seems to be no Subeo application with transaction number ${transactionID}`);
    // window.location.href = "validate.html";
    return;
  }

  let accountDetails = unvalidatedDB[transactionID];

  let detailIDs = {"first-name": "First Name", "mid-name": "Middle Name", "last-name": "Last Name",
    "age": "Age", "passenger-type": "Passenger Type", "email": "Email", "subeoID": "Passenger Subeo ID"};
    let imgIDs = {"1by1ID": "1x1 ID", "proofID": `${accountDetails["passenger-type"]} ID`, "kycID": `Selfie with ${accountDetails["passenger-type"]} ID`};

    let raw_anslist = [];
    raw_anslist.push({"Label": "Transaction #", "Answer": transactionID});

    for (let detailID of Object.keys(detailIDs)) {
      raw_anslist.push({"Label": detailIDs[detailID], "Answer": accountDetails[detailID]});
    }

    for (let imgID of Object.keys(imgIDs)) {
      raw_anslist.push({"Type": "Image", "Label": imgIDs[imgID], "Answer": accountDetails[imgID]});
    }


    populateInfoDiv("validate-details", raw_anslist);
}

function validateApplication(accept) {
    const unvalidatedDB = JSON.parse(localStorage.getItem("subeo-unvalidated")) ?? {};
    let applicationDetails = unvalidatedDB[transactionID];
    const username = applicationDetails["username"];
    const password = applicationDetails["password"];
    const email = applicationDetails["email"];

    if (accept) {
        alert(`${username} is now a validated Subeo user. Confirmation email sent to ${email}`);
    } else {
        alert(`Please send reason for rejection to ${email}`);
        const accountDB = JSON.parse(localStorage.getItem("subeo-accounts")) ?? {};
        var key = `('${username}','${password}')`;
        console.log(key);
        alert("return now if you don't want deletion");
        delete accountDB[key];
        localStorage.setItem("subeo-accounts", JSON.stringify(accountDB));
        alert("return now if you don't want deletion");
    }

    window.location.href = "validate.html"
    delete unvalidatedDB[transactionID];
    localStorage.setItem("subeo-unvalidated", JSON.stringify(unvalidatedDB));
}


showAccountForValidation(transactionID);
