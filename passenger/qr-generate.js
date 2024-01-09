var autofill = JSON.parse(localStorage.getItem("autofill")) ?? {}
var currentFormName = "";

var qrcode = new QRCode(document.getElementById("qrcode"), {
    width : 300,
    height : 300
});

function makeCode (passengerType, answers) {
    // var elText = document.getElementById("text");
    //
    // if (!elText.value) {
    //     alert("Input a text");
    //     elText.focus();
    //     return;
    // }
    out = "";
    for (ans of answers) {
        out += `${ans},`;
    }

    if (out === "") out = ",";

    template = `START:1.0,ANS,LRTA,discount-${passengerType},${out}END:Subeo,1.0.0`

    qrcode.makeCode(template);
}
//
// makeCode([...Array(num_qs).keys()].map(i => i + 1));
//
// $("#text").
//     on("blur", function () {
//         makeCode();
//     }).
//     on("keydown", function (e) {
//         if (e.keyCode == 13) {
//             makeCode();
//         }
//     });
// END: Sample code from https://davidshimjs.github.io/qrcodejs/

num_qs = 0;
function addQuestionField(qidx, q, autofill) {
    qdiv = document.getElementById("questions");
    ++num_qs;

    div = document.createElement("div");
    div.setAttribute("id", `q-${num_qs}`);
    qdiv.appendChild(div)

    question = document.createElement("b")
    question.setAttribute("id", `question-${num_qs}`);
    question.innerText = q["Name"];

    const type = q["Type"];
    var answer;
    switch (type) {
        case "Choice":
            answer = document.createElement("select");
            break;
        default:
            answer = document.createElement("input");
    }

    answer.setAttribute("id", `answer-${num_qs}`);
    answer.setAttribute("data-qidx", qidx);
    answer.setAttribute("data-type", type);

    switch (type) {
        case "Date":
            answer.setAttribute("type", "date");
            answer.setAttribute("width", "200");
            answer.setAttribute("height", "100");

            // answer.setAttribute("value", autofill);
            // TODO: Remove hardcoded autofill to Today's date'
            answer.setAttribute("value", new Date().toISOString().split("T", 1)[0]);

            break;
        case "Image":
            answer.setAttribute("type", "image");
            answer.setAttribute("src", autofill);
            break;
        case "Choice":
            var opt_idx = 1;
            for (var choice of q["Choices"]) {
                var opt = document.createElement("option"); opt.value = opt_idx++;
                opt.innerHTML = choice;

                if (opt.value === autofill) {
                    opt.setAttribute("selected", "");
                }
                answer.appendChild(opt);
            }
            break;
        case "String":
        default:
            answer.setAttribute("type", "text");
            answer.setAttribute("value", autofill);
            break;
    }

    div.appendChild(question);
    div.appendChild(document.createElement("br"));
    div.appendChild(answer);
    div.appendChild(document.createElement("br"));
}

function clearQuestionFields() {
    qdiv = document.getElementById("questions");
    while (qdiv.hasChildNodes()) {
        qdiv.removeChild(qdiv.lastChild);
    }
    num_qs = 0;
}

function loadQuestions(indices) {
    var questions = JSON.parse(qs);
    var out = [];

    const noIndices = (indices ?? null) == null;
    if (noIndices) {
        out = questions;
    } else {
        for (var idx of indices) {
            out.push(questions[idx]);
        }
    }

    return out;
}

function showQuestions(formName, indices) {
    clearQuestionFields();

    // TODO: ALL questions loaded to preserve index (needed for autofill), but this is inefficient
    const questions = loadQuestions();

    for (var idx of indices) {
        addQuestionField(idx, questions[idx-1], autofill[idx] ?? "");
    }

    currentFormName = formName;
    document.getElementById("form-name").innerText = `(${formName})`;
}

// const fs = require("fs");
function saveQuestions() {
    // var questions = [];
    // for (var i=1; i <= num_qs; ++i) {
    //     questions.push(document.getElementById(`answer-${i}`).value);
    // }
    //
    // fs.writeFile("../central_db/question_db.json", `data=${JSON.stringify(questions)};`, (err) => {if (err) throw err;});
}

function getQuestionIndices(rawIndices) {
    out = [];
    for (var rawIdx of rawIndices) {
        out.push(parseInt(rawIdx.substring(1)));
    }

    return out;
}

