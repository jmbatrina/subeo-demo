
// num_qs = 0;
// function addQuestionField(q) {
//     var q_name = q["Name"];
//     var q_type = q["Type"] ?? "String";
//
//     qdiv = document.getElementById("questions");
//     ++num_qs;
//
//     div = document.createElement("div");
//     div.setAttribute("id", `q-${num_qs}`);
//     qdiv.appendChild(div)
//
//     chk = document.createElement("input")
//     chk.setAttribute("id", `chk-${num_qs}`);
//     chk.setAttribute("type", "checkbox");
//     chk.setAttribute("disabled", "");
//
//     text = document.createElement("input")
//     text.setAttribute("id", `text-${num_qs}`);
//     text.setAttribute("type", "text");
//     // text.setAttribute("disabled", "");
//     text.setAttribute("value", q_name);
//
//     div.appendChild(chk);
//     div.appendChild(text);
//
//     if (q_type !== "String") {
//         type = document.createElement("b")
//         type.innerHTML = `(${q_type})`;
//         div.appendChild(type);
//     }
// }

// from passenger side qr-generate.js
num_qs = 0;
function addQuestionField(qidx, q) {
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
            break;
        case "Choice":
            var opt_idx = 1;
            for (var choice of q["Choices"]) {
                var opt = document.createElement("option"); opt.value = opt_idx++;
                opt.innerHTML = choice;

                answer.appendChild(opt);
            }
            break;
        case "String":
        default:
            answer.setAttribute("type", "text");
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

function showQuestions(indices) {
    clearQuestionFields();

    // TODO: ALL questions loaded to preserve index (needed for autofill), but this is inefficient
    const questions = loadQuestions();

    for (var idx of indices) {
        console.log(idx, questions[idx-1]);
        addQuestionField(idx, questions[idx-1]);
    }
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

function showQuestionChecklist() {
    for (const q of loadQuestions()) {
        addQuestionField(q);
    }
}

// const fs = require("fs");
function saveQuestions() {
    // var questions = [];
    // for (var i=1; i <= num_qs; ++i) {
    //     questions.push(document.getElementById(`text-${i}`).value);
    // }
    //
    // fs.writeFile("../central_db/question_db.json", `data=${JSON.stringify(questions)};`, (err) => {if (err) throw err;});
}

function getActiveQuestions() {
    qdiv = document.getElementById("questions");

    out = [];
    for (var i=1; i <= num_qs; ++i) {
        if (document.getElementById(`chk-${i}`).checked) {
            out.push(i);
        }
    }

    return out;
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
        // TODO: move conversion to validated forms outside of this func
        formName = {
            "Student": "Student With Prevalidation",
            "Senior Citizen": "Senior With Prevalidation",
            "PWD": "PWD With Prevalidation"
        }[formName] ?? formName;

        if (presets[formName] === undefined) {
            console.warn(`Unknown form ${formName}`)
        }
    } else {
        console.warn(`QR is for another form ${formName}`);
    }

    decodedFields = decodedFields.slice(4);
    // find END:
    var end_idx = -1;
    for (var idx=decodedFields.length-1; idx >=0; --idx) {
        var field = decodedFields[idx];
        if (field.startsWith("END:")) {
            end_idx = idx;
            break;
        }
    }

    // remove all fields after END:
    answers = decodedFields.slice(0, end_idx);

    // document.getElementById("ans-form-name").innerText = `(${formName})`;

    answer_form = ""
    answer_idx = 0;
    const questions = loadQuestions();

    const preset_fields = presets[formName];

    let raw_anslist = [];
    for (var qidx of preset_fields) {
        const q = questions[qidx-1];
        var raw_ans = answers[answer_idx++];
        raw_anslist.push({"Type": q["Type"], "Label": q["Label"], "Answer": raw_ans});
    }

    populateInfoDiv("ans-list", raw_anslist);

    // document.getElementById("ans-form-name").innerText = `(${formName})`;
    document.getElementById("answer-block").removeAttribute("hidden");
    // alert(`Got Discount application form:\n${answer_form}`);

    html5QrcodeScanner.clear();
    setTimeout(createScanner, 0);
}

function populateInfoDiv(divID, fields) {
    var ansdiv = document.getElementById(divID);
    clearAnswerList();

    var orig_idx = -1;
    var dest_idx = -1;
    for (var q of fields) {
        const type = q["Type"];
        const q_name = q["Label"];
        const raw_ans = q["Answer"];

        switch (type) {
            case "Image":
                // TODO: Implement
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
                break;
            case "Date":
            case "String":
            default:
                break;
        }
        const ans = `${raw_ans}`;
        answer_form += `${q_name}: ${ans}\n`;

        var qtext = document.createElement("label");
        qtext.innerText = `${q_name}: `;

        var anstext = document.createElement("b");
        anstext.innerText = `${ans}`;

        ansdiv.appendChild(qtext);
        ansdiv.appendChild(anstext);
        ansdiv.appendChild(document.createElement("br"));
    }

    const computed_fields = [];
    if (orig_idx != -1 && dest_idx != -1) {
        const fare = LRT2_SJT_fare[orig_idx][dest_idx];
        computed_fields.push(["Original Fare", fare]);
        computed_fields.push(["Discounted Fare", `PHP ${Math.floor(fare*0.8)} (PHP ${Math.floor(fare*0.2)} discount)`]);
    }

    for (const [name, val] of computed_fields) {
        var field_name = document.createElement("p");
        field_name.innerText = `${name}:`;

        var field_val = document.createElement("b");
        field_val.innerText = `${val}`;

        ansdiv.appendChild(field_name);
        ansdiv.appendChild(field_val);
        ansdiv.appendChild(document.createElement("br"));

        answer_form += `${name}: ${val}\n`;
    }

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
createScanner();
// END: Sample code from https://blog.minhazav.dev/research/html5-qrcode.html

function showAnswerReader() {
    document.getElementById("reader-block").removeAttribute("hidden");
}

function uncheckAllQuestions() {
    for (var i=1; i <= num_qs; ++i)
        document.getElementById(`chk-${i}`).checked = false;
}

function recheckQuestionPreset(presets, presetName) {
    uncheckAllQuestions();

    for (var idx of presets[presetName]) {
        document.getElementById(`chk-${idx}`).checked = true;
    }

    document.getElementById("form-name").innerText = `${presetName} Discount Form QR`;
}

function createPresetButtons(presets) {
    div = document.getElementById("presets");
    for (const preset in presets) {
        console.log(preset, presets[preset]);;
        button = document.createElement("input");
        button.setAttribute("type", "button");
        button.setAttribute("value", preset);
        button.onclick = () => {
            console.log("CLICKED " + preset + presets[preset])
            recheckQuestionPreset(presets, preset);
            generateForm(preset);
        };

        div.appendChild(button);
    }
}

function generateForm(formName) {
    makeCode(formName, getActiveQuestions());
    saveQuestions();
    showAnswerReader();
}

function clearAnswerList() {
    var ansdiv = document.getElementById("ans-list");
    while (ansdiv.hasChildNodes()) {
        ansdiv.removeChild(ansdiv.lastChild);
    }
}

function removePrevAnswerForm() {
    clearAnswerList();
    document.getElementById("answer-block").setAttribute("hidden", "");
}


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

function getUserDetails(subeoID) {
    let account_db = loadAccountDB();
    for (details of Object.values(account_db)) {
        if (details["subeoID"] === subeoID) {
            return subeoID;
        }
    }

    return null;
}

// showQuestionChecklist();
// createPresetButtons(presets);

// const defaultForm = "Student";
// recheckQuestionPreset(presets, defaultForm);
// generateForm(defaultForm);
const ORIG_STATION = 8;
const DEST_STATION = 9;
showQuestions([ORIG_STATION, DEST_STATION]);