function getAnswers() {
    var qdiv = document.getElementById("questions");
    var answers = [];
    for (var i=1; i <= num_qs; ++i) {
        var ans_field = document.getElementById(`answer-${i}`);
        const ans_qidx = ans_field.getAttribute("data-qidx");

        var ans_val;

        switch (ans_field.getAttribute("data-type")) {
            case "Image":
                // TODO: Implement
                break;
            case "Choice":
            case "Date":
            case "String":
            default:
                ans_val = ans_field.value;
                break;
        }
        answers.push(ans_val);

        // update autofill value
        autofill[ans_qidx] = ans_val;
        localStorage.setItem("autofill", JSON.stringify(autofill));
    }
    console.log("AUTOFILL AFTER", autofill);

    return answers;
}


// START: Sample code from https://blog.minhazav.dev/research/html5-qrcode.html
function onScanSuccess(decodedText, decodedResult) {
    // Handle on success condition with the decoded text or result.
    console.log(`Scan result: ${decodedText}`, decodedResult);

    var decodedFields = decodedText.split(",");
    console.log(decodedFields);
    var formName = decodedFields[3];
    if (formName.startsWith(formNamePrefix)) {
        formName = formName.substring(formNamePrefix.length);
        if (presets[formName] === undefined) {
            console.warn(`Unknown form ${formName}`)
        }
    } else {
        console.warn(`QR is for another form ${formName}`);
    }

    indices = [];
    for (field of decodedFields.slice(4)) {
        if (field.startsWith("END:")) {
            break;
        }

        if (field.startsWith("Q"))
            indices.push(parseInt(field.slice(1)))
    }

    console.log("rawIndices", indices);
    console.log("formName", formName);
    console.log("formIndices", presets[formName]);
    if (indices === presets[formName]) {
        console.warn("Supplied question indices did not match form preset indices");
    };

    html5QrcodeScanner.clear();
    showQuestions(formName, indices);
    setTimeout(createScanner, 0);
}

function onScanError(errorMessage) {
    // handle on error condition, with error message
    console.log(`Scan ERROR: ${errorMessage}`);
}

var html5QrcodeScanner;
function createScanner() {
    // global var
    html5QrcodeScanner = new Html5QrcodeScanner(
        "reader", { fps: 10, qrbox: 250 });
    html5QrcodeScanner.render(onScanSuccess);
}
// createScanner();
// END: Sample code from https://blog.minhazav.dev/research/html5-qrcode.html


// from lrt/index.js
function createPresetButtons(presets) {
    div = document.getElementById("presets");
    for (const preset in presets) {
        console.log(preset, presets[preset]);;
        button = document.createElement("input");
        button.setAttribute("type", "button");
        button.setAttribute("value", preset);
        button.onclick = () => {
            console.log("CLICKED " + preset + presets[preset])
            showQuestions(preset, presets[preset]);
        };

        div.appendChild(button);
    }
}

function generateAnswerQR() {
    let accountDetails = JSON.parse(sessionStorage.getItem("subeo-activeUser-details"));
    // makeCode(currentFormName, getAnswers());
    // TODO: Don't hardcode this conversion matrix (should probably be in question db)
    const passengerType = accountDetails["passenger-type"];
    const formName = {
        "Student": "Student With Prevalidation",
        "Senior Citizen": "Senior With Prevalidation",
        "PWD": "PWD With Prevalidation"
    }[passengerType];
    console.log("FORMNAME", formName, accountDetails);

    const questions = loadQuestions();

    let answers = []
    for (var idx of presets[formName]) {
        console.log(questions[idx-1]);
        answers.push(accountDetails[questions[idx-1]["Name"]]);
    }

    console.log(answers);
    makeCode(passengerType, answers);
    document.getElementById("passenger-id").innerText = accountDetails["subeoID"];
}

// createPresetButtons(presets);
const defaultForm = "Student";
// showQuestions(defaultForm, presets[defaultForm]);


function loadAccountDB() {
    let account_db = JSON.parse(localStorage.getItem("subeo-accounts")) ?? {};
    acoount_db["('juandelacruz','password')"] = {
        "email": "juandelacruz@example.com",
        "subeoID": "6373681652",
        "first-name": "Juan",
        "mid-name": "",
        "last-name": "de la Cruz",
        "age": "18",
        "passenger-type": "Student",
        "1by1ID": "",
        "proofID": "",
        "kycID": "",
        "school": "Polytechnic University of The Philippines",
        "student-num": "201920377"
    };

    return account_db;
}


generateAnswerQR();
